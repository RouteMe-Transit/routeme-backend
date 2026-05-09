const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Alert = sequelize.define(
	"Alert",
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		alertType: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		affectedRoute: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		affectedBus: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		title: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		targetAudience: {
			type: DataTypes.ENUM("public", "route"),
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM("scheduled", "sent", "cancelled"),
			allowNull: false,
			defaultValue: "sent",
		},
		scheduledAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		sentAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		recipientCount: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			defaultValue: 0,
		},
		deliveryMeta: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		createdBy: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
		},
		isDeleted: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		tableName: "alerts",
		defaultScope: {
			where: { isDeleted: false },
		},
		scopes: {
			withDeleted: { where: {} },
		},
		indexes: [
			{ fields: ["status"] },
			{ fields: ["scheduledAt"] },
			{ fields: ["createdBy"] },
		],
	}
);

module.exports = Alert;
