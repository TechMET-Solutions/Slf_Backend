const db = require("../../config/database");

exports.addCreditNote = async (req, res) => {
    try {
        const formData = req.body;

        // 1️⃣ CREATE TABLE IF NOT EXISTS
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS credit_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            credit_note_id VARCHAR(50),
            date_of_issue DATE,
            reference_invoice_no VARCHAR(100),
            reference_date DATE,
            customer_name VARCHAR(150),
            customer_id VARCHAR(100),
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            pin_code VARCHAR(10),
            mobile_number VARCHAR(15),
            email_id VARCHAR(150),
            reason TEXT,
            description TEXT,
            original_amount DECIMAL(12,2),
            adjustment_amount DECIMAL(12,2),
            net_amount DECIMAL(12,2),
            mode_of_payment VARCHAR(50),
            bank_name VARCHAR(100),
            account_no VARCHAR(10),
            transaction_no VARCHAR(100),
            transaction_date DATE,
            prepared_by VARCHAR(150),
            designation VARCHAR(100),
            verified_by VARCHAR(150),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `;

        await db.query(createTableQuery);
        console.log("✅ credit_notes table created or already exists!");

        // 2️⃣ INSERT CREDIT NOTE DATA
        const insertQuery = `
        INSERT INTO credit_notes (
            date_of_issue,
            reference_invoice_no,
            reference_date,
            customer_name,
            customer_id,
            address,
            city,
            state,
            pin_code,
            mobile_number,
            email_id,
            reason,
            description,
            original_amount,
            adjustment_amount,
            net_amount,
            mode_of_payment,
            bank_name,
            account_no,
            transaction_no,
            transaction_date,
            prepared_by,
            designation,
            verified_by,
            credit_note_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            formData.date_of_issue,
            formData.reference_invoice_no,
            formData.reference_date,
            formData.customer_name,
            formData.customer_id,
            formData.address,
            formData.city,
            formData.state,
            formData.pin_code,
            formData.mobile_number,
            formData.email_id,
            formData.reason,
            formData.description,
            formData.original_amount,
            formData.adjustment_amount,
            formData.net_amount,
            formData.mode_of_payment,
            formData.bank_name,
            formData.account_no,
            formData.transaction_no,
            formData.transaction_date,
            formData.prepared_by,
            formData.designation,
            formData.verified_by,
            formData.credit_note_id
        ];

        const [result] = await db.query(insertQuery, values);

        // 3️⃣ SUCCESS RESPONSE
        res.status(201).json({
            message: "✅ Credit Note saved successfully!",
            id: result.insertId
        });

    } catch (err) {
        console.error("❌ Error saving credit note:", err);
        res.status(500).json({ error: "Server error while saving credit note" });
    }
};


exports.getAllCreditNotes = async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                credit_note_id AS credit_note_no,
                customer_id AS customer_no,
                date_of_issue AS date,
                customer_name,
                address AS customer_address,
                mobile_number AS phone_no,
                original_amount AS credit_note_amount,
                net_amount AS un_utilized_amount
            FROM credit_notes
            ORDER BY id DESC
        `;

        const [rows] = await db.query(query);

        res.status(200).json({
            success: true,
            data: rows
        });

    } catch (err) {
        console.error("❌ Error fetching credit notes:", err);
        res.status(500).json({ error: "Server error fetching credit notes" });
    }
};

exports.getCreditNoteById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT *
            FROM credit_notes
            WHERE id = ?
        `;

        const [rows] = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Credit Note not found"
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (err) {
        console.error("❌ Error fetching credit note:", err);
        res.status(500).json({ error: "Server error fetching credit note" });
    }
};
