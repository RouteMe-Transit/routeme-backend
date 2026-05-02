const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Stop = sequelize.define(
  "Stop",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    stopCode: { type: DataTypes.STRING(10), allowNull: false, unique: true }, // S01
    name: { type: DataTypes.STRING(150), allowNull: false },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "stops",
    defaultScope: { where: { isDeleted: false } },
  }
);

module.exports = Stop;