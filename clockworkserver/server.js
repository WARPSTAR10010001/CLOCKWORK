const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const pool = require('./db');

const port = process.env.PORT || 4000;
const server = app.listen(port, () => console.log(`CLOCKWORK Server läuft auf Port ${port}`));

function shutdown(sig) {
  console.log(`\n${sig} received, shutting down...`);
  server.close(async () => {
    try { await pool.end(); } catch {}
    process.exit(0);
  });
}
['SIGINT','SIGTERM'].forEach(s => process.on(s, () => shutdown(s)));