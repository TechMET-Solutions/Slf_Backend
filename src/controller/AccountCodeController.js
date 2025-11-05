const db = require("../../config/database");

// GET ALL
exports.getAllAccounts = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM account_codes ORDER BY id DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

// CREATE
exports.createAccount = async (req, res) => {
    try {

        // 1st create table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS account_codes (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                financialDate VARCHAR(50) NOT NULL,
                accountGroup VARCHAR(100) NOT NULL,
                type VARCHAR(100) NOT NULL,
                addedBy VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // get data
        const { name, financialDate, accountGroup, type, addedBy } = req.body;

        // insert
        await db.query(
            `INSERT INTO account_codes (name,financialDate,accountGroup,type,addedBy) VALUES (?,?,?,?,?)`,
            [name, financialDate, accountGroup, type, addedBy]
        );

        res.json({ message: "Account created" });
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

// UPDATE
exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, financialDate, accountGroup, type } = req.body;

        await db.query(
            `UPDATE account_codes SET name=?, financialDate=?, accountGroup=?, type=? WHERE id=?`,
            [name, financialDate, accountGroup, type, id]
        );

        res.json({ message: "Account Updated" });
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

// DELETE
exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(`DELETE FROM account_codes WHERE id=?`, [id]);

        res.json({ message: "Account Deleted" });
    } catch (err) {
        res.status(500).json({ message: err });
    }
};
