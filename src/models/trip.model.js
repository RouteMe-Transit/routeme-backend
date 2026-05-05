const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Trip = sequelize.define(
  "Trip",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    routeName: {
      type: DataTypes.STRING(100),
      allowNull: false, // e.g. "Route 120"
    },
    direction: {
      type: DataTypes.ENUM("Forward", "Return"),
      allowNull: false,
      defaultValue: "Forward",
    },
    from: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    to: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    departure: {
      type: DataTypes.STRING(10),
      allowNull: false, // "08:30"
    },
    arrival: {
      type: DataTypes.STRING(10),
      allowNull: false, // "09:40"
    },
    duration: {
      type: DataTypes.STRING(20),
      allowNull: true, // "1h 10m"
    },
    busId: {
      type: DataTypes.STRING(30),
      allowNull: true, // "CP NB-1234"
    },
    driverName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    days: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Mon-Sat", // "Mon-Sat"
    },
    status: {
      type: DataTypes.ENUM("Active", "Scheduled", "Delayed", "Completed"),
      allowNull: false,
      defaultValue: "Scheduled",
    },
  },
  {
    tableName: "trips",
    defaultScope: {
      where: { isDeleted: false },
    },
    indexes: [
      { fields: ["routeName"] },
      { fields: ["status"] },
      { fields: ["days"] },
    ],
  }
);

module.exports = Trip;