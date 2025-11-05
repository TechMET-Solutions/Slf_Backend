const express = require("express");
const { getAllAccounts, createAccount, updateAccount, deleteAccount } = require("../controller/AccountCodeController");
const AccountCoderouter = express.Router();


AccountCoderouter.get("/get", getAllAccounts);
AccountCoderouter.post("/create", createAccount);
AccountCoderouter.put("/update/:id", updateAccount);
AccountCoderouter.delete("/delete/:id", deleteAccount);

module.exports = AccountCoderouter;
