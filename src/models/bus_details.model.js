

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusDetails = sequelize.define(
  "BusDetails",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    plate: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    type: {
      type: DataTypes.ENUM("A/C Express", "Semi-Luxury", "Regular"),
      allowNull: false,
      defaultValue: "Regular",
    },
    assignedRoute: { type: DataTypes.STRING(100), allowNull: true },
    seats: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 45 },
    lastService: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM("Active", "Maintenance", "Breakdown"),
      allowNull: false,
      defaultValue: "Active",
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    ownerName: { type: DataTypes.STRING(150), allowNull: false },
    ownerNic: { type: DataTypes.STRING(20), allowNull: false },
    ownerEmail: { type: DataTypes.STRING(255), allowNull: false },
    ownerPhone: { type: DataTypes.STRING(20), allowNull: false },
    // drivers stored as JSON: [{name,nic,email,phone}]
    drivers: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  },
  {
    tableName: "bus_details",
  }
);

module.exports = BusDetails;