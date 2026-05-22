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
    routeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "routes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    busId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "bus_details", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    direction: {
      type: DataTypes.ENUM("forward", "return"),
      allowNull: false,
      defaultValue: "forward",
      comment: "forward = from→to, return = to→from",
    },
    departureTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    arrivalTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    days: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: "e.g. ['Mon','Tue','Wed','Thu','Fri','Sat']",
    },
    status: {
      type: DataTypes.ENUM("active", "scheduled", "delayed", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "scheduled",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "trips",
    timestamps: true,
  }
);

module.exports = Trip;