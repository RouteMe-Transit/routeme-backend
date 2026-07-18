const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FavoriteRoute = sequelize.define(
  "FavoriteRoute",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    routeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "routes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "favorite_routes",
    timestamps: true,
    createdAt: "addedAt",
    updatedAt: false,
    indexes: [
      { unique: true, fields: ["userId", "routeId"] },
      { fields: ["userId"] },
      { fields: ["routeId"] },
    ],
  }
);

module.exports = FavoriteRoute;