const db = require('../../config/database');

exports.addBranch = (req, res) => {
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
    } = req.body;

    // Validate required fields
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

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error("❌ Error creating branch_details table:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        // ✅ Insert branch after ensuring table exists
        const insertQuery = `
      INSERT INTO branch_details
      (branch_code, branch_name, print_name, address_line1, address_line3, mobile_no, lead_person, is_main, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        db.query(
            insertQuery,
            [branch_code, branch_name, print_name, address_line1, address_line3, mobile_no, lead_person, is_main, status],
            (err, result) => {
                if (err) {
                    console.error("❌ Error inserting branch:", err);
                    return res.status(500).json({ message: "Database error", error: err });
                }
                res.status(201).json({ message: "✅ Branch added successfully", branchId: result.insertId });
            }
        );
    });
};