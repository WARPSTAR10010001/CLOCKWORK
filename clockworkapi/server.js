const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./models");
// NEU: Importiert eine Funktion zum Erstellen von Start-Daten
const createInitialData = require("./utils/initial.data"); 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- WICHTIG: DATENBANK-RESET ---
// `force: true` löscht alle Tabellen und erstellt sie basierend auf deinen Models neu.
// Das behebt den "user_id existiert nicht"-Fehler.
// Später für den Live-Betrieb auf `force: false` setzen oder entfernen!
db.sequelize.sync({ force: true }).then(() => {
  console.log("--------------------------------------------------");
  console.log("Datenbank wurde resettet und neu synchronisiert.");
  console.log("Erstelle initiale Test-Daten...");
  createInitialData(); // Ruft die neue Funktion auf
  console.log("--------------------------------------------------");
});
// ------------------------------------

app.get("/", (req, res) => {
  res.json({ message: "Willkommen zur Clockwork API." });
});

// Routen einbinden
require('./routes/auth.routes')(app);
require('./routes/employee.routes')(app);
require('./routes/plans.routes')(app);


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}.`);
});