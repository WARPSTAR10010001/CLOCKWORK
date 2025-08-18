const express = require("express");
const session = require("express-session");
const cors = require('cors');
const app = express();
const { errorLogger, requestLogger } = require("./actionHandler");
require('dotenv').config();
const port = 3000;

app.use(express.json());
app.use(cors({
    origin: "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 3600000,
        sameSite: "lax"
    }
}));
app.use(requestLogger);

const authRoutes = require("./routes/auth.routes");
const planRoutes = require("./routes/plans.routes");
const holidayRoutes = require("./routes/holidays.routes");

app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/holidays", holidayRoutes);

app.get("/", (req, res) => {
    res.status(200).send("CLOCKWORK läuft!");
});

app.use(errorLogger);

app.listen(port, () => console.log(`[START] CLOCKWORK läuft!`));