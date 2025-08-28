const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const router = express.Router();

const users = [
  { id: 0, username: "admin", password: "CWadmin47495", isAdmin: true },
  { id: 1, username: "default", password: "rheinberg47495!", isAdmin: false }
];

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Bitte das Anmeldefeld ausfüllen." });
  }
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Falsche Anmeldedaten. Erneut versuchen oder einen Systemadmin kontaktieren." });
  }
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "2h" });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax"
  }).json({
    loggedIn: true,
    isAdmin: user.isAdmin,
    user: { id: user.id, username: user.username }
  });
});

router.post("/logout", (req, res) => {
  return res.clearCookie("token").json({ loggedIn: false });
});

router.get("/status", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ loggedIn: false });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({
      loggedIn: true,
      isAdmin: decoded.isAdmin,
      user: { id: decoded.id, username: decoded.username, isAdmin: decoded.isAdmin },
      exp: decoded.exp
    });
  } catch {
    return res.json({ loggedIn: false });
  }
});

module.exports = router;