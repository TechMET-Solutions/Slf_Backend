const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const { encryptData, decryptData } = require("./src/Helpers/cryptoHelper");

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res) => res.json({ message: "API running..." }));

app.listen(5050, () => {
    console.log('Server is running on port 5050');
});
