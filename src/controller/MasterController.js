const db = require("../../config/database");
const { encryptData, decryptData } = require("../Helpers/cryptoHelper");
const path = require("path");
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

        const {
            code,
            name,
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
        (code, name, added_by, add_on, modified_by, modified_on, remark, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(insertQuery, [
            code,
            name,
            added_by || null,
            add_on || null,
            modified_by || "",
            modified_on || "",
            remark || null,
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
        const updateQuery = `UPDATE item_profile_list SET ${updateFields.join(", ")} WHERE id = ?`;
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
        const selectQuery = `
      SELECT id, code, name, added_by, add_on, modified_by, modified_on, remark, status 
      FROM item_profile_list 
      ORDER BY id DESC
    `;
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

        // ✅ Fetch all records
        const selectQuery = `
            SELECT id, push_date, gold_rate, added_on, added_by
            FROM gold_rate_list
            ORDER BY id DESC
        `;
        const [rows] = await db.query(selectQuery);

        // 🔒 Encrypt data before sending
        const encryptedResponse = encryptData(JSON.stringify(rows));
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
        const {
            purity_name,
            purity_percent,
            loan_type,
            added_by,
            status
        } = decryptedPayload;

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
        console.error('Add Product Purity Error:', err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 🟦 GET ALL PRODUCT PURITIES
exports.getAllProductPurities = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM product_purity ORDER BY id DESC");

        // Encrypt response
        res.status(200).json({ data: encryptData(JSON.stringify(rows)) });
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


        const {
            id,
            purity_name,
            purity_percent,
            loan_type,
            added_by,
            status
        } = decryptedPayload;

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
        const updateQuery = `UPDATE product_purity SET ${updateFields.join(", ")} WHERE id = ?`;
        await db.query(updateQuery, updateValues);

        const responsePayload = { message: "✅ Product Purity updated successfully", id };
        res.status(200).json({ data: responsePayload });
    } catch (err) {
        console.error('Update Product Purity Error:', err);
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
        const [check] = await db.query(`SELECT id FROM product_purity WHERE id = ?`, [id]);
        if (check.length === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        // Delete the record
        const [result] = await db.query(`DELETE FROM product_purity WHERE id = ?`, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No record deleted" });
        }

        const responsePayload = {
            message: "🗑️ Product Purity Deleted Successfully",
            affectedRows: result.affectedRows
        };
        res.json({ data: encryptData(JSON.stringify(responsePayload)) });

    } catch (err) {
        console.error('Delete Product Purity Error:', err);
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
            return res.status(400).json({ message: "Required fields missing: proof_type or proof_number" });
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
            dbStatus
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
// ✅ Get All Documents API
exports.getDocuments = async (req, res) => {
    try {
        // Optional: Pagination query params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // default 50
        const offset = (page - 1) * limit;

        // Optional: Sorting
        const sortBy = req.query.sortBy || 'id';
        const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

        // Fetch documents with optional pagination & sorting
        const query = `SELECT * FROM document_proofs ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
        const [rows] = await db.query(query, [limit, offset]);

        // Encrypt response
        const encryptedResponse = encryptData(JSON.stringify(rows));

        res.status(200).json({
            message: "✅ Documents fetched successfully",
            data: encryptedResponse,
            page,
            limit,
            total: rows.length
        });
    } catch (error) {
        console.error('❌ Error fetching documents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
        const [rows] = await db.query("SELECT * FROM area ORDER BY id DESC");

        // Encrypt response
        res.status(200).json({ data: encryptData(JSON.stringify(rows)) });
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
    const { id, area_locality, city, state, pincode, landmark } = decryptedPayload;

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


