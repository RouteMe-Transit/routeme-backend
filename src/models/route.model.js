const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Route = sequelize.define(
  "Route",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    routeNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    routeName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    routeType: {
      type: DataTypes.ENUM("Normal", "Express", "Limited Stop", "Night Service"),
      allowNull: false,
      defaultValue: "Normal",
    },
    origin: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    distance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: "Distance in km",
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Duration in minutes",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "routes",
    defaultScope: {
      where: { isActive: true },
    },
    scopes: {
      withInactive: { where: {} },
    },
  }
);

module.exports = Route;