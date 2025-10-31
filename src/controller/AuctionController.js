const db = require("../../config/database");
const { encryptData, decryptData } = require("../Helpers/cryptoHelper");
const path = require("path");

exports.registerBidder = async (req, res) => {
    try {

        // Destructure fields from the request body
        const {
            bidder_name,
            mobile_no,
            alt_mob_no,
            email,
            personal_address,
            shop_address,
            landline_no,
            landline_no2,
            firm_name,
            gst_no,
            aadhar_no,
            pan_no,
            bank_name,
            account_no,
            ifsc_code,
            account_holder_name,
            bank_address
        } = req.body;

        // Handle uploaded files from multer
        const aadharFile = req.files?.aadharFile ? req.files.aadharFile[0].filename : null;
        const panFile = req.files?.panFile ? req.files.panFile[0].filename : null;
        const bidder_photo = req.files?.bidder_photo ? req.files.bidder_photo[0].filename : null;

        // Validate required fields
        if (!bidder_name || !mobile_no || !email || !gst_no) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        // Create table if not exists
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS bidders_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bidder_name VARCHAR(100) NOT NULL,
                mobile_no VARCHAR(15) NOT NULL,
                alt_mob_no VARCHAR(15),
                email VARCHAR(100),
                personal_address TEXT,
                shop_address TEXT,
                landline_no VARCHAR(15),
                landline_no2 VARCHAR(15),
                firm_name VARCHAR(100),
                gst_no VARCHAR(20),
                aadhar_no VARCHAR(20),
                pan_no VARCHAR(20),
                aadharFile VARCHAR(255),
                panFile VARCHAR(255),
                bidder_photo VARCHAR(255),
                bank_name VARCHAR(100),
                account_no VARCHAR(30),
                ifsc_code VARCHAR(15),
                account_holder_name VARCHAR(100),
                bank_address VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await db.query(createTableQuery);

        // Insert new bidder data
        const insertQuery = `
            INSERT INTO bidders_details (
                bidder_name, mobile_no, alt_mob_no, email,
                personal_address, shop_address, landline_no, landline_no2,
                firm_name, gst_no, aadhar_no, pan_no,
                aadharFile, panFile, bidder_photo,
                bank_name, account_no, ifsc_code, account_holder_name,bank_address
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?);
        `;

        const values = [
            bidder_name, mobile_no, alt_mob_no, email,
            personal_address, shop_address, landline_no, landline_no2,
            firm_name, gst_no, aadhar_no, pan_no,
            aadharFile, panFile, bidder_photo,
            bank_name, account_no, ifsc_code, account_holder_name, bank_address
        ];

        const [result] = await db.query(insertQuery, values);

        res.status(201).json({
            message: "✅ Bidder registered successfully",
            bidder_id: result.insertId
        });
    } catch (error) {
        console.error("❌ Error registering bidder:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// 🧩 Update an existing bidder
exports.updateBidder = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            bidder_name,
            mobile_no,
            alt_mob_no,
            email,
            personal_address,
            shop_address,
            landline_no,
            landline_no2,
            firm_name,
            gst_no,
            aadhar_no,
            pan_no,
            bank_name,
            account_no,
            ifsc_code,
            account_holder_name,
            bank_address
        } = req.body;

        // Handle new file uploads (if provided)
        const aadharFile = req.files?.aadharFile ? req.files.aadharFile[0].filename : null;
        const panFile = req.files?.panFile ? req.files.panFile[0].filename : null;
        const bidder_photo = req.files?.bidder_photo ? req.files.bidder_photo[0].filename : null;

        // Ensure the bidder exists
        const [existing] = await db.query("SELECT * FROM bidders_details WHERE id = ?", [id]);
        if (!existing.length) {
            return res.status(404).json({ message: "Bidder not found" });
        }

        // Build update query dynamically
        const fields = [];
        const values = [];

        const addField = (col, val) => {
            if (val !== undefined && val !== null && val !== "") {
                fields.push(`${col} = ?`);
                values.push(val);
            }
        };

        addField("bidder_name", bidder_name);
        addField("mobile_no", mobile_no);
        addField("alt_mob_no", alt_mob_no);
        addField("email", email);
        addField("personal_address", personal_address);
        addField("shop_address", shop_address);
        addField("landline_no", landline_no);
        addField("landline_no2", landline_no2);
        addField("firm_name", firm_name);
        addField("gst_no", gst_no);
        addField("aadhar_no", aadhar_no);
        addField("pan_no", pan_no);
        addField("bank_name", bank_name);
        addField("account_no", account_no);
        addField("ifsc_code", ifsc_code);
        addField("account_holder_name", account_holder_name);
        addField("bank_address", bank_address);
        addField("aadharFile", aadharFile);
        addField("panFile", panFile);
        addField("bidder_photo", bidder_photo);

        if (!fields.length) {
            return res.status(400).json({ message: "No fields to update" });
        }

        const query = `UPDATE bidders_details SET ${fields.join(", ")} WHERE id = ?`;
        values.push(id);

        await db.query(query, values);

        res.json({ message: "✅ Bidder updated successfully" });
    } catch (error) {
        console.error("❌ Error updating bidder:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 👁️ View single bidder by ID
exports.viewBidder = async (req, res) => {
    try {
        const { id } = req.params;

        // Dynamically detect protocol + host (works locally & in production)
        const baseUrl = `${req.protocol}://${req.get("host")}/bidderDoc/bidder_documents/`;
        // const baseUrl = `${req.protocol}://${req.get("host")}/bidderDoc/bidder_documents/`;

        const [rows] = await db.query("SELECT * FROM bidders_details WHERE id = ?", [id]);
        if (!rows.length) {
            return res.status(404).json({ message: "Bidder not found" });
        }

        const bidder = rows[0];

        // List of file fields that need full URLs
        const fileFields = ["aadharFile", "panFile", "bidder_photo"];

        // Replace filenames with full URLs if they exist
        fileFields.forEach((field) => {
            if (bidder[field]) {
                bidder[field] = baseUrl + bidder[field];
            }
        });

        res.json({
            message: "✅ Bidder retrieved successfully",
            bidder
        });
    } catch (error) {
        console.error("❌ Error viewing bidder:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



// 📋 Get all bidders
exports.getAllBidder = async (req, res) => {
    try {
        // 📦 Pagination parameters (default: page=1, limit=10)
        // const page = parseInt(req.query.page) || 1;
        // const limit = parseInt(req.query.limit) || 10;
        // const offset = (page - 1) * limit;

        const [rows] = await db.query("SELECT * FROM bidders_details ORDER BY id DESC");
        res.json({
            message: "✅ All bidders fetched successfully",
            count: rows.length,
            bidders: rows
        });
    } catch (error) {
        console.error("❌ Error fetching bidders:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

