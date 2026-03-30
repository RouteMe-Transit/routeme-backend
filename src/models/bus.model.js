const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Bus = sequelize.define(
  "Bus",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    busNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    licensePlate: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    busType: {
      type: DataTypes.ENUM("A/C Express", "Non A/C", "Semi Luxury", "Luxury", "Mini Bus"),
      allowNull: false,
      defaultValue: "A/C Express",
    },
    make: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    seatingCapacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    standingCapacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    fuelType: {
      type: DataTypes.ENUM("Diesel", "Petrol", "Electric", "Hybrid"),
      allowNull: true,
      defaultValue: "Diesel",
    },
    assignRoute: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    assignDriver: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    shift: {
      type: DataTypes.ENUM("Morning 5AM", "Morning 9AM", "Afternoon", "Evening", "Night"),
      allowNull: true,
    },
    depot: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive", "Under Maintenance"),
      allowNull: false,
      defaultValue: "Active",
    },
    serviceDays: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of active service days e.g. ['Mon','Tue','Wed']",
    },
    revenueLicenseExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    insuranceExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    lastServiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nextServiceDue: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "buses",
    defaultScope: {
      where: { isActive: true },
    },
    scopes: {
      withInactive: { where: {} },
    },
  }
);

module.exports = Bus;