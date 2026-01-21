const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const pool = require('./db');

const port = process.env.PORT || 4000;
const server = app.listen(port, () => console.log(`[START] CLOCKWORK Server runs on port ${port}`));

function shutdown(sig) {
  console.log(`\n[SHUTDOWN/${sig}] CLOCKWORK Server is shutting down`);
  server.close(async () => {
    try { await pool.end(); } catch {}
    process.exit(0);
  });
}
['SIGINT','SIGTERM'].forEach(s => process.on(s, () => shutdown(s)));