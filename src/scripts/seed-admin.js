require("dotenv").config();

const { sequelize, User } = require("../models");

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
};

const seedAdmin = async () => {
  const firstName = getArgValue("firstName") || process.env.ADMIN_FIRST_NAME || "System";
  const lastName = getArgValue("lastName") || process.env.ADMIN_LAST_NAME || "Admin";
  const email = getArgValue("email") || process.env.ADMIN_EMAIL;
  const password = getArgValue("password") || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Admin email and password are required. Set ADMIN_EMAIL and ADMIN_PASSWORD or pass --email and --password");
  }

  await sequelize.authenticate();
  await sequelize.sync();

  const existingAdminByEmail = await User.findOne({ where: { email } });
  if (existingAdminByEmail) {
    console.log(`Admin already exists for email: ${email}`);
    return;
  }

  const existingAnyAdmin = await User.findOne({ where: { role: "admin" } });
  if (existingAnyAdmin) {
    console.log("An admin user already exists. Skipping creation.");
    return;
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    confirmPassword: password,
    role: "admin",
    isActive: true,
  });

  console.log("First admin created successfully:");
  console.log({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  });
};

seedAdmin()
  .catch((error) => {
    console.error("Failed to seed first admin:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
