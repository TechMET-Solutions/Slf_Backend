const db = require("../../config/database");
const { encryptData, decryptData } = require("../Helpers/cryptoHelper");
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");

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
      status,
      schemes, // ✅ Expecting JSON array of { id, schemeName }
    } = decryptedPayload;

    if (
      !branch_code ||
      !branch_name ||
      !print_name ||
      !address_line1 ||
      !address_line3 ||
      !mobile_no
    ) {
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
        schemes JSON, -- ✅ New column to store scheme mappings
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    // ✅ Insert branch with scheme data
    const insertQuery = `
      INSERT INTO branch_details
      (branch_code, branch_name, print_name, address_line1, address_line3, mobile_no, lead_person, is_main, status, schemes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      JSON.stringify(schemes || []), // ✅ Save schemes as JSON
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
    // 📦 Get pagination parameters from query (default: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Fetch total count (for frontend pagination)
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM branch_details"
    );

    // ✅ Fetch paginated records
    const [rows] = await db.query(
      "SELECT * FROM branch_details ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    // 🔒 Encrypt response
    const encryptedResponse = encryptData(
      JSON.stringify({ branches: rows, total, page, limit })
    );

    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error fetching branches:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getBranchess = async (req, res) => {
  try {
    // ✅ Fetch all branches
    const [branches] = await db.query(`
      SELECT 
        id, 
        branch_code, 
        branch_name 
      FROM branch_details
    `);

    // ✅ Fetch total count (for frontend pagination)
    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) AS total FROM branch_details
    `);

    res.status(200).json({
      success: true,
      total,
      data: branches
    });

  } catch (error) {
    console.error("❌ Error fetching branches:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.updateBranch = async (req, res) => {
  try {
    // 🔓 Decrypt incoming payload
    if (!req.body.data) {
      return res.status(400).json({ message: "Missing encrypted data" });
    }
    const encryptedPayload = req.body.data;
    const decrypted = JSON.parse(decryptData(encryptedPayload));
    const {
      id,
      branch_code,
      branch_name,
      print_name,
      address_line1,
      address_line3,
      mobile_no,
      lead_person,
      is_main,
      status,
    } = decrypted;

    if (!id) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    // 🧩 Update query
    const [result] = await db.query(
      `UPDATE branch_details 
       SET branch_code=?, branch_name=?, print_name=?, address_line1=?, address_line3=?, 
           mobile_no=?, lead_person=?, is_main=?, status=? 
       WHERE id=?`,
      [
        branch_code,
        branch_name,
        print_name,
        address_line1,
        address_line3,
        mobile_no,
        lead_person,
        is_main ? "1" : "0",
        status ? "1" : "0",
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const encryptedResponse = encryptData(
      JSON.stringify({ message: "Branch updated successfully" })
    );
    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error updating branch:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateBranchStatus = async (req, res) => {
  try {
    // 🔹 Decrypt incoming data
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const { id, status } = decryptedPayload; // status will be "0" or "1"
    console.log(decryptedPayload, "decryptedPayload");
    if (!id || (status !== "0" && status !== "1")) {
      return res.status(400).json({ message: "Invalid branch ID or status" });
    }

    // ✅ Update branch status
    const updateQuery = `UPDATE branch_details SET status = ? WHERE id = ?`;
    await db.query(updateQuery, [status, id]);

    // 🔒 Encrypt and send response
    const responsePayload = {
      message: "✅ Branch status updated successfully",
      id,
      newStatus: status,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error updating branch status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.updateBranchSchemes = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    if (!encryptedPayload) {
      return res.status(400).json({ message: "Missing encrypted payload (data)" });
    }

    // 🔓 Step 1: Decrypt
    let decryptedPayload = decryptData(encryptedPayload);
    console.log("🧩 Raw decryptedPayload:", decryptedPayload);

    // 🧠 Step 2: Ensure it's a JS object (double-parse safe)
    try {
      // Try parsing once
      if (typeof decryptedPayload === "string") {
        decryptedPayload = JSON.parse(decryptedPayload);
      }

      // If still a string after first parse, parse again
      if (typeof decryptedPayload === "string") {
        decryptedPayload = JSON.parse(decryptedPayload);
      }
    } catch (err) {
      console.error("❌ JSON parse error on decryptedPayload:", err.message);
      return res.status(400).json({ message: "Invalid decrypted payload format" });
    }

    console.log("🟢 Final Decrypted Payload (object):", decryptedPayload);
    console.log("✅ Type of decryptedPayload:", typeof decryptedPayload);

    const { branchId, schemes } = decryptedPayload;
    console.log("branchId:", branchId, "schemes:", schemes, "isArray?", Array.isArray(schemes));

    if (!branchId || !Array.isArray(schemes)) {
      return res.status(400).json({ message: "branchId and schemes are required" });
    }

    // ✅ Continue with table creation and update logic
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
    await db.query(createTableQuery);

    const [columns] = await db.query(`SHOW COLUMNS FROM branch_details LIKE 'schemes'`);
    if (columns.length === 0) {
      await db.query(`ALTER TABLE branch_details ADD COLUMN schemes JSON`);
    }

    const updateQuery = `UPDATE branch_details SET schemes = ? WHERE id = ?`;
    const [result] = await db.query(updateQuery, [JSON.stringify(schemes), branchId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const responsePayload = {
      message: "✅ Schemes updated successfully",
      branchId,
      totalSchemes: schemes.length,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error updating branch schemes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};





exports.AddItemProfileList = async (req, res) => {
  try {
    // 🔹 Decrypt incoming payload
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const {
      code,
      name,
      print_name,
      added_by,
      add_on,
      modified_by,
      modified_on,
      status,
      remark,
    } = decryptedPayload;

    // ✅ Validate mandatory fields
    if (!code || !name) {
      return res.status(400).json({ message: "Code and Name are required" });
    }

    // ✅ Ensure table exists (DATE → VARCHAR)
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS item_profile_list (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            print_name VARCHAR(255) NOT NULL,
            added_by VARCHAR(100),
            add_on VARCHAR(50),
            modified_by VARCHAR(100) NOT NULL,
            modified_on VARCHAR(50) NOT NULL,
            remark TEXT,
            status BOOLEAN DEFAULT 1
        )
        `;
    await db.query(createTableQuery);

    // ✅ Insert new item (if no status provided → default true)
    const insertQuery = `
  INSERT INTO item_profile_list 
  (code, name,print_name, added_by, add_on, modified_by, modified_on, remark, status)
  VALUES (?, ?, ?, ?, ?, ?, ?,?, ?)
`;

    await db.query(insertQuery, [
      code,
      name,
      print_name,
      added_by || null,
      add_on || null,
      modified_by || "",
      modified_on || "",
      remark || null,
      status !== undefined ? status : 1,
    ]);


    // 🔒 Encrypt and send response
    const responsePayload = { message: "✅ Item added successfully" };
    const encryptedResponse = encryptData(JSON.stringify(responsePayload));

    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error adding item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateItemProfile = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const {
      id,
      code,
      name,
      print_name,
      added_by,
      add_on,
      modified_by,
      modified_on,
      status,
      remark,
    } = decryptedPayload;

    if (!id) return res.status(400).json({ message: "Invalid item ID" });

    const updateFields = [];
    const updateValues = [];

    if (code !== undefined) {
      updateFields.push("code = ?");
      updateValues.push(code);
    }
    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (print_name !== undefined) {
      updateFields.push("print_name = ?");
      updateValues.push(print_name);
    }
    if (added_by !== undefined) {
      updateFields.push("added_by = ?");
      updateValues.push(added_by);
    }
    if (add_on !== undefined) {
      updateFields.push("add_on = ?");
      updateValues.push(add_on);
    }
    if (modified_by !== undefined) {
      updateFields.push("modified_by = ?");
      updateValues.push(modified_by);
    }
    if (modified_on !== undefined) {
      updateFields.push("modified_on = ?");
      updateValues.push(modified_on);
    }
    if (remark !== undefined) {
      updateFields.push("remark = ?");
      updateValues.push(remark);
    }
    if (status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    updateValues.push(id); // for WHERE clause
    const updateQuery = `UPDATE item_profile_list SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    await db.query(updateQuery, updateValues);

    const responsePayload = { message: "✅ Item updated successfully", id };
    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error updating item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllItemProfiles = async (req, res) => {
  try {
    // 📦 Pagination parameters (default: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Get total count for pagination check
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM item_profile_list"
    );

    let rows;

    // 🧭 If more than limit records, apply pagination
    if (total > limit) {
      const [paginatedRows] = await db.query(
        `SELECT id, code, name, added_by, add_on, modified_by, modified_on, remark, status 
         FROM item_profile_list 
         ORDER BY id DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      rows = paginatedRows;
    } else {
      // ⚡ If less than or equal to limit, fetch all without pagination
      const [allRows] = await db.query(
        `SELECT id, code, name, added_by, add_on, modified_by, modified_on, remark, status 
         FROM item_profile_list 
         ORDER BY id DESC`
      );
      rows = allRows;
    }

    // 🔒 Encrypt the response
    const encryptedResponse = encryptData(
      JSON.stringify({
        items: rows,
        total,
        page,
        limit,
        showPagination: total > limit, // 👈 frontend can use this flag
      })
    );

    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error fetching item profiles:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.editItemProfileStatus = async (req, res) => {
  try {
    // 🔹 Decrypt incoming data
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const { id, status } = decryptedPayload; // status = "0" or "1"
    console.log(decryptedPayload, "decryptedPayload");

    // ✅ Validate input
    if (!id || (status !== 0 && status !== 1)) {
      return res.status(400).json({ message: "Invalid item ID or status" });
    }

    // ✅ Update status
    const updateQuery = `UPDATE item_profile_list SET status = ? WHERE id = ?`;
    await db.query(updateQuery, [status, id]);

    // 🔒 Encrypt and send response
    const responsePayload = {
      message: "✅ Item status updated successfully",
    };
    const encryptedResponse = encryptData(JSON.stringify(responsePayload));

    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error updating item status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addGoldRate = async (req, res) => {
  try {
    // ✅ Decrypt incoming request
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const { push_date, gold_rate, added_on, added_by } = decryptedPayload;

    // 🔹 Validation
    if (!push_date || !gold_rate || !added_on || !added_by) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // ✅ Ensure table exists (DATE → VARCHAR)
    const createTableQuery = `
            CREATE TABLE IF NOT EXISTS gold_rate_list (
                id INT AUTO_INCREMENT PRIMARY KEY,
                push_date VARCHAR(50) NOT NULL,
                gold_rate DECIMAL(10,2) NOT NULL,
                added_on VARCHAR(50) NOT NULL,
                added_by VARCHAR(100) NOT NULL
            )
        `;
    await db.query(createTableQuery);

    // ✅ Insert new gold rate
    const insertQuery = `
            INSERT INTO gold_rate_list (push_date, gold_rate, added_on, added_by)
            VALUES (?, ?, ?, ?)
        `;
    await db.query(insertQuery, [push_date, gold_rate, added_on, added_by]);

    // 🔒 Encrypt and send success response
    const responsePayload = { message: "✅ Gold rate added successfully" };
    const encryptedResponse = encryptData(JSON.stringify(responsePayload));

    res.status(201).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error in addGoldRate:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔸 GET API - Fetch All Gold Rates
exports.getGoldRates = async (req, res) => {
  try {
    // 📦 Pagination parameters (default: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Ensure table exists (VARCHAR schema)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS gold_rate_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        push_date VARCHAR(50) NOT NULL,
        gold_rate DECIMAL(10,2) NOT NULL,
        added_on VARCHAR(50) NOT NULL,
        added_by VARCHAR(100) NOT NULL
      )
    `;
    await db.query(createTableQuery);

    // ✅ Get total count for pagination check
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM gold_rate_list"
    );

    let rows;

    // 🧭 If more than limit records, apply pagination
    if (total > limit) {
      const [paginatedRows] = await db.query(
        `SELECT id, push_date, gold_rate, added_on, added_by
         FROM gold_rate_list
         ORDER BY id DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      rows = paginatedRows;
    } else {
      // ⚡ If less than or equal to limit, fetch all without pagination
      const [allRows] = await db.query(
        `SELECT id, push_date, gold_rate, added_on, added_by
         FROM gold_rate_list
         ORDER BY id DESC`
      );
      rows = allRows;
    }

    // 🔒 Encrypt the response
    const encryptedResponse = encryptData(
      JSON.stringify({
        items: rows,
        total,
        page,
        limit,
        showPagination: total > limit, // 👈 frontend can use this flag
      })
    );

    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error fetching gold rates:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🟩 ADD PRODUCT PURITY
exports.addProductPurity = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;

    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const { purity_name, purity_percent, loan_type, added_by, status } =
      decryptedPayload;

    if (!purity_name || !purity_percent || !loan_type) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Create table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS product_purity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purity_name VARCHAR(50) NOT NULL,
        purity_percent VARCHAR(50) NOT NULL,
        loan_type VARCHAR(50) NOT NULL DEFAULT 'gold',
        added_by VARCHAR(50) NOT NULL,
        status BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    const insertQuery = `
      INSERT INTO product_purity 
      (purity_name, purity_percent, loan_type, added_by, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insertQuery, [
      purity_name,
      purity_percent,
      loan_type,
      added_by || null,
      status !== undefined ? status : 1,
    ]);

    const responsePayload = {
      message: "✅ Product Purity added successfully",
      id: result.insertId,
    };
    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("Add Product Purity Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟦 GET ALL PRODUCT PURITIES
exports.getAllProductPurities = async (req, res) => {
  try {
    // 📦 Pagination parameters (default: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Get total count for pagination check
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM product_purity"
    );

    let rows;

    // 🧭 If more than limit records, apply pagination
    if (total > limit) {
      const [paginatedRows] = await db.query(
        `SELECT * FROM product_purity 
         ORDER BY id DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      rows = paginatedRows;
    } else {
      // ⚡ If less than or equal to limit, fetch all without pagination
      const [allRows] = await db.query(
        `SELECT * FROM product_purity 
         ORDER BY id DESC`
      );
      rows = allRows;
    }

    // 🔒 Encrypt the response
    const encryptedResponse = encryptData(
      JSON.stringify({
        items: rows,
        total,
        page,
        limit,
        showPagination: total > limit, // 👈 frontend can use this flag
      })
    );

    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error fetching Product Purity:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟨 UPDATE PRODUCT PURITY
exports.updateProductPurity = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const { id, purity_name, purity_percent, loan_type, added_by, status } =
      decryptedPayload;

    if (!id) return res.status(400).json({ message: "Invalid item ID" });

    const updateFields = [];
    const updateValues = [];

    if (purity_name !== undefined) {
      updateFields.push("purity_name = ?");
      updateValues.push(purity_name);
    }
    if (purity_percent !== undefined) {
      updateFields.push("purity_percent = ?");
      updateValues.push(purity_percent);
    }
    if (loan_type !== undefined) {
      updateFields.push("loan_type = ?");
      updateValues.push(loan_type);
    }
    if (added_by !== undefined) {
      updateFields.push("added_by = ?");
      updateValues.push(added_by);
    }
    if (status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updateValues.push(id);
    const updateQuery = `UPDATE product_purity SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    await db.query(updateQuery, updateValues);

    const responsePayload = {
      message: "✅ Product Purity updated successfully",
      id,
    };
    res.status(200).json({ data: responsePayload });
  } catch (err) {
    console.error("Update Product Purity Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟥 DELETE PRODUCT PURITY
exports.deleteProductPurity = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    if (!encryptedPayload) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const { id } = decryptedPayload;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Check if record exists
    const [check] = await db.query(
      `SELECT id FROM product_purity WHERE id = ?`,
      [id]
    );
    if (check.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Delete the record
    const [result] = await db.query(`DELETE FROM product_purity WHERE id = ?`, [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No record deleted" });
    }

    const responsePayload = {
      message: "🗑️ Product Purity Deleted Successfully",
      affectedRows: result.affectedRows,
    };
    res.json({ data: encryptData(JSON.stringify(responsePayload)) });
  } catch (err) {
    console.error("Delete Product Purity Error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

// exports.updateProductPurityStatus = async (req, res) => {
//     try {
//         // 🔹 Decrypt incoming data
//         const encryptedPayload = req.body.data;
//         const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

//         const { id, status } = decryptedPayload; // status = "0" or "1"
//         console.log(decryptedPayload, "decryptedPayload");

//         // ✅ Validate input
//         if (!id || (status !== 0 && status !== 1)) {
//             return res.status(400).json({ message: "Invalid item ID or status" });
//         }

//         // ✅ Update status
//         const updateQuery = `UPDATE product_purity SET status = ? WHERE id = ?`;
//         await db.query(updateQuery, [status, id]);

//         // 🔒 Encrypt and send response
//         const responsePayload = {
//             message: "✅ Product Purity status updated successfully",
//         };
//         const encryptedResponse = encryptData(JSON.stringify(responsePayload));

//         res.status(200).json({ data: encryptedResponse });
//     } catch (error) {
//         console.error("❌ Error updating Product Purity status:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

// Document Proof

exports.addDocument = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const payloadObj = JSON.parse(decryptedPayload);

    const {
      proof_type,
      proof_number,
      is_id_proof = false,
      is_address_proof = false,
      added_by = null,
      modified_by = null,
      status = "Inactive",
    } = payloadObj;

    console.log(proof_type); // "Aadhar Card"
    console.log(proof_number); // "7620075780"

    const trimmedProofType = proof_type?.trim();
    const trimmedProofNumber = proof_number?.trim();
    const trimmedAddedBy = added_by?.trim() || null;
    const trimmedModifiedBy = modified_by?.trim() || null;
    const dbStatus = status?.trim() === "Active" ? 1 : 0;

    if (!trimmedProofType || !trimmedProofNumber) {
      return res
        .status(400)
        .json({
          message: "Required fields missing: proof_type or proof_number",
        });
    }

    const filePath = path.join("document_proof_images", req.file.filename);

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS document_proofs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proof_type VARCHAR(100) NOT NULL,
        proof_number VARCHAR(100) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        is_id_proof TINYINT(1) DEFAULT 0,
        is_address_proof TINYINT(1) DEFAULT 0,
        added_by VARCHAR(100),
        modified_by VARCHAR(100),
        status TINYINT(1) DEFAULT 1,
        added_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    const insertQuery = `
      INSERT INTO document_proofs
      (proof_type, proof_number, file_path, is_id_proof, is_address_proof, added_by, modified_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insertQuery, [
      trimmedProofType,
      trimmedProofNumber,
      filePath,
      is_id_proof ? 1 : 0,
      is_address_proof ? 1 : 0,
      trimmedAddedBy,
      trimmedModifiedBy,
      dbStatus,
    ]);

    const responsePayload = {
      message: "✅ Document proof added successfully",
      documentId: result.insertId,
      file_path: filePath,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(201).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error adding document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const sortBy = req.query.sortBy || "id";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    const query = `SELECT * FROM document_proofs ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
    const [rows] = await db.query(query, [limit, offset]);

    const BASE_URL = process.env.BASE_URL || "http://localhost:5000/upload";

    // here append base url & replace backslash
    const formattedRows = rows.map(r => ({
      ...r,
      file_path: `${BASE_URL}/${r.file_path.replace(/\\/g, "/")}`
    }));

    const encryptedResponse = encryptData(JSON.stringify(formattedRows));

    res.status(200).json({
      message: "✅ Documents fetched successfully",
      data: encryptedResponse,
      page,
      limit,
      total: formattedRows.length,
    });
  } catch (error) {
    console.error("❌ Error fetching documents:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateDocumentStatus = async (req, res) => {
  try {
    // 🔹 Decrypt incoming data
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const payloadObj = JSON.parse(decryptedPayload);

    const { id, status } = payloadObj;

    if (!id || (status !== "0" && status !== "1")) {
      return res.status(400).json({ message: "Invalid document ID or status" });
    }

    const updateQuery = `UPDATE document_proofs SET status = ? WHERE id = ?`;
    await db.query(updateQuery, [status, id]);

    const responsePayload = {
      message: "✅ Document status updated successfully",
      documentId: id,
      newStatus: status,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error updating document status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.updateDocument = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const payloadObj = JSON.parse(decryptedPayload);

    const {
      id,
      proof_type,
      proof_number,
      is_id_proof = false,
      is_address_proof = false,
      added_by = null,
      modified_by = null,
      status = "Inactive",
    } = payloadObj;

    if (!id) {
      return res.status(400).json({ message: "Document ID missing" });
    }

    const trimmedProofType = proof_type?.trim();
    const trimmedProofNumber = proof_number?.trim();
    const trimmedAddedBy = added_by?.trim() || null;
    const trimmedModifiedBy = modified_by?.trim() || null;
    const dbStatus = status?.trim() === "Active" ? 1 : 0;

    let filePathQuery = "";
    let filePathValue = null;

    // if file uploaded then update filepath
    if (req.file) {
      const filePath = path.join("document_proof_images", req.file.filename);
      filePathQuery = `, file_path = ?`;
      filePathValue = filePath;
    }

    const updateQuery = `
      UPDATE document_proofs
      SET proof_type = ?, proof_number = ?, is_id_proof = ?, is_address_proof = ?, 
          added_by = ?, modified_by = ?, status = ? ${filePathQuery}
      WHERE id = ?
    `;

    const queryValues = [
      trimmedProofType,
      trimmedProofNumber,
      is_id_proof ? 1 : 0,
      is_address_proof ? 1 : 0,
      trimmedAddedBy,
      trimmedModifiedBy,
      dbStatus,
    ];

    if (filePathValue) queryValues.push(filePathValue);

    queryValues.push(id);

    await db.query(updateQuery, queryValues);

    const responsePayload = {
      message: "✅ Document updated successfully",
      documentId: id,
      file_path: filePathValue || null,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error updating document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ================ AREA =============================

// 🟩 ADD AREA
exports.addArea = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;

    if (!encryptedPayload) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const { area_locality, city, state, pincode, landmark } = decryptedPayload;

    if (!area_locality || !city || !state || !pincode || !landmark) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Create table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS area (
        id INT AUTO_INCREMENT PRIMARY KEY,
        area_locality VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        landmark VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    // ✅ Insert record
    const insertQuery = `
      INSERT INTO area (area_locality, city, state, pincode, landmark)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insertQuery, [
      area_locality,
      city,
      state,
      pincode,
      landmark,
    ]);

    const responsePayload = {
      message: "✅ Area added successfully",
      id: result.insertId,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("Add Area Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟦 GET ALL PRODUCT PURITIES
exports.getArea = async (req, res) => {
  try {
    // 📦 Pagination parameters (default: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Get total count for pagination check
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM area"
    );

    let rows;

    // 🧭 If more than limit records, apply pagination
    if (total > limit) {
      const [paginatedRows] = await db.query(
        `SELECT * FROM area 
         ORDER BY id DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      rows = paginatedRows;
    } else {
      // ⚡ If less than or equal to limit, fetch all without pagination
      const [allRows] = await db.query(
        `SELECT * FROM area 
         ORDER BY id DESC`
      );
      rows = allRows;
    }

    // 🔒 Encrypt the response
    const encryptedResponse = encryptData(
      JSON.stringify({
        items: rows,
        total,
        page,
        limit,
        showPagination: total > limit, // 👈 frontend can use this flag
      })
    );

    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error fetching Area:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟡 UPDATE AREA
exports.updateArea = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;

    if (!encryptedPayload) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const { id, area_locality, city, state, pincode, landmark } =
      decryptedPayload;

    if (!id || !area_locality || !city || !state || !pincode || !landmark) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const updateQuery = `
      UPDATE area 
      SET area_locality = ?, city = ?, state = ?, pincode = ?, landmark = ?
      WHERE id = ?
    `;
    const [result] = await db.query(updateQuery, [
      area_locality,
      city,
      state,
      pincode,
      landmark,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Area not found" });
    }

    const responsePayload = {
      message: "✅ Area updated successfully",
      id,
    };
    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("Update Area Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🔴 DELETE AREA
exports.deleteArea = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;

    if (!encryptedPayload) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const { id } = decryptedPayload;

    if (!id) {
      return res.status(400).json({ error: "Area ID is required" });
    }

    const deleteQuery = `DELETE FROM area WHERE id = ?`;
    const [result] = await db.query(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Area not found" });
    }

    const responsePayload = {
      message: "🗑️ Area deleted successfully",
      id,
    };
    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("Delete Area Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ==========================================================
//  EMPLOYEE PROFILE CONTROLLERS
// ==========================================================

// 🟩 ADD EMPLOYEE
// exports.createEmployee = async (req, res) => {
//   try {
//     const encryptedPayload = req.body.data;
//     const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

//     const {
//       pan_card,
//       aadhar_card,
//       emp_name,
//       emp_id,
//       mobile_no,
//       email,
//       print_name,
//       corresponding_address,
//       permanent_address,
//       branch,
//       joining_date,
//       designation,
//       date_of_birth,
//       assign_role,
//       password,
//       fax,
//       emp_image,
//       emp_add_prof,
//       emp_id_prof,
//       status
//     } = decryptedPayload;

//     // ✅ Validate required fields
//     if (
//       !pan_card || !aadhar_card || !emp_name || !emp_id ||
//       !mobile_no || !email || !print_name || !corresponding_address ||
//       !permanent_address || !branch || !joining_date || !designation ||
//       !date_of_birth || !assign_role || !password || !emp_image ||
//       !emp_add_prof || !emp_id_prof
//     ) {
//       return res.status(400).json({ error: "All required fields must be provided." });
//     }

//     // ✅ Hash the password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // ✅ Create table if not exists
//     const createTableQuery = `
//       CREATE TABLE IF NOT EXISTS employee (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         pan_card VARCHAR(50) NOT NULL UNIQUE,
//         aadhar_card VARCHAR(50) NOT NULL UNIQUE,
//         emp_name VARCHAR(100) NOT NULL,
//         emp_id VARCHAR(100) NOT NULL UNIQUE,
//         mobile_no VARCHAR(15) NOT NULL UNIQUE,
//         email VARCHAR(100) NOT NULL UNIQUE,
//         print_name VARCHAR(100) NOT NULL,
//         corresponding_address VARCHAR(255) NOT NULL,
//         permanent_address VARCHAR(255) NOT NULL,
//         branch VARCHAR(100) NOT NULL,
//         joining_date DATE NOT NULL,
//         designation ENUM('cashier','branch manager','executive','administrator') NOT NULL,
//         date_of_birth DATE NOT NULL,
//         assign_role ENUM('Emp','No role','auditor','minor role','branch manager','executive','administrator') NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         fax VARCHAR(100),
//         emp_image VAzRCHAR(100) NOT NULL,
//         emp_add_prof VARCHAR(100) NOT NULL,
//         emp_id_prof VARCHAR(100) NOT NULL,
//         assign_branch JSON,
//         start_time TIME,
//         end_time TIME,
//  ip_address VARCHAR(50);
//         status BOOLEAN DEFAULT 1,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `;
//     await db.query(createTableQuery);

//     // ✅ Insert into employee table
//     const insertQuery = `
//       INSERT INTO employee (
//         pan_card, aadhar_card, emp_name, emp_id, mobile_no, email,
//         print_name, corresponding_address, permanent_address, branch,
//         joining_date, designation, date_of_birth, assign_role, password,
//         fax, emp_image, emp_add_prof, emp_id_prof, status
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const values = [
//       pan_card, aadhar_card, emp_name, emp_id, mobile_no, email,
//       print_name, corresponding_address, permanent_address, branch,
//       joining_date, designation, date_of_birth, assign_role, hashedPassword,
//       fax || '', emp_image, emp_add_prof, emp_id_prof,
//       status !== undefined ? status : 1
//     ];

//     const [result] = await db.query(insertQuery, values);

//     // ✅ Prepare and send encrypted response
//     const responsePayload = {
//       message: "✅ Employee added successfully",
//       id: result.insertId,
//     };
//     const encryptedResponse = encryptData(JSON.stringify(responsePayload));
//     res.status(200).json({ data: encryptedResponse });

//   } catch (err) {
//     console.error("Add Employee Error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
exports.createEmployee = async (req, res) => {
  try {
    console.log("🟡 req.body:", req.body);
    console.log("🟡 req.files:", req.files);

    const emp_image = req.files["emp_image"] ? req.files["emp_image"][0].filename : null;
    const emp_add_prof = req.files["emp_add_prof"] ? req.files["emp_add_prof"][0].filename : null;
    const emp_id_prof = req.files["emp_id_prof"] ? req.files["emp_id_prof"][0].filename : null;

    // Parse and decrypt incoming data
    const encryptedPayload = req.body.data;
    const decrypted = decryptData(encryptedPayload); // returns a string
    console.log("🟢 Decrypted string:", decrypted);

    // Handle double-string case safely
    let decryptedPayload;
    try {
      decryptedPayload = JSON.parse(decrypted);
      // If it's still a string after parsing, parse again
      if (typeof decryptedPayload === "string") {
        decryptedPayload = JSON.parse(decryptedPayload);
      }
    } catch (err) {
      console.error("❌ JSON parse failed:", err);
      return res.status(400).json({ error: "Invalid decrypted JSON format" });
    }

    console.log("✅ Parsed object:", decryptedPayload);

    // Now destructure safely
    const {
      pan_card,
      aadhar_card,
      emp_name,
      emp_id,
      mobile_no,
      assign_role_id,
      email,
      print_name,
      Alternate_Mobile,
      corresponding_address,
      permanent_address,
      branch,
      joining_date,
      designation,
      date_of_birth,
      assign_role,
      password,
      start_time,
      end_time,
      ip_address,
      fax,
      status,
    } = decryptedPayload;

    if (
      !pan_card || !aadhar_card || !emp_name || !assign_role_id || !mobile_no || !email || !corresponding_address ||
      !permanent_address || !branch || !joining_date || !designation ||
      !date_of_birth || !assign_role || !password || !emp_image ||
      !emp_add_prof || !emp_id_prof
    ) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }

    // const hashedPassword = await bcrypt.hash(password, 12);

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS employee (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pan_card VARCHAR(50) NOT NULL UNIQUE,
        aadhar_card VARCHAR(50) NOT NULL UNIQUE,
        emp_name VARCHAR(100) NOT NULL,
        mobile_no VARCHAR(15) NOT NULL UNIQUE,
        Alternate_Mobile VARCHAR(15) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        corresponding_address VARCHAR(255) NOT NULL,
        permanent_address VARCHAR(255) NOT NULL,
        branch VARCHAR(100) NOT NULL,
        joining_date DATE NOT NULL,
        designation VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        assign_role VARCHAR(100) NOT NULL,
        assign_role_id VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        fax VARCHAR(100),
        emp_image VARCHAR(255) NOT NULL,
        emp_add_prof VARCHAR(255) NOT NULL,
        emp_id_prof VARCHAR(255) NOT NULL,
        start_time TIME,
         end_time TIME,
        ip_address VARCHAR(50),
        status BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    const insertQuery = `
      INSERT INTO employee (
        pan_card, aadhar_card, emp_name, mobile_no, Alternate_Mobile, email,
         corresponding_address, permanent_address, branch,
        joining_date, designation, date_of_birth, assign_role, assign_role_id, password,
        fax, emp_image, emp_add_prof, emp_id_prof, start_time, end_time, ip_address, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      pan_card, aadhar_card, emp_name, mobile_no, Alternate_Mobile, email,
      corresponding_address, permanent_address, branch,
      joining_date, designation, date_of_birth, assign_role, assign_role_id, password,
      fax || "",
      emp_image,
      emp_add_prof,
      emp_id_prof,

      // if frontend does not send, store NULL
      start_time || null,
      end_time || null,
      ip_address || null,

      status !== undefined ? status : 1
    ];


    const [result] = await db.query(insertQuery, values);

    const responsePayload = {
      message: "✅ Employee added successfully",
      id: result.insertId,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("Add Employee Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// 🟦 GET ALL Employee
// exports.getAllEmployee = async (req, res) => {
//   try {
//     // 📦 Pagination parameters (default: page=1, limit=10)
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // ✅ Get total count
//     const [[{ total }]] = await db.query(
//       "SELECT COUNT(*) AS total FROM employee"
//     );

//     // ✅ Get paginated employees
//     const [rows] = await db.query(
//       `SELECT * FROM employee
//        ORDER BY id DESC
//        LIMIT ? OFFSET ?`,
//       [limit, offset]
//     );

//     // 🔒 Encrypt the response
//     const encryptedResponse = encryptData(
//       JSON.stringify({
//         items: rows,
//         total,
//         page,
//         limit,
//         showPagination: total > limit,
//       })
//     );

//     res.status(200).json({ data: encryptedResponse });
//   } catch (err) {
//     console.error("❌ Error fetching employees:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

const BASE_URL = "http://localhost:5000/uploadEmployeeDoc/Employee_document";
exports.getAllEmployee = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM employee");

    const [rows] = await db.query(
      `SELECT * FROM employee ORDER BY id DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // ✅ Append full image URLs
    const employeesWithFullImagePath = rows.map(emp => ({
      ...emp,
      emp_image: emp.emp_image
        ? `${BASE_URL}/${emp.emp_image}`
        : null,
      emp_add_prof: emp.emp_add_prof
        ? `${BASE_URL}/${emp.emp_add_prof}`
        : null,
      emp_id_prof: emp.emp_id_prof
        ? `${BASE_URL}/${emp.emp_id_prof}`
        : null,
    }));

    // 🔒 Encrypt the response
    const encryptedResponse = encryptData(
      JSON.stringify({
        items: employeesWithFullImagePath,
        total,
        page,
        limit,
        showPagination: total > limit,
      })
    );

    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟩 UPDATE EMPLOYEE
// exports.updateEmployee = async (req, res) => {
//   try {
//     const encryptedPayload = req.body.data;
//     const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

//     const {
//       id,
//       pan_card,
//       aadhar_card,
//       emp_name,
//       emp_id,
//       mobile_no,
//       email,
//       print_name,
//       corresponding_address,
//       permanent_address,
//       branch,
//       joining_date,
//       designation,
//       date_of_birth,
//       assign_role,
//       password,
//       fax,
//       emp_image,
//       emp_add_prof,
//       emp_id_prof,
//       status
//     } = decryptedPayload;

//     if (!id) {
//       return res.status(400).json({ message: "Invalid employee ID" });
//     }

//     const updateFields = [];
//     const updateValues = [];

//     // Add only the fields that are provided
//     if (pan_card !== undefined) {
//       updateFields.push("pan_card = ?");
//       updateValues.push(pan_card);
//     }
//     if (aadhar_card !== undefined) {
//       updateFields.push("aadhar_card = ?");
//       updateValues.push(aadhar_card);
//     }
//     if (emp_name !== undefined) {
//       updateFields.push("emp_name = ?");
//       updateValues.push(emp_name);
//     }
//     if (emp_id !== undefined) {
//       updateFields.push("emp_id = ?");
//       updateValues.push(emp_id);
//     }
//     if (mobile_no !== undefined) {
//       updateFields.push("mobile_no = ?");
//       updateValues.push(mobile_no);
//     }
//     if (email !== undefined) {
//       updateFields.push("email = ?");
//       updateValues.push(email);
//     }
//     if (print_name !== undefined) {
//       updateFields.push("print_name = ?");
//       updateValues.push(print_name);
//     }
//     if (corresponding_address !== undefined) {
//       updateFields.push("corresponding_address = ?");
//       updateValues.push(corresponding_address);
//     }
//     if (permanent_address !== undefined) {
//       updateFields.push("permanent_address = ?");
//       updateValues.push(permanent_address);
//     }
//     if (branch !== undefined) {
//       updateFields.push("branch = ?");
//       updateValues.push(branch);
//     }
//     if (joining_date !== undefined) {
//       updateFields.push("joining_date = ?");
//       updateValues.push(joining_date);
//     }
//     if (designation !== undefined) {
//       updateFields.push("designation = ?");
//       updateValues.push(designation);
//     }
//     if (date_of_birth !== undefined) {
//       updateFields.push("date_of_birth = ?");
//       updateValues.push(date_of_birth);
//     }
//     if (assign_role !== undefined) {
//       updateFields.push("assign_role = ?");
//       updateValues.push(assign_role);
//     }
//     if (password !== undefined) {
//       updateFields.push("password = ?");
//       updateValues.push(password);
//     }
//     if (fax !== undefined) {
//       updateFields.push("fax = ?");
//       updateValues.push(fax);
//     }
//     if (emp_image !== undefined) {
//       updateFields.push("emp_image = ?");
//       updateValues.push(emp_image);
//     }
//     if (emp_add_prof !== undefined) {
//       updateFields.push("emp_add_prof = ?");
//       updateValues.push(emp_add_prof);
//     }
//     if (emp_id_prof !== undefined) {
//       updateFields.push("emp_id_prof = ?");
//       updateValues.push(emp_id_prof);
//     }
//     if (status !== undefined) {
//       updateFields.push("status = ?");
//       updateValues.push(status);
//     }

//     if (updateFields.length === 0) {
//       return res.status(400).json({ message: "No fields to update" });
//     }

//     // Finalize the query
//     updateValues.push(id);
//     const updateQuery = `
//       UPDATE employee
//       SET ${updateFields.join(", ")}
//       WHERE id = ?
//     `;
//     await db.query(updateQuery, updateValues);

//     // Prepare response
//     const responsePayload = {
//       message: "✅ Employee updated successfully",
//       id,
//     };

//     const encryptedResponse = encryptData(JSON.stringify(responsePayload));
//     res.status(200).json({ data: encryptedResponse });

//   } catch (err) {
//     console.error("❌ Error updating employee:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// 🟥 DELETE

const BASE_UPLOAD_PATH = path.join(__dirname, "../uploadEmployeeDoc/Employee_document");
exports.updateEmployee = async (req, res) => {
  try {
    console.log("🟡 req.body:", req.body);
    console.log("🟡 req.files:", req.files);

    // 1️⃣ Decrypt incoming encrypted JSON data
    const encryptedPayload = req.body.data;
    const decrypted = decryptData(encryptedPayload); // returns a string
    console.log("🟢 Decrypted string:", decrypted);

    // Handle double-string case safely
    let decryptedPayload;
    try {
      decryptedPayload = JSON.parse(decrypted);
      // If it's still a string after parsing, parse again
      if (typeof decryptedPayload === "string") {
        decryptedPayload = JSON.parse(decryptedPayload);
      }
    } catch (err) {
      console.error("❌ JSON parse failed:", err);
      return res.status(400).json({ error: "Invalid decrypted JSON format" });
    }
    const {
      id,
      pan_card,
      aadhar_card,
      emp_name,
      mobile_no,
      Alternate_Mobile,
      email,
      corresponding_address,
      permanent_address,
      branch,
      joining_date,
      designation,
      date_of_birth,
      assign_role,
      assign_role_id,
      password,
      fax,
      status,
    } = decryptedPayload;

    if (!id) {
      return res.status(400).json({ message: "Employee ID is required for update" });
    }

    // 2️⃣ Get current employee record to remove old files if replaced
    const [existing] = await db.query("SELECT * FROM employee WHERE id = ?", [id]);
    if (!existing.length) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const oldData = existing[0];

    // 3️⃣ Handle new uploaded files (optional)
    const emp_image = req.files["emp_image"] ? req.files["emp_image"][0].filename : oldData.emp_image;
    const emp_add_prof = req.files["emp_add_prof"] ? req.files["emp_add_prof"][0].filename : oldData.emp_add_prof;
    const emp_id_prof = req.files["emp_id_prof"] ? req.files["emp_id_prof"][0].filename : oldData.emp_id_prof;

    // Delete old files if new ones are uploaded
    if (req.files["emp_image"] && oldData.emp_image) {
      const oldFilePath = path.join(BASE_UPLOAD_PATH, oldData.emp_image);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }
    if (req.files["emp_add_prof"] && oldData.emp_add_prof) {
      const oldFilePath = path.join(BASE_UPLOAD_PATH, oldData.emp_add_prof);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }
    if (req.files["emp_id_prof"] && oldData.emp_id_prof) {
      const oldFilePath = path.join(BASE_UPLOAD_PATH, oldData.emp_id_prof);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }

    // 4️⃣ Prepare update fields dynamically
    const updateFields = [
      "pan_card = ?",
      "aadhar_card = ?",
      "emp_name = ?",
      "mobile_no = ?",
      "Alternate_Mobile = ?",
      "email = ?",
      "corresponding_address = ?",
      "permanent_address = ?",
      "branch = ?",
      "joining_date = ?",
      "designation = ?",
      "date_of_birth = ?",
      "assign_role = ?",
      "assign_role_id = ?",
      "password = ?",
      "fax = ?",
      "emp_image = ?",
      "emp_add_prof = ?",
      "emp_id_prof = ?",
      "status = ?",
    ];

    const updateValues = [
      pan_card || oldData.pan_card,
      aadhar_card || oldData.aadhar_card,
      emp_name || oldData.emp_name,
      mobile_no || oldData.mobile_no,
      Alternate_Mobile || oldData.Alternate_Mobile,
      email || oldData.email,
      corresponding_address || oldData.corresponding_address,
      permanent_address || oldData.permanent_address,
      branch || oldData.branch,
      joining_date || oldData.joining_date,
      designation || oldData.designation,
      date_of_birth || oldData.date_of_birth,
      assign_role || oldData.assign_role,
      assign_role || oldData.assign_role_id,
      password || oldData.password,
      fax || oldData.fax,
      emp_image,
      emp_add_prof,
      emp_id_prof,
      status !== undefined ? status : oldData.status,
      id,
    ];

    // 5️⃣ Execute SQL UPDATE
    const updateQuery = `
      UPDATE employee 
      SET ${updateFields.join(", ")} 
      WHERE id = ?
    `;
    await db.query(updateQuery, updateValues);

    // 6️⃣ Return encrypted response
    const responsePayload = {
      message: "✅ Employee updated successfully",
      id,
      updatedDocuments: {
        emp_image,
        emp_add_prof,
        emp_id_prof,
      },
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateEmployeeStatus = async (req, res) => {
  try {
    // 🔐 Decrypt incoming data if needed
    const encryptedPayload = req.body.data;
    const decrypted = decryptData(encryptedPayload); // returns a string
    console.log("🟢 Decrypted string:", decrypted);

    // Handle double-string case safely
    let decryptedPayload;
    try {
      decryptedPayload = JSON.parse(decrypted);
      // If it's still a string after parsing, parse again
      if (typeof decryptedPayload === "string") {
        decryptedPayload = JSON.parse(decryptedPayload);
      }
    } catch (err) {
      console.error("❌ JSON parse failed:", err);
      return res.status(400).json({ error: "Invalid decrypted JSON format" });
    }

    const { id, status } = decryptedPayload;

    if (!id || typeof status === "undefined") {
      return res.status(400).json({ success: false, message: "Missing id or status" });
    }

    // 🧠 Update status only
    await db.query("UPDATE employee SET status = ? WHERE id = ?", [status, id]);

    res.status(200).json({
      success: true,
      message: "Employee status updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating employee status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    if (!encryptedPayload) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const { id } = decryptedPayload;

    if (!id) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    // ✅ Check if employee exists
    const [check] = await db.query(`SELECT id FROM employee WHERE id = ?`, [id]);
    if (check.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // ✅ Delete employee
    const [result] = await db.query(`DELETE FROM employee WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No employee deleted" });
    }

    const responsePayload = {
      message: "🗑️ Employee deleted successfully",
      affectedRows: result.affectedRows,
    };
    res.json({ data: encryptData(JSON.stringify(responsePayload)) });
  } catch (err) {
    console.error("❌ Delete Employee Error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
};



exports.addChargeProfile = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    if (!encryptedPayload) {
      return res
        .status(400)
        .json({ error: encryptData("Missing encrypted data") });
    }

    const decryptedString = decryptData(encryptedPayload);
    console.log("🔓 Decrypted String:", decryptedString);

    let decryptedPayload;
    try {
      decryptedPayload = JSON.parse(decryptedString);
      if (typeof decryptedPayload === "string") {
        decryptedPayload = JSON.parse(decryptedPayload);
      }
    } catch (parseError) {
      throw new Error("Invalid JSON format after decryption");
    }

    console.log("🧩 Decrypted Payload:", decryptedPayload);

    const { code, description, amount, account, isActive, addedBy } =
      decryptedPayload;
    console.log("Extracted:", {
      code,
      description,
      amount,
      account,
      isActive,
      addedBy,
    });

    if (!code || !amount || !account) {
      throw new Error("Missing required fields: code, amount, or account");
    }

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS charge_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) NOT NULL,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        account VARCHAR(100) NOT NULL,
        isActive BOOLEAN DEFAULT FALSE,
        addedBy VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    const insertQuery = `
      INSERT INTO charge_profiles (code, description, amount, account, isActive, addedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    console.log("📝 Insert Values:", [
      code,
      description,
      amount,
      account,
      isActive,
      addedBy,
    ]);

    const [result] = await db.query(insertQuery, [
      code,
      description,
      amount,
      account,
      isActive,
      addedBy,
    ]);

    const responseData = {
      message: "Charge profile added successfully",
      id: result.insertId,
    };
    const encryptedResponse = encryptData(JSON.stringify(responseData));
    res.status(201).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error in addChargeProfile:", err);
    const encryptedError = encryptData(
      JSON.stringify({ message: "Internal server error", error: err.message })
    );
    res.status(500).json({ data: encryptedError });
  }
};


exports.getChargeProfiles = async (req, res) => {
  try {
    let id = null;

    // Step 1️⃣ — Decrypt if encrypted payload is provided
    if (req.body?.data) {
      const decryptedPayload = JSON.parse(decryptData(req.body.data));
      id = decryptedPayload.id;
    }

    // Step 2️⃣ — Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS charge_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) NOT NULL,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        account VARCHAR(100) NOT NULL,
        isActive BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Step 3️⃣ — Fetch data
    let query = "SELECT * FROM charge_profiles";
    const params = [];

    if (id) {
      query += " WHERE id = ?";
      params.push(id);
    }

    query += " ORDER BY createdAt DESC";

    const [results] = await db.query(query, params);

    // Step 4️⃣ — Encrypt response
    const encryptedResponse = encryptData(JSON.stringify({ data: results }));

    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error fetching data:", err.message);
    const encryptedError = encryptData(JSON.stringify({ message: "Error fetching data", error: err.message }));
    res.status(500).json({ data: encryptedError });
  }
};

exports.updateChargeProfile = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    if (!encryptedPayload) {
      return res
        .status(400)
        .json({ error: encryptData("Missing encrypted data") });
    }

    const decryptedString = decryptData(encryptedPayload);
    let payload;
    try {
      payload = JSON.parse(decryptedString);
      if (typeof payload === "string") payload = JSON.parse(payload);
    } catch {
      throw new Error("Invalid JSON format after decryption");
    }

    const { id, code, description, amount, account, isActive, addedBy } = payload;

    if (!id || !code || !amount || !account) {
      throw new Error("Missing required fields: id, code, amount, or account");
    }

    const updateQuery = `
      UPDATE charge_profiles
      SET code = ?, description = ?, amount = ?, account = ?, isActive = ?, addedBy = ?
      WHERE id = ?
    `;

    const [result] = await db.query(updateQuery, [
      code,
      description,
      amount,
      account,
      isActive,
      addedBy,
      id,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Charge profile not found");
    }

    const response = encryptData(JSON.stringify({ message: "Charge profile updated successfully" }));
    res.status(200).json({ data: response });

  } catch (err) {
    console.error("❌ Error in updateChargeProfile:", err.message);
    const encryptedError = encryptData(JSON.stringify({ message: "Error updating charge profile", error: err.message }));
    res.status(500).json({ data: encryptedError });
  }
};

// ✅ Change only status (isActive)
exports.changeChargeProfileStatus = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    if (!encryptedPayload) {
      return res.status(400).json({ error: encryptData("Missing encrypted data") });
    }

    const decryptedString = decryptData(encryptedPayload);
    let payload;
    try {
      payload = JSON.parse(decryptedString);
      if (typeof payload === "string") payload = JSON.parse(payload);
    } catch {
      throw new Error("Invalid JSON format after decryption");
    }

    const { id, isActive } = payload;

    if (typeof id === "undefined" || typeof isActive === "undefined") {
      throw new Error("Missing required fields: id or isActive");
    }

    const updateQuery = `UPDATE charge_profiles SET isActive = ? WHERE id = ?`;
    const [result] = await db.query(updateQuery, [isActive, id]);

    if (result.affectedRows === 0) {
      throw new Error("Charge profile not found");
    }

    const response = encryptData(JSON.stringify({ message: "Status updated successfully" }));
    res.status(200).json({ data: response });

  } catch (err) {
    console.error("❌ Error in changeChargeProfileStatus:", err.message);
    const encryptedError = encryptData(JSON.stringify({ message: "Error updating status", error: err.message }));
    res.status(500).json({ data: encryptedError });
  }
};


exports.updateAssignBranch = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    if (!encryptedPayload) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const { id, branches } = decryptedPayload; // branches should be an array

    if (!id || !Array.isArray(branches) || branches.length === 0) {
      return res.status(400).json({
        error: "Employee ID and a non-empty branches array are required",
      });
    }

    // ✅ Check if employee exists
    const [employee] = await db.query("SELECT id FROM employee WHERE id = ?", [
      id,
    ]);
    if (employee.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // ✅ Example branches: [{ branch_id, branch_name }, ...]
    const branchData = JSON.stringify(branches);

    // ✅ Update assign_branch JSON field
    await db.query(`UPDATE employee SET assign_branch = ? WHERE id = ?`, [
      branchData,
      id,
    ]);

    const responsePayload = {
      message: "✅ Branches assigned successfully",
      id,
      assign_branch: branches,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error updating assigned branches:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

exports.getAssignBranch = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    const [rows] = await db.query(
      `SELECT id, emp_name, assign_branch FROM employee WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Parse JSON safely
    const branchData = rows[0].assign_branch
      ? JSON.parse(rows[0].assign_branch)
      : [];

    const responsePayload = {
      message: "✅ Fetched assigned branches successfully",
      id: rows[0].id,
      emp_name: rows[0].emp_name,
      assign_branch: branchData,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error fetching assigned branches:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

exports.getMemberLoginPeriod = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Total count
    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM employee");

    // ✅ Get paginated rows
    const [rows] = await db.query(
      `SELECT id, emp_name, email, start_time, end_time, ip_address
       FROM employee
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // ✅ Always encrypt a STRING, not an object
    const encryptedResponse = encryptData(
      JSON.stringify({
        members: rows,
        total,
        page,
        limit,
      })
    );

    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error fetching Member Login Period:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateMemberLoginPeriod = async (req, res) => {
  try {
    console.log("📥 Received request body:", req.body);

    const encryptedPayload = req.body.data;

    if (!encryptedPayload) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    // 🔓 Decrypt the payload
    const decryptedString = decryptData(encryptedPayload);
    console.log("🔓 Decrypted String:", decryptedString);

    let decryptedPayload;
    try {
      decryptedPayload = JSON.parse(decryptedString);
      // Handle double JSON stringification if needed
      if (typeof decryptedPayload === 'string') {
        decryptedPayload = JSON.parse(decryptedPayload);
      }
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError);
      return res.status(400).json({ error: "Invalid JSON format after decryption" });
    }

    console.log("🧩 Decrypted Payload:", decryptedPayload);

    const { id, start_time, end_time } = decryptedPayload; // Removed ip_address

    if (!id) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    // 🧠 Check if employee exists
    const [employee] = await db.query("SELECT id, emp_name FROM employee WHERE id = ?", [id]);
    if (employee.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    console.log("👤 Employee Found:", employee[0].emp_name);

    // 🧱 Build update query - ONLY TIME FIELDS
    const updates = [];
    const values = [];

    // Handle start_time
    if (start_time !== undefined && start_time !== null && start_time !== "") {
      updates.push("start_time = ?");
      values.push(start_time);
      console.log("⏰ Start Time to update:", start_time);
    } else {
      updates.push("start_time = NULL");
      console.log("⏰ Start Time set to NULL");
    }

    // Handle end_time
    if (end_time !== undefined && end_time !== null && end_time !== "") {
      updates.push("end_time = ?");
      values.push(end_time);
      console.log("⏰ End Time to update:", end_time);
    } else {
      updates.push("end_time = NULL");
      console.log("⏰ End Time set to NULL");
    }

    // Note: ip_address is completely excluded from updates

    if (updates.length === 0) {
      return res.status(400).json({ error: "No time fields provided for update" });
    }

    // ⚡ Update query - ONLY time fields
    const query = `UPDATE employee SET ${updates.join(", ")} WHERE id = ?`;
    values.push(id);

    console.log("📝 Final Query:", query);
    console.log("📝 Query Values:", values);

    // Execute the update
    const [result] = await db.query(query, values);
    console.log("✅ Database Update - Affected Rows:", result.affectedRows);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No records were updated" });
    }

    // 🔐 Encrypt success response
    const responsePayload = {
      success: true,
      message: "Member Login Time updated successfully",
      id: parseInt(id),
      employee_name: employee[0].emp_name,
      affectedRows: result.affectedRows,
      updated_time_fields: {
        start_time: start_time || null,
        end_time: end_time || null
      },
      // Note: ip_address is not included in response
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));

    console.log("✅ Update completed successfully");
    res.status(200).json({
      success: true,
      data: encryptedResponse
    });

  } catch (err) {
    console.error("❌ Error updating Member Login Time:", err);

    // 🔐 Encrypt error response
    const errorPayload = {
      success: false,
      error: "Server error",
      message: err.message
    };

    const encryptedError = encryptData(JSON.stringify(errorPayload));

    res.status(500).json({
      success: false,
      data: encryptedError
    });
  }
};

//=================  Assign/Update Branch ===================================
exports.updateAssignBranch = async (req, res) => {
  try {
    const encryptedPayload = req.body.data;
    if (!encryptedPayload) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));
    const { id, branches } = decryptedPayload; // branches should be an array

    if (!id || !Array.isArray(branches) || branches.length === 0) {
      return res.status(400).json({
        error: "Employee ID and a non-empty branches array are required",
      });
    }

    // ✅ Check if employee exists
    const [employee] = await db.query("SELECT id FROM employee WHERE id = ?", [id]);
    if (employee.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // ✅ Example branches: [{ branch_id, branch_name }, ...]
    const branchData = JSON.stringify(branches);

    // ✅ Update assign_branch JSON field
    await db.query(`UPDATE employee SET assign_branch = ? WHERE id = ?`, [
      branchData,
      id,
    ]);

    const responsePayload = {
      message: "✅ Branches assigned successfully",
      id,
      assign_branch: branches,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error updating assigned branches:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

exports.getAssignBranch = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    const [rows] = await db.query(
      `SELECT id, emp_name, assign_branch FROM employee WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Parse JSON safely
    const branchData = rows[0].assign_branch
      ? JSON.parse(rows[0].assign_branch)
      : [];

    const responsePayload = {
      message: "✅ Fetched assigned branches successfully",
      id: rows[0].id,
      emp_name: rows[0].emp_name,
      assign_branch: branchData,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Error fetching assigned branches:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
};



// ============= User Roles ===================================


// 🟩 CREATE ROLE
exports.createRoles = async (req, res) => {
  try {
    // 🔐 Step 1: Decrypt incoming payload
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const { role_name, system_name, is_system_role, is_active } = decryptedPayload;

    // ✅ Step 2: Validate required fields
    if (!role_name || !system_name) {
      return res.status(400).json({ error: "Role name and system name are required." });
    }

    // ✅ Step 3: Ensure table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(100) NOT NULL,
        system_name VARCHAR(100) NOT NULL,
        is_system_role BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createTableQuery);

    // ✅ Step 4: Insert new role
    const insertQuery = `
      INSERT INTO roles (role_name, system_name, is_system_role, is_active)
      VALUES (?, ?, ?, ?)
    `;
    const values = [role_name, system_name, is_system_role || 0, is_active || 1];

    const [result] = await db.query(insertQuery, values);

    // 🔒 Step 5: Encrypt response
    const responsePayload = {
      message: "✅ Role added successfully",
      role_id: result.insertId,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });

  } catch (err) {
    console.error("Add Role Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// 🟨 UPDATE ROLE
exports.updateRole = async (req, res) => {
  try {
    // 🔐 Step 1: Decrypt incoming payload
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const { id, role_name, system_name, is_system_role, is_active } = decryptedPayload;

    // ✅ Step 2: Validate required fields
    if (!id) {
      return res.status(400).json({ error: "Role ID is required." });
    }

    // ✅ Step 3: Check if the role exists
    const [existingRole] = await db.query(`SELECT * FROM roles WHERE id = ?`, [id]);
    if (existingRole.length === 0) {
      return res.status(404).json({ error: "Role not found." });
    }

    // ✅ Step 4: Build dynamic update query
    const fieldsToUpdate = [];
    const values = [];

    if (role_name !== undefined) {
      fieldsToUpdate.push("role_name = ?");
      values.push(role_name);
    }
    if (system_name !== undefined) {
      fieldsToUpdate.push("system_name = ?");
      values.push(system_name);
    }
    if (is_system_role !== undefined) {
      fieldsToUpdate.push("is_system_role = ?");
      values.push(is_system_role);
    }
    if (is_active !== undefined) {
      fieldsToUpdate.push("is_active = ?");
      values.push(is_active);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: "No fields provided to update." });
    }

    const updateQuery = `
      UPDATE roles 
      SET ${fieldsToUpdate.join(", ")} 
      WHERE id = ?
    `;
    values.push(id);

    await db.query(updateQuery, values);

    // 🔒 Step 5: Encrypt response
    const responsePayload = {
      message: "✅ Role updated successfully",
      role_id: id,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });

  } catch (err) {
    console.error("Update Role Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// 🟦 GET ALL ROLES (with Pagination)
exports.getAllRoles = async (req, res) => {
  try {
    // ✅ Step 1: Ensure roles table exists
    const createRolesTableQuery = `
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(100) NOT NULL,
        system_name VARCHAR(100) NOT NULL,
        is_system_role BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createRolesTableQuery);

    // ✅ Step 2: Ensure user_permissions table exists
    const createUserPermissionsTableQuery = `
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      );
    `;
    await db.query(createUserPermissionsTableQuery);

    // 📦 Step 3: Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // ✅ Step 4: Fetch roles with pagination
    const [roles] = await db.query(
      `SELECT * FROM roles ORDER BY id DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // ✅ Step 5: Attach permissions (parsed JSON) for each role
    for (const role of roles) {
      const [permResult] = await db.query(
        `SELECT permissions FROM user_permissions WHERE role_id = ?`,
        [role.id]
      );

      if (permResult.length > 0 && permResult[0].permissions) {
        try {
          // Parse the JSON string if needed
          const parsed =
            typeof permResult[0].permissions === "string"
              ? JSON.parse(permResult[0].permissions)
              : permResult[0].permissions;

          role.permissions = parsed;
        } catch (error) {
          console.error(`⚠️ Invalid JSON for role_id ${role.id}:`, error);
          role.permissions = {};
        }
      } else {
        role.permissions = {};
      }
    }

    // ✅ Step 6: Get total count
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM roles`);

    // 🔒 Step 7: Encrypt response
    const responsePayload = {
      message: roles.length > 0 ? "✅ Roles fetched successfully" : "ℹ️ No roles found",
      total,
      page,
      limit,
      roles,
    };

    const encryptedResponse = encryptData(JSON.stringify(responsePayload));
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("❌ Get All Roles Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getRolesForSelect = async (req, res) => {
  try {
    // ✅ Ensure roles table exists
    const createRolesTableQuery = `
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(100) NOT NULL,
        system_name VARCHAR(100) NOT NULL,
        is_system_role BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createRolesTableQuery);

    // ✅ Fetch all active roles
    const [roles] = await db.query(
      `SELECT id, role_name, system_name FROM roles WHERE is_active = 1 ORDER BY id DESC`
    );

    // ✅ Send plain response
    res.status(200).json({
      message:
        roles.length > 0 ? "✅ Roles fetched successfully" : "ℹ️ No roles found",
      roles,
    });
  } catch (err) {
    console.error("❌ Get Roles Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.saveRolePermissions = async (req, res) => {
  try {
    // 🧩 Step 1: Create table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permissions JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    // 🧩 Step 2: Extract data
    const { role_id, permissions } = req.body;
    if (!role_id || !permissions) {
      return res.status(400).json({ message: "role_id and permissions are required." });
    }

    const permissionsJson = JSON.stringify(permissions);

    // 🧩 Step 3: Check if role exists
    const [existing] = await db.query(
      `SELECT * FROM user_permissions WHERE role_id = ?`,
      [role_id]
    );

    if (existing.length > 0) {
      // Update existing record
      await db.query(
        `UPDATE user_permissions SET permissions = ? WHERE role_id = ?`,
        [permissionsJson, role_id]
      );
      // return res.status(200).json({ message: "Permissions updated successfully." });
      return res.status(200).json({
        success: true,
        message: "Permissions updated successfully.",
      });
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO user_permissions (role_id, permissions) VALUES (?, ?)`,
        [role_id, permissionsJson]
      );
      return res.status(201).json({
        success: true,
        message: "Permissions saved successfully.",
      });
    }
  } catch (error) {
    console.error("Error saving permissions:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};


exports.getRolePermissions = async (req, res) => {
  try {
    // Ensure table exists before query
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permissions JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const { role_id } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM user_permissions WHERE role_id = ?`,
      [role_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No permissions found for this role." });
    }

    const data = rows[0];
    data.permissions = JSON.parse(data.permissions);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};



