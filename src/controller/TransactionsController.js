const db = require("../../config/database");
const { encryptData, decryptData } = require("../Helpers/cryptoHelper");
const path = require("path");



exports.addLoanApplication = async (req, res) => {
  try {
    const {
      BorrowerId,
      CoBorrowerId,
      Borrower,
      Scheme,
      Scheme_ID,
      Print_Name,
      Mobile_Number,
      Alternate_Number,
      Co_Borrower,
      Relation,
      Nominee,
      Nominee_Relation,
      Pledge_Item_List,
      Loan_amount,
      Doc_Charges,
      Net_Payable,
      Valuer_1,
      Valuer_2,
      Loan_Tenure,
      Min_Loan,
      Max_Loan,
      approved_by,
      approval_date,
      branch_id,
      Effective_Interest_Rates,
    } = req.body;

    // 📸 Ornament photo (from multer)
    const Ornament_Photo = req.file ? req.file.filename : null;

    // 🔍 Required field validation
    if (!BorrowerId || !Scheme || !Loan_amount || !branch_id) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // 🧱 Ensure table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS loan_application (
        id INT AUTO_INCREMENT PRIMARY KEY,
        BorrowerId INT,
        CoBorrowerId INT,
        Borrower VARCHAR(100),
        Scheme VARCHAR(100),
        Scheme_ID INT,
        Print_Name VARCHAR(150),
        Mobile_Number VARCHAR(15),
        Alternate_Number VARCHAR(15),
        Co_Borrower VARCHAR(100),
        Relation VARCHAR(100),
        Nominee VARCHAR(100),
        Nominee_Relation VARCHAR(100),
        Ornament_Photo VARCHAR(255),
        Pledge_Item_List JSON,
        Loan_amount DECIMAL(15,2),
        Doc_Charges DECIMAL(15,2),
        Net_Payable DECIMAL(15,2),
        Valuer_1 VARCHAR(100),
        Valuer_2 VARCHAR(100),
        Loan_Tenure INT,
        Min_Loan DECIMAL(15,2),
        Max_Loan DECIMAL(15,2),
        approved_by VARCHAR(100),
        approval_date DATE,
        branch_id INT,
        Effective_Interest_Rates JSON,
        status ENUM('Pending', 'Approved', 'Cancelled', 'Closed') DEFAULT 'Pending',
        remark LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    // 📝 Insert query
    const insertQuery = `
      INSERT INTO loan_application (
        BorrowerId, CoBorrowerId, Borrower, Scheme, Scheme_ID, Print_Name,
        Mobile_Number, Alternate_Number, Co_Borrower, Relation, Nominee,
        Nominee_Relation, Ornament_Photo, Pledge_Item_List, Loan_amount,
        Doc_Charges, Net_Payable, Valuer_1, Valuer_2, Loan_Tenure, Min_Loan,
        Max_Loan, approved_by, approval_date, branch_id, Effective_Interest_Rates
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 🧩 Execute insert
    const [result] = await db.query(insertQuery, [
      BorrowerId,
      CoBorrowerId,
      Borrower,
      Scheme,
      Scheme_ID,
      Print_Name,
      Mobile_Number,
      Alternate_Number,
      Co_Borrower,
      Relation,
      Nominee,
      Nominee_Relation,
      Ornament_Photo,
      JSON.stringify(Pledge_Item_List || []),
      Loan_amount,
      Doc_Charges,
      Net_Payable,
      Valuer_1,
      Valuer_2,
      Loan_Tenure,
      Min_Loan,
      Max_Loan,
      approved_by,
      approval_date,
      branch_id,
      JSON.stringify(Effective_Interest_Rates || {}),
    ]);

    // 🎉 Success response
    res.status(201).json({
      message: "✅ Loan application added successfully",
      loanApplicationId: result.insertId,
      uploadedPhoto: Ornament_Photo,
    });

  } catch (error) {
    console.error("❌ Error processing loan application:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.getLoanApplications = async (req, res) => {
  try {
    // 📦 Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 🔍 Optional status filter (Include Closed status)
    const { status } = req.query;
    let whereClause = "";
    const params = [];

    // Add Closed to the allowed statuses
    if (status && ["Pending", "Approved", "Cancelled", "Closed"].includes(status)) {
      whereClause = "WHERE status = ?";
      params.push(status);
    }

    // 🧮 Total count for pagination
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM loan_application ${whereClause}`,
      params
    );

    // 🧾 Fetch paginated + filtered data
    const [rows] = await db.query(
      `
      SELECT 
        id AS Loan_No,
        Borrower AS Party_Name,
        DATE(created_at) AS Loan_Date,
        Loan_amount AS Loan_Amount,
        status AS Status,
        approved_by AS Approved_By,
        approved_by AS Added_By
      FROM loan_application
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    // ✅ Response
    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: rows,
    });
  } catch (error) {
    console.error("❌ Error fetching loan applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan applications",
      error: error.message,
    });
  }
};


exports.cancelLoanApplication = async (req, res) => {
  try {
    const { remark, id } = req.body;

    // Validate input
    if (!id) {
      return res.status(400).json({ success: false, message: "Loan application ID is required." });
    }

    if (!remark) {
      return res.status(400).json({ success: false, message: "Remark is required to cancel the loan." });
    }

    // Check if loan application exists
    const [existing] = await db.query("SELECT status FROM loan_application WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Loan application not found." });
    }

    const currentStatus = existing[0].status;

    // ✅ Only allow cancel if status is 'Pending'
    if (currentStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a loan that is already '${currentStatus}'. Only pending loans can be cancelled.`,
      });
    }

    // 🔄 Update status to 'Cancelled' and add remark
    await db.query(
      "UPDATE loan_application SET status = 'Cancelled', remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [remark, id]
    );

    return res.status(200).json({
      success: true,
      message: "Loan application cancelled successfully.",
      data: { id, status: "Cancelled", remark },
    });
  } catch (error) {
    console.error("❌ Error cancelling loan:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling loan application.",
      error: error.message,
    });
  }
};


exports.getLoanRemark = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Loan application ID is required" 
      });
    }

    // Minimal version - only get remark
    const [loan] = await db.query(
      "SELECT id, remark FROM loan_application WHERE id = ?",
      [id]
    );

    if (loan.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan application not found"
      });
    }

    const loanData = loan[0];

    res.status(200).json({
      success: true,
      data: {
        id: loanData.id,
        remark: loanData.remark || ""
      },
      message: "Remark retrieved successfully"
    });

  } catch (error) {
    console.error("❌ Error fetching loan remark:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching remark",
      error: error.message
    });
  }
};



exports.getCustomerRemark = async (req, res) => {
  try {
    // 1. Get the customer ID from the URL parameters (req.params)
    const { id } = req.params; 

    // Validate input
    if (!id) {
      // While id should always be present if the route is defined correctly, this check is good practice
      return res.status(400).json({ success: false, message: "Customer ID is required in the URL." });
    }

    // 2. Perform the retrieval (SELECT) operation
    const [results] = await db.query(
      // SELECT only the id and Remark fields
      "SELECT id, Remark FROM customers WHERE id = ?",
      [id]
    );

    // 3. Check if any customer was found
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    // 4. Success response (returns the first/only result)
    const customerData = results[0];

    return res.status(200).json({
      success: true,
      message: `Remark for customer ID ${id} retrieved successfully.`,
      data: {
        id: customerData.id,
        remark: customerData.Remark,
      },
    });
  } catch (error) {
    console.error("❌ Error retrieving customer remark:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving customer remark.",
      error: error.message,
    });
  }
};