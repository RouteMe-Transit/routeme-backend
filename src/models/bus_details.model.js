const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusDetails = sequelize.define(
  "BusDetails",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    routeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "routes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    registrationNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "bus_details_registration_number_unique",
    },
    busType: {
      type: DataTypes.ENUM("A/C Express", "Semi-Luxury", "Regular"),
      allowNull: false,
      defaultValue: "Regular",
    },
    totalSeats: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 45,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    ownerName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    ownerNic: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ownerEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ownerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    drivers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    heading: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    speed: {
      type: DataTypes.DECIMAL(7, 2),
      allowNull: true,
    },
    gpsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    liveStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "inactive",
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM("Active", "Maintenance", "Breakdown"),
      allowNull: false,
      defaultValue: "Active",
    },
  },
  {
    tableName: "bus_details",
    indexes: [
      { fields: ["userId"] },
      { fields: ["routeId"] },
      { fields: ["liveStatus"] },
      { fields: ["lastSeenAt"] },
      { fields: ["status"] },
      {
        fields: ["registrationNumber"],
        unique: true,
        name: "bus_details_registration_number_unique",
      },
    ],
  }
);

module.exports = BusDetails;