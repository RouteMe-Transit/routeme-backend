const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RouteStop = sequelize.define(
  "RouteStop",
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
      onDelete: "CASCADE",
    },
    stopId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stops", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    stopSequence: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    time: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: "route_stops",
    indexes: [
      { fields: ["routeId"] },
      { fields: ["stopId"] },
      { fields: ["stopSequence"] },
    ],
  }
);

module.exports = RouteStop;
