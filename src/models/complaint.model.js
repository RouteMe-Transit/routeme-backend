const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Complaint = sequelize.define(
  "Complaint",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    busNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Resolved"),
      allowNull: false,
      defaultValue: "Pending",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "complaints",
  }
);

module.exports = Complaint;