const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const db = new sqlite3.Database(':memory:'); // Use an actual database file in production
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key'; // Use a better secret in production

// Middleware
app.use(bodyParser.json());

// Initialize Database
db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)`);
    db.run(`CREATE TABLE transactions (id INTEGER PRIMARY KEY, userId INTEGER, amount REAL, date TEXT, FOREIGN KEY(userId) REFERENCES users(id))`);
});

// Register User
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
        if (err) return res.status(500).send('Error registering user');
        res.status(201).send({ id: this.lastID });
    });
});

// Authenticate User
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(401).send('User not found');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).send('Invalid password');
        const token = jwt.sign({ id: user.id }, SECRET_KEY);
        res.json({ token });
    });
});

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(403);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Transaction Management
app.post('/transaction', authenticateJWT, (req, res) => {
    const { amount } = req.body;
    const date = new Date().toISOString();
    db.run('INSERT INTO transactions (userId, amount, date) VALUES (?, ?, ?)', [req.user.id, amount, date], function(err) {
        if (err) return res.status(500).send('Error processing transaction');
        res.status(201).send({ id: this.lastID });
    });
});

// Get Transactions
app.get('/transactions', authenticateJWT, (req, res) => {
    db.all('SELECT * FROM transactions WHERE userId = ?', [req.user.id], (err, rows) => {
        if (err) return res.status(500).send('Error fetching transactions');
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
