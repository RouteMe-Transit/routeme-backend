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
      unique: true,
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
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "bus_details",
    indexes: [
      { fields: ["userId"] },
      { fields: ["routeId"] },
      { fields: ["registrationNumber"], unique: true },
    ],
  }
);

module.exports = BusDetails;