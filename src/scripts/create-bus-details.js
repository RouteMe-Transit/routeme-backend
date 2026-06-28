require('dotenv').config();

const { sequelize, User, BusDetails } = require('../models');

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
};

const run = async () => {
  const email = getArgValue('email') || process.env.DRIVER_EMAIL || 'driver@local.test';
  const registrationNumber = getArgValue('reg') || process.env.DRIVER_REG || 'BUS-001';
  const ownerName = getArgValue('ownerName') || 'Owner';
  const ownerNic = getArgValue('ownerNic') || 'N/A';
  const ownerEmail = getArgValue('ownerEmail') || 'owner@local.test';
  const ownerPhone = getArgValue('ownerPhone') || '0000000000';

  await sequelize.authenticate();
  await sequelize.sync();

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error('Bus user not found for email:', email);
    process.exit(1);
  }

  const existing = await BusDetails.findOne({ where: { userId: user.id } });
  if (existing) {
    console.log('BusDetails already exists for user:', email, 'reg:', existing.registrationNumber);
    process.exit(0);
  }

  const bd = await BusDetails.create({
    userId: user.id,
    registrationNumber,
    ownerName,
    ownerNic,
    ownerEmail,
    ownerPhone,
    drivers: [],
  });

  console.log('Created BusDetails:', { id: bd.id, registrationNumber });
};

run()
  .catch((err) => {
    console.error('Failed to create bus details:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
