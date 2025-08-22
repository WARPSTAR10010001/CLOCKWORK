const express = require("express");
const session = require("express-session");
const cors = require("cors");
const app = express();
require("dotenv").config();

const { errorLogger, requestLogger } = require("./actionHandler");
const authRoutes = require("./routes/auth.routes");
const planRoutes = require("./routes/plans.routes");
const holidayRoutes = require("./routes/holidays.routes");

const PORT = 3000;

app.use(express.json());

app.use(cors({
  origin: "http://localhost:4200",
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60
  }
}));

app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/holidays", holidayRoutes);

app.get("/", (req, res) => res.status(200).send("CLOCKWORK läuft!"));
app.use(errorLogger);

app.listen(PORT, () => console.log(`[START] CLOCKWORK läuft auf Port ${PORT}`));