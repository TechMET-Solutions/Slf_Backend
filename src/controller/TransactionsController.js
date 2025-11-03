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

exports.getLoanApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Loan application ID is required" });
    }

    // 🧩 Query with Joins
    const query = `
      SELECT 
        la.id, 
        la.BorrowerId, 
        la.CoBorrowerId, 
        la.Borrower, 
        la.Scheme, 
        la.Scheme_ID, 
        la.Print_Name,
        la.Mobile_Number, 
        la.Alternate_Number, 
        la.Co_Borrower, 
        la.Relation, 
        la.Nominee,
        la.Nominee_Relation, 
        la.Ornament_Photo, 
        la.Pledge_Item_List, 
        la.Loan_amount,
        la.Doc_Charges, 
        la.Net_Payable, 
        la.Valuer_1, 
        la.Valuer_2, 
        la.Loan_Tenure, 
        la.Min_Loan,
        la.Max_Loan, 
        la.approved_by, 
        la.approval_date, 
        la.branch_id, 
        la.Effective_Interest_Rates,
        la.status, 
        la.remark, 
        la.created_at, 
        la.updated_at,

        -- 🏦 Scheme details
        sd.minLoanAmount, 
        sd.maxLoanAmount, 
        sd.loanPeriod,

        -- 👤 Borrower details
        c1.signature AS borrower_signature,
        c1.profileImage AS borrower_profileImage,

        -- 🤝 Co-Borrower details
        c2.signature AS coborrower_signature,
        c2.profileImage AS coborrower_profileImage

      FROM loan_application la
      LEFT JOIN scheme_details sd ON la.Scheme_ID = sd.id
      LEFT JOIN customers c1 ON la.BorrowerId = c1.id
      LEFT JOIN customers c2 ON la.CoBorrowerId = c2.id
      WHERE la.id = ?
    `;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Loan application not found" });
    }

    const loanApplication = results[0];

    // 🧠 Parse JSON fields if they exist
    if (loanApplication.Pledge_Item_List) {
      try {
        loanApplication.Pledge_Item_List = JSON.parse(loanApplication.Pledge_Item_List);
      } catch (err) {
        console.warn("Invalid JSON for Pledge_Item_List");
      }
    }

    if (loanApplication.Effective_Interest_Rates) {
      try {
        loanApplication.Effective_Interest_Rates = JSON.parse(loanApplication.Effective_Interest_Rates);
      } catch (err) {
        console.warn("Invalid JSON for Effective_Interest_Rates");
      }
    }

    res.status(200).json({
      message: "✅ Loan application retrieved successfully",
      data: loanApplication
    });

  } catch (error) {
    console.error("❌ Error fetching loan application:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.updateLoanApplication = async (req, res) => {
  try {
    const { id } = req.params;
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
      status,
      remark
    } = req.body;

    // 📸 Ornament photo (from multer - if new file uploaded)
    const Ornament_Photo = req.file ? req.file.filename : undefined;

    if (!id) {
      return res.status(400).json({ message: "Loan application ID is required" });
    }

    // 🔍 Check if loan application exists
    const checkQuery = `SELECT id FROM loan_application WHERE id = ?`;
    const [checkResults] = await db.query(checkQuery, [id]);

    if (checkResults.length === 0) {
      return res.status(404).json({ message: "Loan application not found" });
    }

    // 🛠️ Build dynamic update query
    let updateFields = [];
    let updateValues = [];

    // Helper function to add field to update
    const addField = (field, value) => {
      if (value !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(value);
      }
    };

    // Add all fields that are provided
    addField('BorrowerId', BorrowerId);
    addField('CoBorrowerId', CoBorrowerId);
    addField('Borrower', Borrower);
    addField('Scheme', Scheme);
    addField('Scheme_ID', Scheme_ID);
    addField('Print_Name', Print_Name);
    addField('Mobile_Number', Mobile_Number);
    addField('Alternate_Number', Alternate_Number);
    addField('Co_Borrower', Co_Borrower);
    addField('Relation', Relation);
    addField('Nominee', Nominee);
    addField('Nominee_Relation', Nominee_Relation);
    addField('Ornament_Photo', Ornament_Photo);
    addField('Pledge_Item_List', Pledge_Item_List ? JSON.stringify(Pledge_Item_List) : undefined);
    addField('Loan_amount', Loan_amount);
    addField('Doc_Charges', Doc_Charges);
    addField('Net_Payable', Net_Payable);
    addField('Valuer_1', Valuer_1);
    addField('Valuer_2', Valuer_2);
    addField('Loan_Tenure', Loan_Tenure);
    addField('Min_Loan', Min_Loan);
    addField('Max_Loan', Max_Loan);
    addField('approved_by', approved_by);
    addField('approval_date', approval_date);
    addField('branch_id', branch_id);
    addField('Effective_Interest_Rates', Effective_Interest_Rates ? JSON.stringify(Effective_Interest_Rates) : undefined);
    addField('status', status);
    addField('remark', remark);

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Add ID to values array
    updateValues.push(id);

    const updateQuery = `
      UPDATE loan_application 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    // 🧩 Execute update
    const [result] = await db.query(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Loan application not found or no changes made" });
    }

    // 🎉 Success response
    res.status(200).json({
      message: "✅ Loan application updated successfully",
      affectedRows: result.affectedRows,
      updatedPhoto: Ornament_Photo
    });

  } catch (error) {
    console.error("❌ Error updating loan application:", error);
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
        BorrowerId,
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

exports.addLoanDocument = async (req, res) => {
  try {
    const { loan_id, file_description, uploaded_by } = req.body;
    const file = req.file;

    // 🧩 Validation
    if (!loan_id || !file) {
      return res.status(400).json({
        success: false,
        message: "loan_id and document file are required.",
      });
    }

    // 🏗️ Create Table if Not Exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS loan_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_description TEXT,
        uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(100),
        document LONGTEXT,
        FOREIGN KEY (loan_id) REFERENCES loan_application(id) ON DELETE CASCADE
      );
    `;
    await db.query(createTableQuery);

    // 📄 File details
    const file_name = file.originalname;
    const document = `${file.filename}`; // store relative path

    // 💾 Insert into DB
    const insertQuery = `
      INSERT INTO loan_documents 
      (loan_id, file_name, file_description, uploaded_date, uploaded_by, document)
      VALUES (?, ?, ?, NOW(), ?, ?)
    `;

    const [result] = await db.query(insertQuery, [
      loan_id,
      file_name,
      file_description || null,
      uploaded_by || "System",
      document,
    ]);

    res.status(201).json({
      success: true,
      message: "Loan document uploaded successfully.",
      document_id: result.insertId,
      file_path: document,
    });
  } catch (error) {
    console.error("Error adding loan document:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while uploading document.",
      error: error.message,
    });
  }
};

