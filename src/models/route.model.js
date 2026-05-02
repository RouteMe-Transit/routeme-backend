const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Route = sequelize.define(
  "Route",
  {
    id:       { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name:     { type: DataTypes.STRING(100), allowNull: false },
    from:     { type: DataTypes.STRING(150), allowNull: false },
    to:       { type: DataTypes.STRING(150), allowNull: false },
    buses:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    avgTime:  { type: DataTypes.STRING(50), allowNull: true },
    status: {
      type: DataTypes.ENUM("Active", "Maintenance", "Breakdown"),
      allowNull: false,
      defaultValue: "Active",
    },
    stopList:  { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    isActive:  { type: DataTypes.BOOLEAN, defaultValue: true },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "routes",
    defaultScope: { where: { isDeleted: false } },
  }
);

module.exports = Route;