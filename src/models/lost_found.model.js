const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LostFound = sequelize.define(
  "LostFound",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    itemType: {
      type: DataTypes.ENUM("lost", "found"),
      allowNull: false,
      defaultValue: "lost",
    },
    itemName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    busNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("open", "resolved", "claimed"),
      allowNull: false,
      defaultValue: "open",
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "lost_found",
    timestamps: true,
    defaultScope: {
      where: { isDeleted: false },
    },
    scopes: {
      withDeleted: { where: {} },
    },
  }
);

module.exports = LostFound;
