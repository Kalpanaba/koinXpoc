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

// API-1: Upload CSV and check for duplicates
app.post('/upload-csv', upload.single('file'), async (req, res) => {
  const trades = [];
  const fileRows = [];

  // Read the CSV file and push each row to fileRows array
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      fileRows.push(row);
    })
    .on('end', async () => {
      try {
        // Use Promise.all to ensure that all rows are processed before inserting to DB
        await Promise.all(fileRows.map(async (row) => {
          const { User_ID, UTC_Time, Operation, Market, 'Buy/Sell Amount': amount, Price } = row;
          const [baseCoin, quoteCoin] = Market.split('/');

          const trade = {
            userId: User_ID,
            utcTime: new Date(UTC_Time),
            operation: Operation.toLowerCase(),
            market: Market,
            baseCoin: baseCoin,
            quoteCoin: quoteCoin,
            amount: parseFloat(amount),
            price: parseFloat(Price),
          };

          // Check if a trade with the same values already exists
          const existingTrade = await Trade.findOne({
            userId: User_ID,
            utcTime: new Date(UTC_Time),
            operation: Operation.toLowerCase(),
            market: Market,
            amount: parseFloat(amount),
            price: parseFloat(Price),
          });

          // Only push to the trades array if no duplicate is found
          if (!existingTrade) {
            trades.push(trade);
          }
        }));

        if (trades.length > 0) {
          await Trade.insertMany(trades);
          res.status(200).json({ message: 'CSV data uploaded successfully.', insertedRecords: trades.length });
        } else {
          res.status(200).json({ message: 'No new records to upload. All records are duplicates.' });
        }
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
