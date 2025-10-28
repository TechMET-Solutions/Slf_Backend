const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const path = require("path");
// DB connection (auto-tests when imported)
const pool = require("./config/database");

const { encryptData, decryptData } = require("./src/Helpers/cryptoHelper");
const MasterRoutes = require("./src/routes/MasterRoutes");
const cryptoRoutes = require("./src/routes/cryptoRoutes");

const Customer_router = require('./src/routes/MasterCustomer');
const SchemeRouter = require('./src/routes/schemeRoutes');




app.use(bodyParser.json());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/Master", MasterRoutes);
app.use("/Master/doc", Customer_router);
app.use("/", cryptoRoutes);
app.use("/Scheme", SchemeRouter);

app.use("/uploadDoc/customer_documents", express.static(path.join(__dirname, "src/ImagesFolders/customer_documents")));
// ⚠️ Route Not Found (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.get("/", (req, res) => res.json({ message: "API running..." }));

app.listen(5000, () => {
  console.log('🚀 Server is running on port 5000');
});
