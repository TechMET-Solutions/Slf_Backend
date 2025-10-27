const db = require("../../config/database");

// ✅ Add new scheme with auto table creation
exports.addSchemeDetails = async (req, res) => {
    try {
        const { formData, interestRates } = req.body;

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scheme_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schemeName VARCHAR(100),
        description TEXT,
        product VARCHAR(50),
        applicableFrom DATE,
        applicableTo DATE,
        calcBasisOn VARCHAR(20),
        calcMethod VARCHAR(50),
        paymentFrequency VARCHAR(50),
        interestInAdvance VARCHAR(10),
        preCloserMinDays INT,
        penaltyType VARCHAR(20),
        addOneDay VARCHAR(5),
        penalty DECIMAL(10,2),
        minLoanAmount DECIMAL(15,2),
        loanPeriod INT,
        paymentBasisOn VARCHAR(50),
        goldApprovePercent DECIMAL(5,2),
        maxLoanAmount DECIMAL(15,2),
        partyType VARCHAR(20),
        administrativeCharges DECIMAL(15,2),
        interestType VARCHAR(20),
        docChargePercent DECIMAL(5,2),
        docChargeMin DECIMAL(15,2),
        docChargeMax DECIMAL(15,2),
        interestRates JSON,
         roles JSON,
        status TINYINT(1) DEFAULT 0, -- 1 = active, 0 = inactive,
         renewedBy VARCHAR(100) DEFAULT NULL,
         renewedOn DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await db.query(createTableQuery);
        console.log("✅ Table verified or created successfully!");

        // 🟢 2️⃣ Convert interestRates array → JSON string
        const interestRatesJSON = JSON.stringify(interestRates || []);

        // 🟢 3️⃣ Insert data into table
        const [result] = await db.query(
            `INSERT INTO scheme_details (
        schemeName, description, product, applicableFrom, applicableTo, calcBasisOn, calcMethod,
        paymentFrequency, interestInAdvance, preCloserMinDays, penaltyType, addOneDay,
        penalty, minLoanAmount, loanPeriod, paymentBasisOn, goldApprovePercent,
        maxLoanAmount, partyType, administrativeCharges, interestType,
        docChargePercent, docChargeMin, docChargeMax, interestRates
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                formData.schemeName,
                formData.description,
                formData.product,
                formData.applicableFrom,
                formData.applicableTo,
                formData.calcBasisOn,
                formData.calcMethod,
                formData.paymentFrequency,
                formData.interestInAdvance,
                formData.preCloserMinDays,
                formData.penaltyType,
                formData.addOneDay,
                formData.penalty,
                formData.minLoanAmount,
                formData.loanPeriod,
                formData.paymentBasisOn,
                formData.goldApprovePercent,
                formData.maxLoanAmount,
                formData.partyType,
                formData.administrativeCharges,
                formData.interestType,
                formData.docChargePercent,
                formData.docChargeMin,
                formData.docChargeMax,
                interestRatesJSON,
            ]
        );

        // 🟢 4️⃣ Send success response
        res.status(201).json({
            message: "✅ Scheme saved successfully!",
            id: result.insertId,
        });
    } catch (err) {
        console.error("❌ Error saving scheme:", err);
        res.status(500).json({ error: "Server error while saving scheme" });
    }
};

exports.getAllSchemes = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM scheme_details");

        // 🗓️ Get today's date (YYYY-MM-DD)
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const formatted = rows
            .map((r) => ({
                ...r,
                interestRates: r.interestRates ? JSON.parse(r.interestRates) : [],
                intCompound: r.calcMethod === "compound",
            }))
            .filter((r) => {
                if (!r.applicableTo) return false;

                // Ensure we safely extract date part
                const appTo = new Date(r.applicableTo);
                const appToStr = `${appTo.getFullYear()}-${String(
                    appTo.getMonth() + 1
                ).padStart(2, "0")}-${String(appTo.getDate()).padStart(2, "0")}`;

                // ✅ Include if applicableTo is today or after today
                return appToStr >= todayStr;
            });

        res.json(formatted);
    } catch (err) {
        console.error("❌ Error fetching schemes:", err);
        res.status(500).json({ error: "Error fetching schemes" });
    }
};

exports.getExpiredSchemes = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM scheme_details");

        // 🗓️ Get today's date (YYYY-MM-DD)
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const expiredSchemes = rows
            .map((r) => ({
                ...r,
                interestRates: r.interestRates ? JSON.parse(r.interestRates) : [],
                intCompound: r.calcMethod === "compound",
            }))
            .filter((r) => {
                if (!r.applicableTo) return false;

                const appTo = new Date(r.applicableTo);
                const appToStr = `${appTo.getFullYear()}-${String(
                    appTo.getMonth() + 1
                ).padStart(2, "0")}-${String(appTo.getDate()).padStart(2, "0")}`;

                // ✅ Include only expired schemes (applicableTo < today)
                return appToStr < todayStr;
            });

        res.json(expiredSchemes);
    } catch (err) {
        console.error("❌ Error fetching expired schemes:", err);
        res.status(500).json({ error: "Error fetching expired schemes" });
    }
};


exports.updateSchemeDetails = async (req, res) => {
    try {
        const { id, formData, interestRates } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Scheme ID is required" });
        }

        const interestRatesJSON = JSON.stringify(interestRates || []);

        const updateQuery = `
            UPDATE scheme_details SET
                schemeName = ?,
                description = ?,
                product = ?,
                applicableFrom = ?,
                applicableTo = ?,
                calcBasisOn = ?,
                calcMethod = ?,
                paymentFrequency = ?,
                interestInAdvance = ?,
                preCloserMinDays = ?,
                penaltyType = ?,
                addOneDay = ?,
                penalty = ?,
                minLoanAmount = ?,
                loanPeriod = ?,
                paymentBasisOn = ?,
                goldApprovePercent = ?,
                maxLoanAmount = ?,
                partyType = ?,
                administrativeCharges = ?,
                interestType = ?,
                docChargePercent = ?,
                docChargeMin = ?,
                docChargeMax = ?,
                interestRates = ?
            WHERE id = ?
        `;

        const [result] = await db.query(updateQuery, [
            formData.schemeName,
            formData.description,
            formData.product,
            formData.applicableFrom,
            formData.applicableTo,
            formData.calcBasisOn,
            formData.calcMethod,
            formData.paymentFrequency,
            formData.interestInAdvance,
            formData.preCloserMinDays,
            formData.penaltyType,
            formData.addOneDay,
            formData.penalty,
            formData.minLoanAmount,
            formData.loanPeriod,
            formData.paymentBasisOn,
            formData.goldApprovePercent,
            formData.maxLoanAmount,
            formData.partyType,
            formData.administrativeCharges,
            formData.interestType,
            formData.docChargePercent,
            formData.docChargeMin,
            formData.docChargeMax,
            interestRatesJSON,
            id,
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Scheme not found" });
        }

        res.json({ message: "✅ Scheme updated successfully!" });
    } catch (err) {
        console.error("❌ Error updating scheme:", err);
        res.status(500).json({ error: "Server error while updating scheme" });
    }
};

exports.changeSchemeStatus = async (req, res) => {
    try {
        const { id, status } = req.body;

        if (!id || typeof status === "undefined") {
            return res.status(400).json({ error: "Scheme ID and status are required" });
        }

        const [result] = await db.query(
            "UPDATE scheme_details SET status = ? WHERE id = ?",
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Scheme not found" });
        }

        res.json({ message: `✅ Scheme status updated to ${status}` });
    } catch (err) {
        console.error("❌ Error changing scheme status:", err);
        res.status(500).json({ error: "Server error while changing status" });
    }
};

exports.updateSchemeRoles = async (req, res) => {
    try {
        const { id, roles } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Scheme ID is required" });
        }

        // Ensure roles is an array before saving
        const rolesJSON = JSON.stringify(roles || []);

        const [result] = await db.query(
            "UPDATE scheme_details SET roles = ? WHERE id = ?",
            [rolesJSON, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Scheme not found" });
        }

        res.json({ message: "✅ Roles updated successfully!" });
    } catch (err) {
        console.error("❌ Error updating roles:", err);
        res.status(500).json({ error: "Server error while updating roles" });
    }
};