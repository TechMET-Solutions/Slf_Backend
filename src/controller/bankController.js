const path = require("path");
const multer = require("multer");
const db = require("../../config/database");
exports.addBankDetails = async (req, res) => {
    try {
        const { bankData, customerId } = req.body;

        if (!bankData) {
            return res.status(400).json({ message: "Missing bankData" });
        }

        const parsedBankData = JSON.parse(bankData);
        const files = req.files || [];

        // Step 1️⃣: Create table if not exists
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS bank_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customerId INT,
        Customer_Name VARCHAR(255),
        bankName VARCHAR(255),
        Account_No VARCHAR(255),
        IFSC VARCHAR(255),
        Bank_Address VARCHAR(255),
        cancelCheque VARCHAR(500),
        Update_By VARCHAR(255),
        Update_On VARCHAR(50)
      )
    `;

        await db.query(createTableQuery);

        // Step 2️⃣: Prepare values for insertion
        const values = parsedBankData.map((bank, index) => {
            const chequeFile = files[index]
                ? `${files[index].filename}`
                : "";

            return [
                customerId,
                bank.Customer_Name,
                bank.bankName,
                bank.Account_No,
                bank.IFSC,
                bank.Bank_Address,
                chequeFile,
                bank.Update_By,
                bank.Update_On,
            ];
        });

        // Step 3️⃣: Insert all records
        const insertQuery = `
      INSERT INTO bank_details 
      (customerId, Customer_Name, bankName, Account_No, IFSC, Bank_Address, cancelCheque, Update_By, Update_On)
      VALUES ?
    `;

        const [result] = await db.query(insertQuery, [values]);

        res.status(201).json({
            message: "✅ Bank details added successfully",
            insertedCount: result.affectedRows,
        });
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateBankDetails = async (req, res) => {
    try {
        const { bankData } = req.body;

        if (!bankData) {
            return res.status(400).json({ message: "Missing bankData" });
        }

        const parsedData = JSON.parse(bankData);
        const {
            id,
            customerId,
            customerName,
            bankName,
            accountNo,
            ifsc,
            bankAddress,
            updateBy,
            updateOn,
        } = parsedData;

        if (!id || !customerId) {
            return res.status(400).json({ message: "Missing record ID or customerId" });
        }

        const chequeFile = req.file ? req.file.filename : null;

        // 🧾 Step 1️⃣: Get existing record to preserve old cheque if no new file uploaded
        const [rows] = await db.query(
            "SELECT cancelCheque FROM bank_details WHERE id = ? AND customerId = ?",
            [id, customerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Bank record not found" });
        }

        const existingCheque = rows[0].cancelCheque;
        const chequeToSave = chequeFile || existingCheque;

        // 🧾 Step 2️⃣: Update record with all new values
        const updateQuery = `
      UPDATE bank_details
      SET
        Customer_Name = ?,
        bankName = ?,
        Account_No = ?,
        IFSC = ?,
        Bank_Address = ?,
        cancelCheque = ?,
        Update_By = ?,
        Update_On = ?
      WHERE id = ? AND customerId = ?
    `;

        await db.query(updateQuery, [
            customerName,
            bankName,
            accountNo,
            ifsc,
            bankAddress,
            chequeToSave,
            updateBy,
            updateOn || new Date(),
            id,
            customerId,
        ]);

        res.status(200).json({
            message: "✅ Bank details updated successfully",
            updatedCheque: chequeToSave,
        });
    } catch (error) {
        console.error("❌ Error updating bank details:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

