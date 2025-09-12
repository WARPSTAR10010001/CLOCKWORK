const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('[START] CLOCKWORK DATENBANK läuft!');
  } catch (err) {
    console.error('[ERROR] CLOCKWORK DATENBANK Interner Fehler', err);
  }
})();

module.exports = sequelize;