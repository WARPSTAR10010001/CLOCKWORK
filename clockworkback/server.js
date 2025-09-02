const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 3000;
require("dotenv").config();

const { requestLogger } = require("./middleware");
const authRoutes = require("./routes/auth.routes");
const planRoutes = require("./routes/plans.routes");
const holidayRoutes = require("./routes/holidays.routes");

app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: process.env.URL, credentials: true }));

app.use(requestLogger);
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/holidays", holidayRoutes);

app.get("/", (req, res) => res.status(200).send("CLOCKWORK läuft!"));

app.listen(PORT, () => console.log(`[START] CLOCKWORK läuft auf Port ${PORT}`));