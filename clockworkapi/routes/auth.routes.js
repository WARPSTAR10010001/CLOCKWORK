const express = require('express');
const router = express.Router();
// KORREKTUR: Das Modell wird aus dem zentralen 'models'-Export importiert
const { SystemUser } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Route zum Erstellen eines neuen Benutzers (Registrierung)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Hashen des Passworts
    const hashedPassword = await bcrypt.hash(password, 10);

    // Erstellen des neuen Benutzers in der Datenbank
    const newUser = await SystemUser.create({
      username,
      password: hashedPassword,
      role: role || 'user', // Standardrolle 'user', wenn keine angegeben ist
    });

    res.status(201).send({ message: 'User registered successfully!', userId: newUser.id });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Route zum Einloggen eines Benutzers
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Suchen des Benutzers anhand des Benutzernamens
    const user = await SystemUser.findOne({ where: { username } });

    if (!user) {
      return res.status(404).send({ message: 'User Not found.' });
    }

    // Vergleichen des eingegebenen Passworts mit dem gespeicherten Hash
    const passwordIsValid = bcrypt.compareSync(
      password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: 'Invalid Password!',
      });
    }

    // Erstellen eines JWT-Tokens
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, // Erwäge, den Secret Key in einer Umgebungsvariable zu speichern
      process.env.JWT_EXPIRES,
    );

    res.status(200).send({
      id: user.id,
      username: user.username,
      role: user.role,
      accessToken: token,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;