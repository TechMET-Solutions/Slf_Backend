const db = require("../../config/database");
const { encryptData, decryptData } = require("../Helpers/cryptoHelper");

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
    const [rows] = await db.query(
      "SELECT * FROM branch_details ORDER BY id DESC"
    );

    // 🔒 Encrypt response
    const encryptedResponse = encryptData(JSON.stringify(rows));
    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error fetching branches:", error);
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

exports.AddItemProfileList = async (req, res) => {
  try {
    // 🔹 Decrypt incoming payload
    const encryptedPayload = req.body.data;
    const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

    const { code, name, added_by, add_on, modified_by, modified_on, status } =
      decryptedPayload;

    // ✅ Validate mandatory fields
    if (!code || !name) {
      return res.status(400).json({ message: "Code and Name are required" });
    }

    // ✅ Ensure table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS item_profile_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        added_by VARCHAR(100),
        add_on DATETIME,
        modified_by VARCHAR(100),
        modified_on DATETIME,
        status BOOLEAN DEFAULT 1
      )
    `;
    await db.query(createTableQuery);

    // ✅ Insert new item (if no status provided → default true)
    const insertQuery = `
      INSERT INTO item_profile_list (code, name, added_by, add_on, modified_by, modified_on, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insertQuery, [
      code,
      name,
      added_by || null,
      add_on || null,
      modified_by || null,
      modified_on || null,
      status !== undefined ? status : 1, // 👈 default true if not provided
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
      added_by,
      add_on,
      modified_by,
      modified_on,
      status,
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
    const selectQuery = `SELECT * FROM item_profile_list ORDER BY id DESC`;
    const [rows] = await db.query(selectQuery);

    const encryptedResponse = encryptData(JSON.stringify(rows));
    res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("❌ Error fetching items:", error);
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
