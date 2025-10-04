const db = require('../../config/database');
const { encryptData, decryptData } = require('../Helpers/cryptoHelper');

exports.addBranch = async (req, res) => {
    try {
        // 🔹 Decrypt incoming request
        const encryptedPayload = req.body.data; // frontend sends inside `data`
        const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

        const {
            branch_code,
            branch_name,
            print_name,
            address_line1,
            address_line3,
            mobile_no,
            lead_person,
            is_main,
            status
        } = decryptedPayload;

        if (!branch_code || !branch_name || !print_name || !address_line1 || !address_line3 || !mobile_no) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        // ✅ Ensure table exists
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS branch_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_code VARCHAR(50) NOT NULL,
        branch_name VARCHAR(100) NOT NULL,
        print_name VARCHAR(100) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line3 VARCHAR(255) NOT NULL,
        mobile_no VARCHAR(15) NOT NULL,
        lead_person VARCHAR(100),
        is_main TINYINT(1) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await db.query(createTableQuery); // ✅ promise style

        // ✅ Insert branch
        const insertQuery = `
      INSERT INTO branch_details
      (branch_code, branch_name, print_name, address_line1, address_line3, mobile_no, lead_person, is_main, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const [result] = await db.query(insertQuery, [
            branch_code,
            branch_name,
            print_name,
            address_line1,
            address_line3,
            mobile_no,
            lead_person,
            is_main,
            status,
        ]);

        // 🔹 Encrypt response before sending
        const responsePayload = {
            message: "✅ Branch added successfully",
            branchId: result.insertId,
        };

        const encryptedResponse = encryptData(JSON.stringify(responsePayload));

        res.status(201).json({ data: encryptedResponse });
    } catch (error) {
        console.error("❌ Error processing branch:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getBranches = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM branch_details ORDER BY id DESC");

        // 🔒 Encrypt response
        const encryptedResponse = encryptData(JSON.stringify(rows));
        res.status(200).json({ data: encryptedResponse });
    } catch (error) {
        console.error("❌ Error fetching branches:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};