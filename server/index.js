import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();
const clientId = process.env.VITE_GOOGLE_CLIENT_ID;

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./users.db');
const googleClient = new OAuth2Client(clientId);

db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)');

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], function(err) {
        if (err) return res.status(400).json({ error: 'User already exists' });
        res.json({ success: true });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, username: user.username }, 'SECRET_KEY');
        res.json({ token });
    });
});

app.post('/google-login', async (req, res) => {
    console.log('Google login request:', req.body);
    const { token } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: clientId,
        });
        const payload = ticket.getPayload();
        db.get('SELECT * FROM users WHERE username = ?', [payload.email], (err, user) => {
        if (!user) {
            db.run('INSERT INTO users (username, password) VALUES (?, ?)', [payload.email, ''], function(err) {
            if (err) return res.status(400).json({ error: 'DB error' });
            const jwtToken = jwt.sign({ id: this.lastID, username: payload.email }, 'SECRET_KEY');
            return res.json({ token: jwtToken });
            });
        } else {
            const jwtToken = jwt.sign({ id: user.id, username: user.username }, 'SECRET_KEY');
            return res.json({ token: jwtToken });
        }
        });
    } catch (e) {
        res.status(400).json({ error: 'Invalid Google token' });
    }
});

const TEST_USER = { username: 'testuser', password: '12345' };

db.get('SELECT * FROM users WHERE username = ?', [TEST_USER.username], (err, user) => {
    if (!user) {
        bcrypt.hash(TEST_USER.password, 10, (err, hash) => {
            db.run('INSERT INTO users (username, password) VALUES (?, ?)', [TEST_USER.username, hash], (err) => {
                if (!err) {
                    console.log('Test user created:', TEST_USER.username, TEST_USER.password);
                }
            });
        });
    }
});

app.listen(4000, () => console.log('Server running on port 4000'));