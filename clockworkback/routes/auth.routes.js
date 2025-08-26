const express = require("express");
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
  req.session.user = { id: user.id, username: user.username, isAdmin: !!user.isAdmin };
  return res.json({ loggedIn: true, isAdmin: !!user.isAdmin, user: req.session.user });
});

router.post("/logout", (req, res) => {
  const sidName = req.session?.cookie?.name || "connect.sid";
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "Abmeldung fehlgeschlagen." });
    } res.clearCookie("connect.sid");
    return res.json({ loggedOut: true });
  });
});

router.get("/status", (req, res) => {
  if (req.session && req.session.user) {
    const user = req.session.user;
    return res.json({ loggedIn: true, isAdmin: !!user.isAdmin, user });
  }
  return res.json({ loggedIn: false, isAdmin: false, user: null });
});

module.exports = router;