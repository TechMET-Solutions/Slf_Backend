const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const { encryptData, decryptData } = require("./src/Helpers/cryptoHelper");
const MasterRoutes = require("./src/routes/MasterRoutes");
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

app.use("/Master", MasterRoutes);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res) => res.json({ message: "API running..." }));

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
