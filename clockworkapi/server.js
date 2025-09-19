const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 3000;
require("dotenv").config();

// Die neue Art, die DB und die Modelle zu importieren
const db = require('./models'); 

const { requestLogger } = require("./middleware/requestLogger");

const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes")
const planRoutes = require("./routes/plans.routes");

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.URL, credentials: true }));

app.use(requestLogger);
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/employees", employeeRoutes);

app.get("/", (req, res) => res.status(200).send("CLOCKWORK API läuft!"));

// Optional: Synchronisiere die Datenbank beim Start (erstellt Tabellen, falls nicht vorhanden)
// In einer Produktivumgebung würde man hier eher Migrationen verwenden.
db.sequelize.sync().then(() => {
    app.listen(PORT, () => console.log(`[START] CLOCKWORK API läuft auf Port ${PORT}!`));
});