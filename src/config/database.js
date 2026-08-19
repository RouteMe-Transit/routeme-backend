const { Sequelize } = require("sequelize");
const config = require("./index");

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "mysql",
    logging: config.env === "development" ? console.log : false,
    pool: {
      max: 3,
      min: 0,
      acquire: 60000,
      idle: 5000,
    },
    define: {
      underscored: false,
      freezeTableName: false,
      timestamps: true,
    },
  }
);

module.exports = sequelize;
