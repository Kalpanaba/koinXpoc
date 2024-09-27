const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Trade = require('./models/Trade');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
const upload = multer({ dest: 'uploads/' });

// Connect to MongoDB using the URI from .env
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API-1
app.post('/upload-csv', upload.single('file'), (req, res) => {
  const trades = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      const { User_ID, UTC_Time, Operation, Market, 'Buy/Sell Amount': amount, Price } = row;
      const [baseCoin, quoteCoin] = Market.split('/');
      trades.push({
        userId: User_ID,
        utcTime: new Date(UTC_Time),
        operation: Operation.toLowerCase(),
        market: Market,
        baseCoin: baseCoin,
        quoteCoin: quoteCoin,
        amount: parseFloat(amount),
        price: parseFloat(Price),
      });
    })
    .on('end', async () => {
      try {
        await Trade.insertMany(trades);
        res.status(200).json({ message: 'CSV data uploaded successfully.' });
      } catch (error) {
        res.status(500).json({ message: 'Error storing data.', error });
      }
    })
    .on('error', (error) => {
      res.status(500).json({ message: 'Error processing CSV.', error });
    });
});

// API-2
app.post('/balance', async (req, res) => {
  const { timestamp } = req.body;
  try {
    const trades = await Trade.find({ utcTime: { $lt: new Date(timestamp) } });

    const balance = {};

    trades.forEach(trade => {
      const { baseCoin, operation, amount } = trade;
      if (!balance[baseCoin]) balance[baseCoin] = 0;
      balance[baseCoin] += (operation === 'buy' ? amount : -amount);
    });

    res.status(200).json(balance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching balance.', error });
  }
});

// SERVER INITIALIZATION
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
