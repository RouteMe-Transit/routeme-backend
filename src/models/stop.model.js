const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Stop = sequelize.define(
  "Stop",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    stopName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "stops",
    indexes: [
      { fields: ["isActive"] },
    ],
  }
);

module.exports = Stop;