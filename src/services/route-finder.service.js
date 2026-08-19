// Passenger-facing Route Finder.
//
// Real algorithm (not mocked data):
//   1. Fuzzy-resolve the free-text "from"/"to" search terms to actual Stop rows.
//   2. Build a graph of every active route's ordered stop list (route_stops),
//      filling in missing per-stop times by linear interpolation.
//   3. Find DIRECT connections: any single route that visits both stops, in
//      either travel direction (forward = route.from->route.to, or return).
//   4. Find ONE-TRANSFER connections: pairs of routes that share a common stop
//      reachable from `from` on the first route and able to reach `to` on the
//      second, ranked by estimated total travel time (a bounded, heuristic
//      transfer search -- not full multi-day Dijkstra, which isn't needed at
//      this route-network size).
//   5. For the best candidates, pull live Trip rows (schedule, day-of-week,
//      bus) and scale the route's canonical stop-time table onto that trip's
//      actual departure/arrival clock times, so the times shown are real
//      per-trip ETAs rather than a static timetable.
//   6. Rank everything (live schedule available first, then soonest
//      departure, then shortest duration) and return the top results.
//
// The heavy scheduling math lives in ../utils/routeTime.util.js so it can be
// unit-tested without a database connection.

const { Op } = require("sequelize");
const { Route, RouteStop, Stop, Trip, BusDetails } = require("../models");
const ApiError = require("../utils/ApiError");
const {
  MINUTES_PER_DAY,
  minutesToLabel,
  formatDuration,
  dayAbbrevForDate,
  normalizeStopTimes,
  detectDirection,
  projectTripStopTimes,
  sliceProjectedSegment,
  estimateCanonicalDurationMinutes,
  parseTimeToMinutes,
} = require("../utils/routeTime.util");

const MAX_RESULTS = 8;
const MAX_TRANSFER_OPTIONS = 6;
const UPCOMING_TRIP_LIMIT = 3;
const TRIP_STATUSES = ["scheduled", "active", "delayed"];
const TRANSFER_BUFFER_MINUTES = 5;
const DAY_SEARCH_WINDOW = 8; // days ahead to look for a matching scheduled trip
const MAX_TRANSFER_WAIT_MINUTES = 180; // don't suggest a transfer that requires an unreasonably long layover

// ─── time helpers ───────────────────────────────────────────────────────────

function resolveAtDate(dateStr, timeStr) {
  const now = new Date();
  if (!dateStr && !timeStr) return now;

  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date(now);
  if (Number.isNaN(base.getTime())) throw new ApiError(422, 'Invalid "date", expected YYYY-MM-DD');

  if (timeStr) {
    const mins = parseTimeToMinutes(timeStr);
    if (mins === null) throw new ApiError(422, 'Invalid "time", expected HH:MM');
    base.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  } else if (dateStr) {
    base.setHours(0, 0, 0, 0);
  }
  return base;
}

function dayOffsetLabel(n) {
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `in ${n} days`;
}

// ─── stop resolution ────────────────────────────────────────────────────────

async function resolveStop(query) {
  const text = String(query || "").trim();
  if (!text) return null;

  const candidates = await Stop.findAll({
    where: { isActive: true, stopName: { [Op.like]: `%${text}%` } },
    limit: 20,
  });
  if (!candidates.length) return null;

  const lower = text.toLowerCase();
  const score = (stop) => {
    const name = stop.stopName.toLowerCase();
    if (name === lower) return 0;
    if (name.startsWith(lower)) return 1;
    if (name.includes(` ${lower}`)) return 2;
    return 3;
  };
  candidates.sort((a, b) => score(a) - score(b) || a.stopName.length - b.stopName.length);
  return candidates[0];
}

// ─── route/stop graph ───────────────────────────────────────────────────────

async function buildRouteStopGraph() {
  const routeStops = await RouteStop.findAll({
    include: [
      { model: Stop, as: "stop", attributes: ["id", "stopName", "isActive"] },
      { model: Route, as: "route", attributes: ["id", "routeName", "from", "to", "isActive"] },
    ],
    order: [["routeId", "ASC"], ["stopSequence", "ASC"]],
  });

  const byRoute = new Map();
  for (const rs of routeStops) {
    if (!rs.route || !rs.route.isActive) continue;
    if (!rs.stop || !rs.stop.isActive) continue;
    if (!byRoute.has(rs.routeId)) byRoute.set(rs.routeId, { route: rs.route, stops: [] });
    byRoute.get(rs.routeId).stops.push({
      stopId: rs.stopId,
      stopName: rs.stop.stopName,
      stopSequence: rs.stopSequence,
      time: rs.time,
    });
  }

  for (const entry of byRoute.values()) {
    entry.stops.sort((a, b) => a.stopSequence - b.stopSequence);
    entry.canonical = normalizeStopTimes(entry.stops);
  }

  return byRoute;
}

