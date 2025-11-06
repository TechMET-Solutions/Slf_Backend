const db = require("../../config/database");

// ✅ ADD Loan Charges
exports.addLoanCharges = async (req, res) => {
  try {
    const {
      loan_no,
      loan_date,
      scheme,
      party_name,
      loan_amt,
      pending_amt,
      charges_details,
      total_charges, // 🆕 new field
      added_by,
      remark,
    } = req.body;

    // ✅ Validation for required fields
    if (
      !loan_no ||
      !loan_date ||
      !scheme ||
      !party_name ||
      !loan_amt ||
      !pending_amt ||
      !charges_details ||
      !total_charges || // 🆕 include total_charges in validation
      !added_by ||
      !remark
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ Create table if not exists (added total_charges field)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS loan_charges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_no VARCHAR(100) NOT NULL,
        loan_date VARCHAR(100) NOT NULL,
        scheme VARCHAR(100) NOT NULL,
        party_name VARCHAR(100) NOT NULL,
        loan_amt VARCHAR(150) NOT NULL,
        pending_amt VARCHAR(150) NOT NULL,
        charges_details JSON,
        total_charges DECIMAL(10,2) NOT NULL, -- 🆕 new column for total charges
        remark TEXT,
        added_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    // ✅ Insert record (added total_charges)
    const insertQuery = `
      INSERT INTO loan_charges 
      (loan_no, loan_date, scheme, party_name, loan_amt, pending_amt, charges_details, total_charges, remark, added_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertQuery, [
      loan_no,
      loan_date,
      scheme,
      party_name,
      loan_amt,
      pending_amt,
      JSON.stringify(charges_details),
      total_charges, // 🆕 insert total_charges
      remark,
      added_by,
    ]);

    res.status(201).json({
      success: true,
      message: "Loan charges added successfully ✅",
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error("Add Loan Charges Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// 🟢 GET All or by loan_no
exports.getLoanCharges = async (req, res) => {
  try {
    const { loan_no } = req.query;

    let query = "SELECT * FROM loan_charges";
    let params = [];

    if (loan_no) {
      query += " WHERE loan_no = ?";
      params.push(loan_no);
    }

    const [rows] = await db.query(query, params);

    res.status(200).json({
      success: true,
      message: "Loan charges fetched successfully",
      data: rows,
    });
  } catch (err) {
    console.error("Get Loan Charges Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// 🟡 UPDATE Loan Charges
exports.updateLoanCharges = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      loan_no,
      loan_date,
      scheme,
      party_name,
      loan_amt,
      pending_amt,
      charges_details,
      remark,
    } = req.body;

    const [existing] = await db.query("SELECT * FROM loan_charges WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const updateQuery = `
      UPDATE loan_charges
      SET loan_no = ?, loan_date = ?, scheme = ?, party_name = ?, 
          loan_amt = ?, pending_amt = ?, charges_details = ?, remark = ?
      WHERE id = ?
    `;

    await db.query(updateQuery, [
      loan_no,
      loan_date,
      scheme,
      party_name,
      loan_amt,
      pending_amt,
      JSON.stringify(charges_details),
      remark,
      id,
    ]);

    res.status(200).json({
      success: true,
      message: "Loan charges updated successfully ✅",
    });
  } catch (err) {
    console.error("Update Loan Charges Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// 🔴 DELETE Loan Charges
exports.deleteLoanCharges = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT * FROM loan_charges WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    await db.query("DELETE FROM loan_charges WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Loan charges deleted successfully 🗑️",
    });
  } catch (err) {
    console.error("Delete Loan Charges Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// ✅ Get Loan Charges by ID
exports.getLoanChargesById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛑 Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required in request parameters",
      });
    }

    // ✅ Ensure table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS loan_charges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_no VARCHAR(100) NOT NULL,
        loan_date VARCHAR(100) NOT NULL,
        scheme VARCHAR(100) NOT NULL,
        party_name VARCHAR(100) NOT NULL,
        loan_amt VARCHAR(150) NOT NULL,
        pending_amt VARCHAR(150) NOT NULL,
        charges_details JSON,
        remark TEXT,
        added_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    // ✅ Fetch record by ID
    const [rows] = await db.query(`SELECT * FROM loan_charges WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No loan charges found with this ID",
      });
    }

    // ✅ Parse JSON field before sending
    const loanData = rows[0];
    if (loanData.charges_details) {
      loanData.charges_details = JSON.parse(loanData.charges_details);
    }

    res.status(200).json({
      success: true,
      message: "Loan charges fetched successfully ✅",
      data: loanData,
    });
  } catch (err) {
    console.error("Get Loan Charges Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
