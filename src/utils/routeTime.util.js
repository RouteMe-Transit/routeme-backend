"use strict";

/**
 * Pure, dependency-free helpers used by the passenger Route Finder algorithm
 * (src/services/route-finder.service.js). Kept separate from the DB layer so
 * the scheduling math can be unit-tested without a database connection.
 */

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MINUTES_PER_DAY = 1440;

/**
 * Parse "HH:MM", "HH:MM:SS", or "HH.MM" into minutes-of-day (0-1439).
 * Returns null if the value can't be parsed as a clock time.
 */
function parseTimeToMinutes(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function wrapMinutes(minutes) {
  return ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** 24h "HH:MM" */
function minutesToHHMM(minutes) {
  const wrapped = wrapMinutes(minutes);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 12h "h:MM AM/PM" for display */
function minutesToLabel(minutes) {
  const wrapped = wrapMinutes(minutes);
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** "1h 05m" / "45m" */
function formatDuration(minutesInput) {
  const total = Math.max(0, Math.round(minutesInput));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function dayAbbrevForDate(date) {
  return DAY_ABBR[date.getDay()];
}

/**
 * Given a route's stops in ascending stopSequence order, fill in a numeric
 * `timeMinutes` for every stop -- linearly interpolating between whichever
 * stops have a parseable `time`, and extrapolating/falling back to an even
 * spacing (fallbackMinutesPerStop) where no timestamps exist at all.
 * Returns a new array; does not mutate the input.
 */
function normalizeStopTimes(stopsOrdered, fallbackMinutesPerStop = 4) {
  const stops = stopsOrdered.map((s) => ({ ...s, timeMinutes: parseTimeToMinutes(s.time) }));
  const knownIdx = [];
  stops.forEach((s, i) => { if (s.timeMinutes !== null) knownIdx.push(i); });

  if (knownIdx.length === 0) {
    stops.forEach((s, i) => { s.timeMinutes = i * fallbackMinutesPerStop; });
    return stops;
  }

  const first = knownIdx[0];
  for (let i = first - 1; i >= 0; i--) {
    stops[i].timeMinutes = stops[i + 1].timeMinutes - fallbackMinutesPerStop;
  }

  const last = knownIdx[knownIdx.length - 1];
  for (let i = last + 1; i < stops.length; i++) {
    stops[i].timeMinutes = stops[i - 1].timeMinutes + fallbackMinutesPerStop;
  }

  for (let k = 0; k < knownIdx.length - 1; k++) {
    const a = knownIdx[k];
    const b = knownIdx[k + 1];
    const span = stops[b].timeMinutes - stops[a].timeMinutes;
    const steps = b - a;
    if (steps > 1) {
      for (let i = a + 1; i < b; i++) {
        const frac = (i - a) / steps;
        stops[i].timeMinutes = stops[a].timeMinutes + span * frac;
      }
    }
  }

  return stops;
}

/**
 * Determine whether/how a route connects fromStopId -> toStopId, using the
 * route's canonical (forward, ascending stopSequence) stop order.
 * Returns null if either stop isn't on the route, or they're the same stop.
 */
function detectDirection(canonicalStopsWithTimes, fromStopId, toStopId) {
  const fromIdx = canonicalStopsWithTimes.findIndex((s) => s.stopId === fromStopId);
  const toIdx = canonicalStopsWithTimes.findIndex((s) => s.stopId === toStopId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return null;

  return {
    direction: fromIdx < toIdx ? "forward" : "return",
    fromIdx,
    toIdx,
  };
}

/**
 * Project every stop on a route onto one specific trip's actual clock times,
 * by scaling the route's canonical (timetable) spacing to that trip's real
 * departure/arrival span. Returns stops in travel order (already reversed
 * for "return" trips) with an `actualMinutes` field per stop.
 */
function projectTripStopTimes(canonicalStopsWithTimes, direction, tripDepartureMinutes, tripArrivalMinutes) {
  const first = canonicalStopsWithTimes[0];
  const last = canonicalStopsWithTimes[canonicalStopsWithTimes.length - 1];

  let routeSpan = last.timeMinutes - first.timeMinutes;
  if (!(routeSpan > 0)) routeSpan = (canonicalStopsWithTimes.length - 1) * 4 || 1;

  let tripSpan = tripArrivalMinutes - tripDepartureMinutes;
  if (tripSpan <= 0) tripSpan += MINUTES_PER_DAY; // overnight trip

  const scale = tripSpan / routeSpan;

  const ordered = direction === "return"
    ? canonicalStopsWithTimes.slice().reverse()
    : canonicalStopsWithTimes;

  const originTime = direction === "return" ? last.timeMinutes : first.timeMinutes;

  return ordered.map((s) => ({
    stopId: s.stopId,
    stopName: s.stopName,
    stopSequence: s.stopSequence,
    actualMinutes: tripDepartureMinutes + Math.abs(s.timeMinutes - originTime) * scale,
  }));
}

/**
 * Extract the inclusive from->to slice out of an already travel-ordered,
 * trip-projected stop list (see projectTripStopTimes). Returns null if
 * either endpoint is missing.
 */
function sliceProjectedSegment(orderedProjectedStops, fromStopId, toStopId) {
  const fromIdx = orderedProjectedStops.findIndex((s) => s.stopId === fromStopId);
  const toIdx = orderedProjectedStops.findIndex((s) => s.stopId === toStopId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx > toIdx) return null;
  return orderedProjectedStops.slice(fromIdx, toIdx + 1);
}

/**
 * Fallback, schedule-free duration estimate between two stops on a route
 * using only the canonical (timetable) stop times -- used when no live Trip
 * rows are available to scale against.
 */
function estimateCanonicalDurationMinutes(canonicalStopsWithTimes, fromIdx, toIdx) {
  const a = canonicalStopsWithTimes[fromIdx].timeMinutes;
  const b = canonicalStopsWithTimes[toIdx].timeMinutes;
  const duration = Math.abs(b - a);
  return duration > 0 ? duration : Math.abs(toIdx - fromIdx) * 4;
}

module.exports = {
  DAY_ABBR,
  MINUTES_PER_DAY,
  parseTimeToMinutes,
  minutesToHHMM,
  minutesToLabel,
  formatDuration,
  dayAbbrevForDate,
  normalizeStopTimes,
  detectDirection,
  projectTripStopTimes,
  sliceProjectedSegment,
  estimateCanonicalDurationMinutes,
};