exports.getLoanDocumentsByLoanId = async (req, res) => {
  try {
    const { loan_id } = req.params;

    // 🧩 Validation
    if (!loan_id) {
      return res.status(400).json({
        success: false,
        message: "Loan ID is required in params.",
      });
    }

    // 🔍 Fetch documents for given loan_id
    const query = `
      SELECT id, loan_id, file_name, file_description, uploaded_date, uploaded_by, document 
      FROM loan_documents 
      WHERE loan_id = ?
      ORDER BY uploaded_date DESC
    `;

    const [rows] = await db.query(query, [loan_id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No documents found for this Loan ID.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan documents fetched successfully.",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching loan documents:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching loan documents.",
      error: error.message,
    });
  }
};


exports.getAppraisalNote = async (req, res) => {
  try {
    const { loan_id } = req.params;

    if (!loan_id) {
      return res.status(400).json({
        success: false,
        message: "Loan ID is required",
      });
    }

    // Fetch loan application data
    const [loanData] = await db.query(
      `SELECT 
          id, 
          BorrowerId,
          Pledge_Item_List,
          Loan_amount,
          remark,
          Print_Name AS Name,
          approval_date AS Date
       FROM loan_application 
       WHERE id = ?`,
      [loan_id]
    );

    if (loanData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan application not found",
      });
    }

    const loan = loanData[0];

    // Fetch customer signature
    const [customerData] = await db.query(
      `SELECT signature FROM customers WHERE id = ?`,
      [loan.BorrowerId]
    );

    let customerSignature = "";
    if (customerData.length > 0 && customerData[0].signature) {
      customerSignature = customerData[0].signature;
    }

    // ✅ Parse and normalize Pledge_Item_List (handles double-encoded JSON)
    let pledgeItems = [];
    try {
      let parsed = JSON.parse(loan.Pledge_Item_List || "[]");

      // If parsed result is still a string, parse again
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      if (Array.isArray(parsed)) {
        pledgeItems = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        pledgeItems = [parsed];
      } else {
        pledgeItems = [];
      }
    } catch (err) {
      console.error("❌ Error parsing Pledge_Item_List JSON:", err);
      pledgeItems = [];
    }

    // ✅ Map ornaments
    const ornaments = pledgeItems.map((item) => ({
      ornamentName: item.particular || "",
      quantity: item.nos || "",
      grossWeight: item.gross || "",
      netWeight: item.netWeight || "",
      purity: item.purity || "",
      ratePerGram: item.rate || "",
      eligibleAmount: item.valuation || "",
      remark: item.remark || "",
    }));

    // ✅ Structured response
    const appraisalData = {
      loan_id: loan.id,
      borrower_id: loan.BorrowerId,
      loan_amount: loan.Loan_amount,
      date: loan.Date,
      name: loan.Name,
      remark: loan.remark,
      signature: customerSignature,
      ornaments,
    };

    return res.status(200).json({
      success: true,
      message: "Appraisal Note fetched successfully",
      data: appraisalData,
    });
  } catch (error) {
    console.error("❌ Error in getAppraisalNote:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ✅ Approve Loan Application Controller
exports.approveLoanApplication = async (req, res) => {
  try {
    const { id, approved_by } = req.body;

    // 🔍 Validate input
    if (!id || !approved_by) {
      return res.status(400).json({
        success: false,
        message: "Loan ID and approved_by fields are required.",
      });
    }

    // 🗓️ Set current date as approval date
    const approval_date = new Date();

    // 🧾 Update query
    const updateQuery = `
      UPDATE loan_application
      SET status = 'Approved',
          approved_by = ?,
          approval_date = ?
      WHERE id = ?
    `;

    // ⚙️ Execute update
    const [result] = await db.query(updateQuery, [
      approved_by,
      approval_date,
      id,
    ]);

    // 🧠 Check if record updated
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan application not found.",
      });
    }

    // 🎉 Success
    res.status(200).json({
      success: true,
      message: "✅ Loan application approved successfully.",
      approval_date,
    });

  } catch (error) {
    console.error("❌ Error approving loan:", error);
    res.status(500).json({
      success: false,
      message: "Server error while approving loan.",
      error: error.message,
    });
  }
};
