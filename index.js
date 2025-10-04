const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// DB connection (auto-tests when imported)
const pool = require("./config/database");

const { encryptData, decryptData } = require("./src/Helpers/cryptoHelper");
const MasterRoutes = require("./src/routes/MasterRoutes");

app.use(bodyParser.json());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/Master", MasterRoutes);

app.get("/", (req, res) => res.json({ message: "API running..." }));

app.listen(5000, () => {
    console.log('🚀 Server is running on port 5000');
});
