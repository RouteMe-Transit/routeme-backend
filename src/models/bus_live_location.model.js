const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusLiveLocation = sequelize.define(
  "BusLiveLocation",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    busId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "bus_details", key: "id" },
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
    routeName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    from: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    to: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
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
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "active",
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "bus_live_locations",
    updatedAt: false,
    indexes: [
      { fields: ["busId", "recordedAt"] },
      { fields: ["routeId", "recordedAt"] },
      { fields: ["routeName"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = BusLiveLocation;
