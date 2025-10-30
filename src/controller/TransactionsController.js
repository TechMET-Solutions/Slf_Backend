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
