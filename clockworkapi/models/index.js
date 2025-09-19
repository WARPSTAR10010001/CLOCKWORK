'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = {};

const sequelize = new Sequelize(
    process.env.PG_DATABASE,
    process.env.PG_USER,
    process.env.PG_PASSWORD, {
        host: process.env.PG_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
    }
);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

(async () => {
    try {
        await sequelize.authenticate();
        console.log('[START] CLOCKWORK DATENBANK läuft!');
    } catch (err) {
        console.error('[ERROR] CLOCKWORK DATENBANK Interner Fehler', err);
    }
})();

module.exports = db;