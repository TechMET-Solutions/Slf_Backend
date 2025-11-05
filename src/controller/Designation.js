const db = require("../../config/database");

// 🟩 CREATE DESIGNATION
exports.createDesignation = async (req, res) => {
  try {
    const { designation } = req.body;

    // ✅ Step 1: Validate required fields
    if (!designation || designation.trim() === "") {
      return res.status(400).json({ error: "Designation name is required." });
    }

    // ✅ Step 2: Ensure table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Designation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        designation VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createTableQuery);

    // ✅ Step 3: Insert new designation
    const insertQuery = `INSERT INTO Designation (designation) VALUES (?)`;
    const [result] = await db.query(insertQuery, [designation]);

    // ✅ Step 4: Send response
    res.status(201).json({
      message: "✅ Designation added successfully",
      designation_id: result.insertId,
    });
  } catch (err) {
    console.error("Add Designation Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟨 UPDATE DESIGNATION
exports.updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const { designation } = req.body;

    if (!id || !designation || designation.trim() === "") {
      return res.status(400).json({ error: "ID and designation are required." });
    }

    const [result] = await db.query(
      "UPDATE Designation SET designation = ? WHERE id = ?",
      [designation, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Designation not found." });
    }

    res.status(200).json({ message: "✅ Designation updated successfully." });
  } catch (err) {
    console.error("Update Designation Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟦 GET ALL DESIGNATIONS (with Pagination)
exports.getDesignation = async (req, res) => {
  try {
    // ✅ Ensure table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Designation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        designation VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createTableQuery);

    // 📦 Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 🧾 Fetch data with pagination
    const [rows] = await db.query(
      "SELECT * FROM Designation ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    // 🔢 Get total count
    const [countResult] = await db.query("SELECT COUNT(*) AS total FROM Designation");
    const total = countResult[0].total;

    res.status(200).json({
      current_page: page,
      total_pages: Math.ceil(total / limit),
      total_records: total,
      data: rows,
    });
  } catch (err) {
    console.error("Get Designations Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟥 DELETE DESIGNATION
exports.deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Designation ID is required." });
    }

    const [result] = await db.query("DELETE FROM Designation WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Designation not found." });
    }

    res.status(200).json({ message: "🗑️ Designation deleted successfully." });
  } catch (err) {
    console.error("Delete Designation Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
