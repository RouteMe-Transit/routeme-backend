require("dotenv").config();

const { sequelize, User } = require("../models");

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
};

const seedUsers = async () => {
  const adminEmail = getArgValue("adminEmail") || process.env.ADMIN_EMAIL || "admin@local.test";
  const adminPassword = getArgValue("adminPassword") || process.env.ADMIN_PASSWORD || "Admin123!";
  const passengerEmail = getArgValue("passengerEmail") || process.env.PASSENGER_EMAIL || "passenger@local.test";
  const passengerPassword = getArgValue("passengerPassword") || process.env.PASSENGER_PASSWORD || "Passenger123!";
  const driverEmail = getArgValue("driverEmail") || process.env.DRIVER_EMAIL || "driver@local.test";
  const driverPassword = getArgValue("driverPassword") || process.env.DRIVER_PASSWORD || "Driver123!";

  await sequelize.authenticate();
  await sequelize.sync();

  // Helper to create user if not exists
  const createIfNotExists = async ({ email, password, firstName, lastName, role }) => {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`User already exists for email: ${email} (role: ${existing.role})`);
      return existing;
    }

    const user = await User.create({
      firstName: firstName || role,
      lastName: lastName || "User",
      email,
      password,
      role,
      isActive: true,
    });

    console.log(`Created ${role} -> ${email}`);
    return user;
  };

  await createIfNotExists({ email: adminEmail, password: adminPassword, firstName: "System", lastName: "Admin", role: "admin" });
  await createIfNotExists({ email: passengerEmail, password: passengerPassword, firstName: "Demo", lastName: "Passenger", role: "passenger" });
  await createIfNotExists({ email: driverEmail, password: driverPassword, firstName: "Demo", lastName: "Driver", role: "bus" });

  console.log("Seeding complete. Credentials:");
  console.log({ adminEmail, adminPassword, passengerEmail, passengerPassword, driverEmail, driverPassword });
};

seedUsers()
  .catch((err) => {
    console.error("Failed to seed users:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
