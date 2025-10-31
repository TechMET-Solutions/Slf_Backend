const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// 🧩 DB connection
const pool = require('./config/database');

// 🔐 Crypto Helpers
const { encryptData, decryptData } = require('./src/Helpers/cryptoHelper');

// 🛠️ Routes
const MasterRoutes = require('./src/routes/MasterRoutes');
const cryptoRoutes = require('./src/routes/cryptoRoutes');
const CustomerRouter = require('./src/routes/MasterCustomer');
const SchemeRouter = require('./src/routes/schemeRoutes');
const TransactionRoutes = require('./src/routes/TransactionRouting');
const AuctionRoutes = require('./src/routes/AuctionRoutes');

// 🌍 Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 📁 Static folders (for uploaded files)
app.use(
  '/uploadDoc/customer_documents',
  express.static(path.join(__dirname, 'src/ImagesFolders/customer_documents'))
);

// 🆕 Add this to serve ornament photos properly
app.use(
  '/uploads/ornaments',
  express.static(path.join(__dirname, 'src/uploads/ornaments'))
);
// bidder_documents
app.use(
  '/bidderDoc/bidder_documents',
  express.static(path.join(__dirname, 'src/ImagesFolders/bidder_documents'))
);


// 🆕 ADD THIS: Serve loan documents
app.use(
  '/ImagesFolders/loan_documents',
  express.static(path.join(__dirname, 'src/ImagesFolders/loan_documents'))
);

// 📦 Route mounting
app.use('/Master', MasterRoutes);
app.use('/Master/doc', CustomerRouter);
app.use('/', cryptoRoutes);
app.use('/Scheme', SchemeRouter);
app.use('/Transactions', TransactionRoutes);
app.use('/Auction', AuctionRoutes);

// 🧭 Root route
app.get('/', (req, res) => res.json({ message: 'API running...' }));

// ⚠️ 404 - Route Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
