const express = require("express");
const session = require("express-session");
const app = express();
const { errorLogger, requestLogger } = require("./actionHandler");
const PORT = 12345;

app.use(express.json());
app.use(session({
    secret: "ein langfristig geheimer string", //muss durch env datei ersetzt werden
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
        sameSite: "lax"
    }
}));
app.use(requestLogger);

const userRoutes = require("./routes/users.routes");
const planRoutes = require("./routes/plans.routes");
const holidayRoutes = require("./routes/holidays.routes");

app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/holidays", holidayRoutes);

app.get("/", (req, res) => {
    res.status(200).send("CLOCKWORK läuft!");
});

app.use(errorLogger);

app.listen(PORT, () => console.log(`[START] CLOCKWORK läuft!`));