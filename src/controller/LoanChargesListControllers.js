const db = require("../../config/database");

// 🟢 CREATE Loan Charges
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
      added_by,
      document_no,   // ✅ New field
      document_date, // ✅ New field
      remark,        // ✅ New field
    } = req.body;

    // ✅ Validation for all required fields
    if (
      !loan_no ||
      !loan_date ||
      !scheme ||
      !party_name ||
      !loan_amt ||
      !pending_amt ||
      !charges_details ||
      !added_by ||
      !document_no ||
      !document_date ||
      !remark
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ Create table if not exists (added new fields)
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
        document_no VARCHAR(100) NOT NULL,
        document_date VARCHAR(100) NOT NULL,
        remark TEXT,
        added_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    // ✅ Insert record (including new fields)
    const insertQuery = `
      INSERT INTO loan_charges 
      (loan_no, loan_date, scheme, party_name, loan_amt, pending_amt, charges_details, document_no, document_date, remark, added_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertQuery, [
      loan_no,
      loan_date,
      scheme,
      party_name,
      loan_amt,
      pending_amt,
      JSON.stringify(charges_details),
      document_no,
      document_date,
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
      document_no,   // ✅ New
      document_date, // ✅ New
      remark,        // ✅ New
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
      SET loan_no = ?, loan_date = ?, scheme = ?, party_name = ?, loan_amt = ?, 
          pending_amt = ?, charges_details = ?, document_no = ?, document_date = ?, remark = ?
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
      document_no,
      document_date,
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