async function getRouteEntry(routeId) {
  const route = await Route.findByPk(routeId);
  if (!route || !route.isActive) return null;

  const routeStops = await RouteStop.findAll({
    where: { routeId },
    include: [{ model: Stop, as: "stop", attributes: ["id", "stopName", "isActive"] }],
    order: [["stopSequence", "ASC"]],
  });

  const stops = routeStops
    .filter((rs) => rs.stop && rs.stop.isActive)
    .map((rs) => ({ stopId: rs.stopId, stopName: rs.stop.stopName, stopSequence: rs.stopSequence, time: rs.time }));

  return { route, stops, canonical: normalizeStopTimes(stops) };
}

// ─── live schedule lookup ───────────────────────────────────────────────────

/**
 * Next `limit` upcoming trips for a route+direction at/after `atDate`,
 * respecting each trip's `days` (day-of-week) schedule, searched up to
 * DAY_SEARCH_WINDOW days ahead. Each result carries `dayOffset` (0 = today)
 * and `departureMinutes`/`arrivalMinutes` (minutes-of-day, local clock).
 */
async function getUpcomingTrips(routeId, direction, atDate, limit = UPCOMING_TRIP_LIMIT) {
  const trips = await Trip.findAll({
    where: { routeId, direction, isActive: true, status: { [Op.in]: TRIP_STATUSES } },
    include: [{ model: BusDetails, as: "bus", attributes: ["id", "registrationNumber", "busType"] }],
  });

  const parsed = trips
    .map((trip) => ({
      trip,
      departureMinutes: parseTimeToMinutes(trip.departureTime),
      arrivalMinutes: parseTimeToMinutes(trip.arrivalTime),
      days: Array.isArray(trip.days) ? trip.days : [],
    }))
    .filter((t) => t.departureMinutes !== null && t.arrivalMinutes !== null && t.days.length);

  const results = [];
  for (let dayOffset = 0; dayOffset < DAY_SEARCH_WINDOW && results.length < limit; dayOffset++) {
    const checkDate = new Date(atDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dayAbbr = dayAbbrevForDate(checkDate);
    const minFloor = dayOffset === 0 ? atDate.getHours() * 60 + atDate.getMinutes() : -1;

    const dayTrips = parsed
      .filter((t) => t.days.includes(dayAbbr) && t.departureMinutes >= minFloor)
      .sort((a, b) => a.departureMinutes - b.departureMinutes);

    for (const t of dayTrips) {
      results.push({ ...t, dayOffset, dayAbbr });
      if (results.length >= limit) break;
    }
  }
  return results;
}

// ─── direct matches ─────────────────────────────────────────────────────────

async function buildDirectResults(fromStop, toStop, graph, atDate) {
  const out = [];

  for (const entry of graph.values()) {
    const dir = detectDirection(entry.canonical, fromStop.id, toStop.id);
    if (!dir) continue;

    const upcoming = await getUpcomingTrips(entry.route.id, dir.direction, atDate, UPCOMING_TRIP_LIMIT);
    const canonicalDuration = estimateCanonicalDurationMinutes(entry.canonical, dir.fromIdx, dir.toIdx);

    if (upcoming.length) {
      const u = upcoming[0];
      const projected = projectTripStopTimes(entry.canonical, dir.direction, u.departureMinutes, u.arrivalMinutes);
      const segment = sliceProjectedSegment(projected, fromStop.id, toStop.id);
      if (!segment) continue;

      const boardAt = segment[0].actualMinutes + u.dayOffset * MINUTES_PER_DAY;
      const alightAt = segment[segment.length - 1].actualMinutes + u.dayOffset * MINUTES_PER_DAY;

      out.push(
        makeDirectResult({
          entry, dir, fromStop, toStop,
          hasLiveTrip: true, trip: u,
          boardAt, alightAt,
          durationMinutes: Math.max(1, alightAt - boardAt),
        })
      );
    } else {
      out.push(
        makeDirectResult({
          entry, dir, fromStop, toStop,
          hasLiveTrip: false,
          durationMinutes: canonicalDuration,
        })
      );
    }
  }

  return out;
}

function makeDirectResult({ entry, dir, fromStop, toStop, hasLiveTrip, trip, boardAt, alightAt, durationMinutes }) {
  const dirCode = dir.direction === "forward" ? "f" : "r";
  const busLabel = hasLiveTrip && trip.trip.bus ? `${trip.trip.bus.busType}` : null;

  return {
    id: `d-${entry.route.id}-${dirCode}`,
    type: "direct",
    title: entry.route.routeName,
    subtitle: `${fromStop.stopName} → ${toStop.stopName}`,
    time: hasLiveTrip ? minutesToLabel(boardAt) : "No scheduled trips",
    note: hasLiveTrip
      ? `${formatDuration(durationMinutes)} • ${dayOffsetLabel(trip.dayOffset)}${busLabel ? " • " + busLabel : ""}`
      : `${formatDuration(durationMinutes)} est. • no live schedule`,
    highlight: false,
    transfers: 0,
    durationMinutes,
    hasLiveTrip,
    departureMinutes: hasLiveTrip ? boardAt : null,
    arrivalMinutes: hasLiveTrip ? alightAt : null,
    dayOffset: hasLiveTrip ? trip.dayOffset : null,
    legs: [
      {
        routeId: entry.route.id,
        routeName: entry.route.routeName,
        direction: dir.direction,
        fromStopId: fromStop.id,
        fromStopName: fromStop.stopName,
        toStopId: toStop.id,
        toStopName: toStop.stopName,
        tripId: hasLiveTrip ? trip.trip.id : null,
        busRegistration: hasLiveTrip ? trip.trip.bus?.registrationNumber ?? null : null,
      },
    ],
  };
}

// ─── one-transfer matches ───────────────────────────────────────────────────

function onwardDirectionsFrom(entry, stopId) {
  const idx = entry.canonical.findIndex((s) => s.stopId === stopId);
  if (idx === -1) return [];
  const dirs = [];
  if (idx < entry.canonical.length - 1) {
    dirs.push({ direction: "forward", fromIdx: idx, reachable: new Set(entry.canonical.slice(idx + 1).map((s) => s.stopId)) });
  }
  if (idx > 0) {
    dirs.push({ direction: "return", fromIdx: idx, reachable: new Set(entry.canonical.slice(0, idx).map((s) => s.stopId)) });
  }
  return dirs;
}

function approachDirectionsTo(entry, stopId) {
  const idx = entry.canonical.findIndex((s) => s.stopId === stopId);
  if (idx === -1) return [];
  const dirs = [];
  if (idx > 0) {
    dirs.push({ direction: "forward", toIdx: idx, reachableFrom: new Set(entry.canonical.slice(0, idx).map((s) => s.stopId)) });
  }
  if (idx < entry.canonical.length - 1) {
    dirs.push({ direction: "return", toIdx: idx, reachableFrom: new Set(entry.canonical.slice(idx + 1).map((s) => s.stopId)) });
  }
  return dirs;
}

async function buildTransferResults(fromStop, toStop, graph, atDate, directCount) {
  if (directCount >= MAX_RESULTS) return [];

  const candidates = [];

  for (const entryA of graph.values()) {
    const fromDirs = onwardDirectionsFrom(entryA, fromStop.id);
    if (!fromDirs.length) continue;

    for (const entryB of graph.values()) {
      if (entryB.route.id === entryA.route.id) continue;
      const toDirs = approachDirectionsTo(entryB, toStop.id);
      if (!toDirs.length) continue;

      for (const fd of fromDirs) {
        for (const td of toDirs) {
          let bestStopId = null;
          let bestScore = Infinity;

          for (const stopId of fd.reachable) {
            if (stopId === fromStop.id || stopId === toStop.id) continue;
            if (!td.reachableFrom.has(stopId)) continue;

            const idxA = entryA.canonical.findIndex((s) => s.stopId === stopId);
            const idxB = entryB.canonical.findIndex((s) => s.stopId === stopId);
            const durA = estimateCanonicalDurationMinutes(entryA.canonical, fd.fromIdx, idxA);
            const durB = estimateCanonicalDurationMinutes(entryB.canonical, idxB, td.toIdx);
            const score = durA + durB;
            if (score < bestScore) { bestScore = score; bestStopId = stopId; }
          }

          if (bestStopId !== null) {
            candidates.push({ entryA, dirA: fd.direction, entryB, dirB: td.direction, transferStopId: bestStopId, estMinutes: bestScore });
          }
        }
      }
    }
  }

  candidates.sort((a, b) => a.estMinutes - b.estMinutes);
  const top = candidates.slice(0, MAX_TRANSFER_OPTIONS);

  const results = [];
  for (const c of top) {
    const r = await buildTransferResult(c, fromStop, toStop, atDate);
    if (r) results.push(r);
  }
  return results;
}

async function buildTransferResult(c, fromStop, toStop, atDate) {
  const { entryA, dirA, entryB, dirB, transferStopId } = c;
  const transferStop = entryA.canonical.find((s) => s.stopId === transferStopId);
  if (!transferStop) return null;

  const idxAFrom = entryA.canonical.findIndex((s) => s.stopId === fromStop.id);
  const idxATransfer = entryA.canonical.findIndex((s) => s.stopId === transferStopId);
  const idxBTransfer = entryB.canonical.findIndex((s) => s.stopId === transferStopId);
  const idxBTo = entryB.canonical.findIndex((s) => s.stopId === toStop.id);
  const durA = estimateCanonicalDurationMinutes(entryA.canonical, idxAFrom, idxATransfer);
  const durB = estimateCanonicalDurationMinutes(entryB.canonical, idxBTransfer, idxBTo);

  const upcomingA = await getUpcomingTrips(entryA.route.id, dirA, atDate, UPCOMING_TRIP_LIMIT);
  if (!upcomingA.length) {
    return makeTransferResult({
      entryA, dirA, entryB, dirB, fromStop, toStop, transferStop,
      hasLiveTrip: false, durationMinutes: durA + durB + TRANSFER_BUFFER_MINUTES,
    });
  }

  const tripA = upcomingA[0];
  const projectedA = projectTripStopTimes(entryA.canonical, dirA, tripA.departureMinutes, tripA.arrivalMinutes);
  const segA = sliceProjectedSegment(projectedA, fromStop.id, transferStopId);
  if (!segA) {
    return makeTransferResult({
      entryA, dirA, entryB, dirB, fromStop, toStop, transferStop,
      hasLiveTrip: false, durationMinutes: durA + durB + TRANSFER_BUFFER_MINUTES,
    });
  }

  const boardAt = segA[0].actualMinutes + tripA.dayOffset * MINUTES_PER_DAY;
  const arriveTransfer = segA[segA.length - 1].actualMinutes + tripA.dayOffset * MINUTES_PER_DAY;
  const minConnectMinutes = arriveTransfer + TRANSFER_BUFFER_MINUTES;

  const maxConnectMinutes = minConnectMinutes + MAX_TRANSFER_WAIT_MINUTES;
  const upcomingB = await getUpcomingTrips(entryB.route.id, dirB, atDate, UPCOMING_TRIP_LIMIT * 3);
  let legB = null;
  for (const tripB of upcomingB) {
    const projectedB = projectTripStopTimes(entryB.canonical, dirB, tripB.departureMinutes, tripB.arrivalMinutes);
    const transferIdxB = projectedB.findIndex((s) => s.stopId === transferStopId);
    if (transferIdxB === -1) continue;

    const departTransfer = projectedB[transferIdxB].actualMinutes + tripB.dayOffset * MINUTES_PER_DAY;
    if (departTransfer < minConnectMinutes) continue;
    // getUpcomingTrips returns trips in chronological order, so once a
    // candidate is further out than the acceptable layover window, every
    // later one will be too -- stop instead of "connecting" to a bus that
    // runs again next week.
    if (departTransfer > maxConnectMinutes) break;

    const segB = sliceProjectedSegment(projectedB, transferStopId, toStop.id);
    if (!segB) continue;

    legB = { tripB, departTransfer, alightAt: segB[segB.length - 1].actualMinutes + tripB.dayOffset * MINUTES_PER_DAY };
    break;
  }

  if (!legB) {
    return makeTransferResult({
      entryA, dirA, entryB, dirB, fromStop, toStop, transferStop,
      hasLiveTrip: false, durationMinutes: durA + durB + TRANSFER_BUFFER_MINUTES,
    });
  }

  return makeTransferResult({
    entryA, dirA, entryB, dirB, fromStop, toStop, transferStop,
    hasLiveTrip: true,
    tripA, tripB: legB.tripB,
    boardAt, arriveTransfer, departTransfer: legB.departTransfer, alightAt: legB.alightAt,
    durationMinutes: Math.max(1, legB.alightAt - boardAt),
  });
}

function makeTransferResult(p) {
  const { entryA, dirA, entryB, dirB, fromStop, toStop, transferStop, hasLiveTrip, durationMinutes } = p;
  const codeA = dirA === "forward" ? "f" : "r";
  const codeB = dirB === "forward" ? "f" : "r";

  const note = hasLiveTrip
    ? `${formatDuration(durationMinutes)} • ${dayOffsetLabel(p.tripA.dayOffset)} • 1 transfer at ${transferStop.stopName}`
    : `${formatDuration(durationMinutes)} est. • 1 transfer at ${transferStop.stopName} • schedule unavailable`;

  return {
    id: `t-${entryA.route.id}-${codeA}-${entryB.route.id}-${codeB}-${transferStop.stopId}`,
    type: "transfer",
    title: `${entryA.route.routeName} + ${entryB.route.routeName}`,
    subtitle: `${fromStop.stopName} → ${transferStop.stopName} → ${toStop.stopName}`,
    time: hasLiveTrip ? minutesToLabel(p.boardAt) : "No scheduled trips",
    note,
    highlight: false,
    transfers: 1,
    durationMinutes,
    hasLiveTrip,
    departureMinutes: hasLiveTrip ? p.boardAt : null,
    arrivalMinutes: hasLiveTrip ? p.alightAt : null,
    dayOffset: hasLiveTrip ? p.tripA.dayOffset : null,
    legs: [
      {
        routeId: entryA.route.id, routeName: entryA.route.routeName, direction: dirA,
        fromStopId: fromStop.id, fromStopName: fromStop.stopName,
        toStopId: transferStop.stopId, toStopName: transferStop.stopName,
        tripId: hasLiveTrip ? p.tripA.trip.id : null,
      },
      {
        routeId: entryB.route.id, routeName: entryB.route.routeName, direction: dirB,
        fromStopId: transferStop.stopId, fromStopName: transferStop.stopName,
        toStopId: toStop.id, toStopName: toStop.stopName,
        tripId: hasLiveTrip ? p.tripB.trip.id : null,
      },
    ],
  };
}

// ─── ranking ─────────────────────────────────────────────────────────────────

function rankResults(results) {
  const sorted = results.slice().sort((a, b) => {
    if (a.hasLiveTrip !== b.hasLiveTrip) return a.hasLiveTrip ? -1 : 1;
    if (a.hasLiveTrip && b.hasLiveTrip) {
      const da = (a.dayOffset ?? 99) * MINUTES_PER_DAY + (a.departureMinutes ?? 0);
      const db = (b.dayOffset ?? 99) * MINUTES_PER_DAY + (b.departureMinutes ?? 0);
      if (da !== db) return da - db;
    }
    return a.durationMinutes - b.durationMinutes;
  });

  const top = sorted.slice(0, MAX_RESULTS);
  if (top.length) top[0].highlight = true;
  return top;
}

// ─── public API ──────────────────────────────────────────────────────────────

const search = async ({ from, to, date, time } = {}) => {
  if (!from || !String(from).trim()) throw new ApiError(422, '"from" is required');
  if (!to || !String(to).trim()) throw new ApiError(422, '"to" is required');

  const [fromStop, toStop] = await Promise.all([resolveStop(from), resolveStop(to)]);
  if (!fromStop) throw new ApiError(404, `No stop found matching "${from}"`);
  if (!toStop) throw new ApiError(404, `No stop found matching "${to}"`);
  if (fromStop.id === toStop.id) throw new ApiError(422, "Origin and destination are the same stop");

  const atDate = resolveAtDate(date, time);
  const graph = await buildRouteStopGraph();

  const direct = await buildDirectResults(fromStop, toStop, graph, atDate);
  const transfer = await buildTransferResults(fromStop, toStop, graph, atDate, direct.length);

  const routes = rankResults([...direct, ...transfer]);

  return {
    from: { id: fromStop.id, name: fromStop.stopName },
    to: { id: toStop.id, name: toStop.stopName },
    searchedAt: atDate.toISOString(),
    routes,
  };
};

const getDetails = async (resultId, { date, time } = {}) => {
  if (!resultId) throw new ApiError(422, "Result id is required");
  const atDate = resolveAtDate(date, time);
  const parts = String(resultId).split("-");

  if (parts[0] === "d" && parts.length === 3) {
    const routeId = parseInt(parts[1], 10);
    const direction = parts[2] === "f" ? "forward" : parts[2] === "r" ? "return" : null;
    if (!Number.isInteger(routeId) || !direction) throw new ApiError(400, "Invalid route result id");

    const entry = await getRouteEntry(routeId);
    if (!entry) throw new ApiError(404, "Route not found");

    const upcoming = await getUpcomingTrips(routeId, direction, atDate, 1);
    let stopsOut;
    let hasLiveTrip = false;

    if (upcoming.length) {
      hasLiveTrip = true;
      const projected = projectTripStopTimes(entry.canonical, direction, upcoming[0].departureMinutes, upcoming[0].arrivalMinutes);
      stopsOut = projected.map((s) => ({ name: s.stopName, time: minutesToLabel(s.actualMinutes) }));
    } else {
      const ordered = direction === "return" ? entry.canonical.slice().reverse() : entry.canonical;
      stopsOut = ordered.map((s) => ({ name: s.stopName, time: minutesToLabel(s.timeMinutes) }));
    }

    return {
      id: resultId,
      routeId,
      direction,
      title: entry.route.routeName,
      subtitle: direction === "forward" ? `${entry.route.from} → ${entry.route.to}` : `${entry.route.to} → ${entry.route.from}`,
      transfers: 0,
      hasLiveTrip,
      stops: stopsOut,
    };
  }

  if (parts[0] === "t" && parts.length === 6) {
    const routeIdA = parseInt(parts[1], 10);
    const dirA = parts[2] === "f" ? "forward" : "return";
    const routeIdB = parseInt(parts[3], 10);
    const dirB = parts[4] === "f" ? "forward" : "return";
    const transferStopId = parseInt(parts[5], 10);
    if (![routeIdA, routeIdB, transferStopId].every(Number.isInteger)) throw new ApiError(400, "Invalid route result id");

    const [entryA, entryB] = await Promise.all([getRouteEntry(routeIdA), getRouteEntry(routeIdB)]);
    if (!entryA || !entryB) throw new ApiError(404, "Route not found");

    const upcomingA = await getUpcomingTrips(routeIdA, dirA, atDate, 1);
    let stopsA, hasLiveA = false;
    if (upcomingA.length) {
      hasLiveA = true;
      stopsA = projectTripStopTimes(entryA.canonical, dirA, upcomingA[0].departureMinutes, upcomingA[0].arrivalMinutes);
    } else {
      const orderedA = dirA === "return" ? entryA.canonical.slice().reverse() : entryA.canonical;
      stopsA = orderedA.map((s) => ({ stopId: s.stopId, stopName: s.stopName, actualMinutes: s.timeMinutes }));
    }
    const transferIdxA = stopsA.findIndex((s) => s.stopId === transferStopId);
    const legAStops = transferIdxA === -1 ? stopsA : stopsA.slice(0, transferIdxA + 1);

    const upcomingB = await getUpcomingTrips(routeIdB, dirB, atDate, 1);
    let stopsB, hasLiveB = false;
    if (upcomingB.length) {
      hasLiveB = true;
      stopsB = projectTripStopTimes(entryB.canonical, dirB, upcomingB[0].departureMinutes, upcomingB[0].arrivalMinutes);
    } else {
      const orderedB = dirB === "return" ? entryB.canonical.slice().reverse() : entryB.canonical;
      stopsB = orderedB.map((s) => ({ stopId: s.stopId, stopName: s.stopName, actualMinutes: s.timeMinutes }));
    }
    const transferIdxB = stopsB.findIndex((s) => s.stopId === transferStopId);
    const legBStops = transferIdxB === -1 ? stopsB : stopsB.slice(transferIdxB + 1);

    const transferStopName = entryA.canonical.find((s) => s.stopId === transferStopId)?.stopName ?? null;

    return {
      id: resultId,
      title: `${entryA.route.routeName} + ${entryB.route.routeName}`,
      subtitle: `via ${transferStopName ?? "transfer stop"}`,
      transfers: 1,
      hasLiveTrip: hasLiveA && hasLiveB,
      transferStop: { id: transferStopId, name: transferStopName },
      legs: [
        { routeId: routeIdA, routeName: entryA.route.routeName, direction: dirA },
        { routeId: routeIdB, routeName: entryB.route.routeName, direction: dirB },
      ],
      stops: [...legAStops, ...legBStops].map((s) => ({ name: s.stopName, time: minutesToLabel(s.actualMinutes) })),
    };
  }

  throw new ApiError(400, "Invalid route result id");
};

module.exports = { search, getDetails, resolveStop, buildRouteStopGraph, getRouteEntry, getUpcomingTrips };