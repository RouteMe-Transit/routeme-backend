<<<<<<< HEAD
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

=======
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Route = sequelize.define(
  "Route",
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    routeName: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    from: {
      type:      DataTypes.STRING(150),
      allowNull: false,
    },
    to: {
      type:      DataTypes.STRING(150),
      allowNull: false,
    },
    noOfBuses: {
      type:         DataTypes.INTEGER.UNSIGNED,
      allowNull:    false,
      defaultValue: 0,
    },
    avgTime: {
      type:      DataTypes.STRING(50),
      allowNull: true,
    },
    // stopList JSON column intentionally removed — canonical data is in route_stops table
    isActive: {
      type:         DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "routes",
  }
);

>>>>>>> f0ab595431ff891989485c94bb5c10ae7be63db7
module.exports = Route;