// ATM Simulator Server

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Sample data structure to hold account information
let accounts = {
    '1234-5678-9101-1121': { // Sample card number
        pin: '1234',
        balance: 5000,
        transactionHistory: []
    }
};

app.post('/insertCard', (req, res) => {
    const { cardNumber } = req.body;
    if (!accounts[cardNumber]) {
        return res.status(400).json({ error: 'Card not recognized.' });
    }
    res.status(200).json({ message: 'Card inserted successfully.' });
});

app.post('/authenticatePin', (req, res) => {
    const { cardNumber, pin } = req.body;
    const account = accounts[cardNumber];
    if (!account || account.pin !== pin) {
        return res.status(401).json({ error: 'Invalid PIN.' });
    }
    res.status(200).json({ message: 'PIN authenticated successfully.' });
});

app.get('/checkBalance', (req, res) => {
    const { cardNumber } = req.body;
    const account = accounts[cardNumber];
    if (!account) {
        return res.status(400).json({ error: 'Card not recognized.' });
    }
    res.status(200).json({ balance: account.balance });
});

app.post('/withdraw', (req, res) => {
    const { cardNumber, amount } = req.body;
    const account = accounts[cardNumber];
    if (!account) {
        return res.status(400).json({ error: 'Card not recognized.' });
    }
    if (amount > account.balance) {
        return res.status(400).json({ error: 'Insufficient balance.' });
    }
    account.balance -= amount;
    account.transactionHistory.push({ type: 'withdrawal', amount, date: new Date() });
    res.status(200).json({ message: 'Withdrawal successful.', balance: account.balance });
});

app.get('/transactionHistory', (req, res) => {
    const { cardNumber } = req.body;
    const account = accounts[cardNumber];
    if (!account) {
        return res.status(400).json({ error: 'Card not recognized.' });
    }
    res.status(200).json({ transactionHistory: account.transactionHistory });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
