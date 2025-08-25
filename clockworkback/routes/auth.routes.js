const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const users = [
  { id: 0, username: "admin",   password: "CWadmin47495",    isAdmin: true  },
  { id: 1, username: "default", password: "rheinberg47495!", isAdmin: false }
];

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES;

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Bitte das Anmeldefeld ausfüllen." });
  }

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Falsche Anmeldedaten. Erneut versuchen oder einen Systemadmin kontaktieren." });
  }

  const payload = { id: user.id, username: user.username, isAdmin: !!user.isAdmin };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  return res.json({
    token,
    loggedIn: true,
    isAdmin: !!user.isAdmin,
    user: payload
  });
});

router.post("/logout", (req, res) => {
  return res.json({ loggedOut: true });
});

router.get("/status", (req, res) => {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");
  if (!token) {
    return res.json({ loggedIn: false, isAdmin: false, user: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({
      loggedIn: true,
      isAdmin: !!decoded.isAdmin,
      user: decoded
    });
  } catch (err) {
    return res.json({ loggedIn: false, isAdmin: false, user: null });
  }
});

module.exports = router;