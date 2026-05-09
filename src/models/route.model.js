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
    routeName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    from: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    to: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    noOfBuses: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    avgTime: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    stopList: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "routes",
  }
);

module.exports = Route;