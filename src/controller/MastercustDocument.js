const db = require("../../config/database");
const { encryptData, decryptData } = require("../Helpers/cryptoHelper");
const path = require("path");
const fs = require("fs");

exports.addCustomer = async (req, res) => {
    try {
        const encryptedPayload = req.body.data;
        const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

        if (!decryptedPayload) {
            return res.status(400).json({ message: "Invalid or missing encrypted data" });
        }

        const files = req.files;
        const panFile = files?.panFile ? path.basename(files.panFile[0].path) : null;
        const aadharFile = files?.aadharFile ? path.basename(files.aadharFile[0].path) : null;
        const profileImage = files?.profileImage ? path.basename(files.profileImage[0].path) : null;
        const signature = files?.signature ? path.basename(files.signature[0].path) : null;
        const doc1 = files?.Additional_UploadDocumentFile1
            ? path.basename(files.Additional_UploadDocumentFile1[0].path)
            : null;
        const doc2 = files?.Additional_UploadDocumentFile2
            ? path.basename(files.Additional_UploadDocumentFile2[0].path)
            : null;

        const customerData = {
            ...decryptedPayload,
            panFile,
            aadharFile,
            profileImage,
            signature,
            Additional_UploadDocumentFile1: doc1,
            Additional_UploadDocumentFile2: doc2,
            Added_On: new Date(), // current timestamp
            Added_By: decryptedPayload.Added_By || "", // blank for now
            Remark: decryptedPayload.Remark || "",
        };

        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        panNo VARCHAR(50),
        panFile VARCHAR(255),
        aadhar VARCHAR(50),
        aadharFile VARCHAR(255),
        printName VARCHAR(100),
        email VARCHAR(100),
        mobile VARCHAR(20),
        otp VARCHAR(10),
        altMobile VARCHAR(20),
        dob DATE,
        gender VARCHAR(10),
        marital VARCHAR(20),
        gstNo VARCHAR(50),
        religion VARCHAR(50),
        education VARCHAR(50),
        occupation VARCHAR(50),
        partyType VARCHAR(50),
        riskCategory VARCHAR(50),
        firstName VARCHAR(50),
        middleName VARCHAR(50),
        lastName VARCHAR(50),
        fatherFirstName VARCHAR(50),
        fatherMiddleName VARCHAR(50),
        fatherLastName VARCHAR(50),
        landline VARCHAR(20),
        pep VARCHAR(10),
        profileImage VARCHAR(255),
        signature VARCHAR(255),
        Permanent_Address VARCHAR(255),
        Permanent_Pincode VARCHAR(20),
        Permanent_State VARCHAR(50),
        Permanent_City VARCHAR(50),
        Permanent_Country VARCHAR(50),
        Permanent_ResiStatus VARCHAR(50),
        Permanent_Resisince VARCHAR(50),
        Permanent_Category VARCHAR(50),
        Permanent_CompanyType VARCHAR(50),
        Permanent_IndustryType VARCHAR(50),
        Permanent_Businessworkingsince VARCHAR(50),
        Corresponding_Address VARCHAR(255),
        Corresponding_Pincode VARCHAR(20),
        Corresponding_State VARCHAR(50),
        Corresponding_City VARCHAR(50),
        Corresponding_Country VARCHAR(50),
        Corresponding_Area VARCHAR(50),
        Additional_AddressProof VARCHAR(50),
        Additional_AnyDetails1 VARCHAR(255),
        Additional_IDProof VARCHAR(50),
        Additional_AnyDetails2 VARCHAR(255),
        Additional_Reference1 VARCHAR(50),
        Additional_Reference2 VARCHAR(50),
        Additional_UploadDocumentFile1 VARCHAR(255),
        Additional_UploadDocumentFile2 VARCHAR(255),
        Nominee_NomineeName VARCHAR(50),
        Nominee_Relation VARCHAR(50),
        Nominee_Address VARCHAR(255),
        Nominee_State VARCHAR(50),
        Nominee_City VARCHAR(50),
        access VARCHAR(10),
        block BOOLEAN DEFAULT FALSE,
        badDebtor BOOLEAN DEFAULT FALSE,
        Added_On DATETIME,
        Added_By VARCHAR(100),
        Remark VARCHAR(500),
        Updated_On VARCHAR(500),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await db.query(createTableSQL);

        const [result] = await db.query("INSERT INTO customers SET ?", customerData);

        res.status(201).json({
            statuscode: 200,
            status: true,
            message: "✅ Customer added successfully",
            customerId: result.insertId,
        });
    } catch (err) {
        console.error("❌ Server Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};



// exports.getCustomers = async (req, res) => {
//     try {
//         const customerBaseUrl = "http://localhost:5000/uploadDoc/customer_documents/";
//         const bankBaseUrl = "http://localhost:5000/uploadCheque/customer_BankData/";

//         // Step 1️⃣: Get all customers
//         const [customers] = await db.query("SELECT * FROM customers");

//         // Step 2️⃣: Get all bank details
//         const [bankDetails] = await db.query("SELECT * FROM bank_details");

//         // Helper function to extract only filename
//         const getFileName = (filePath) => {
//             if (!filePath) return null;
//             const parts = filePath.split(/[/\\]/);
//             return parts[parts.length - 1];
//         };

//         // Step 3️⃣: Map customers and attach formatted data
//         const formattedCustomers = customers.map((customer) => {
//             // Filter bank details for this customer
//             const customerBanks = bankDetails
//                 .filter((b) => b.customerId === customer.id)
//                 .map((b) => ({
//                     ...b,
//                     cancelCheque: b.cancelCheque
//                         ? bankBaseUrl + getFileName(b.cancelCheque)
//                         : null,
//                 }));

//             // Format document URLs for the customer
//             return {
//                 ...customer,
//                 panFile: customer.panFile ? customerBaseUrl + getFileName(customer.panFile) : null,
//                 aadharFile: customer.aadharFile ? customerBaseUrl + getFileName(customer.aadharFile) : null,
//                 profileImage: customer.profileImage ? customerBaseUrl + getFileName(customer.profileImage) : null,
//                 signature: customer.signature ? customerBaseUrl + getFileName(customer.signature) : null,
//                 Additional_UploadDocumentFile1: customer.Additional_UploadDocumentFile1
//                     ? customerBaseUrl + getFileName(customer.Additional_UploadDocumentFile1)
//                     : null,
//                 Additional_UploadDocumentFile2: customer.Additional_UploadDocumentFile2
//                     ? customerBaseUrl + getFileName(customer.Additional_UploadDocumentFile2)
//                     : null,
//                 bankData: customerBanks, // Add array of bank records
//             };
//         });

//         res.status(200).json(formattedCustomers);
//     } catch (err) {
//         console.error("❌ Database error:", err);
//         res.status(500).json({ message: "Database error", error: err.message });
//     }
// };


// Get customer list by search name
exports.getCustomers = async (req, res) => {
    try {
        const customerBaseUrl = "http://localhost:5000/uploadDoc/customer_documents/";
        const bankBaseUrl = "http://localhost:5000/uploadCheque/customer_BankData/";

        // 🔹 Get pagination parameters (default: page=1, limit=10)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Step 1️⃣: Get total count (for frontend pagination controls)
        const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM customers");

        // Step 2️⃣: Get customers for the current page
        const [customers] = await db.query("SELECT * FROM customers LIMIT ? OFFSET ?", [limit, offset]);

        // Step 3️⃣: Get all bank details once (optional optimization)
        const [bankDetails] = await db.query("SELECT * FROM bank_details");

        // Helper function to extract only filename
        const getFileName = (filePath) => {
            if (!filePath) return null;
            const parts = filePath.split(/[/\\]/);
            return parts[parts.length - 1];
        };

        // Step 4️⃣: Attach formatted bank & file URLs
        const formattedCustomers = customers.map((customer) => {
            const customerBanks = bankDetails
                .filter((b) => b.customerId === customer.id)
                .map((b) => ({
                    ...b,
                    cancelCheque: b.cancelCheque ? bankBaseUrl + getFileName(b.cancelCheque) : null,
                }));

            return {
                ...customer,
                panFile: customer.panFile ? customerBaseUrl + getFileName(customer.panFile) : null,
                aadharFile: customer.aadharFile ? customerBaseUrl + getFileName(customer.aadharFile) : null,
                profileImage: customer.profileImage ? customerBaseUrl + getFileName(customer.profileImage) : null,
                signature: customer.signature ? customerBaseUrl + getFileName(customer.signature) : null,
                Additional_UploadDocumentFile1: customer.Additional_UploadDocumentFile1
                    ? customerBaseUrl + getFileName(customer.Additional_UploadDocumentFile1)
                    : null,
                Additional_UploadDocumentFile2: customer.Additional_UploadDocumentFile2
                    ? customerBaseUrl + getFileName(customer.Additional_UploadDocumentFile2)
                    : null,
                bankData: customerBanks,
            };
        });

        // Step 5️⃣: Return with pagination info
        res.status(200).json({
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit,
            data: formattedCustomers,
        });

    } catch (err) {
        console.error("❌ Database error:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};





exports.searchCustomers = async (req, res) => {
    try {
        const { search } = req.query;

        const baseUrl = "http://localhost:5000/uploadDoc/customer_documents/";

        // ✅ If search term is missing or empty, return an empty array
        if (!search || search.trim() === "") {
            return res.status(200).json([]);
        }

        // ✅ Use case-insensitive matching (LOWER)
        const [rows] = await db.query(
            "SELECT * FROM customers WHERE LOWER(firstName) LIKE ?",
            [`%${search.toLowerCase()}%`]
        );

        // ✅ Format file URLs correctly
        const formattedRows = rows.map((customer) => {
            const getFileName = (filePath) => {
                if (!filePath) return null;
                const parts = filePath.split(/[/\\]/);
                return parts[parts.length - 1];
            };

            return {
                ...customer,
                panFile: customer.panFile ? baseUrl + getFileName(customer.panFile) : null,
                aadharFile: customer.aadharFile ? baseUrl + getFileName(customer.aadharFile) : null,
                profileImage: customer.profileImage ? baseUrl + getFileName(customer.profileImage) : null,
                signature: customer.signature ? baseUrl + getFileName(customer.signature) : null,
                Additional_UploadDocumentFile1: customer.Additional_UploadDocumentFile1
                    ? baseUrl + getFileName(customer.Additional_UploadDocumentFile1)
                    : null,
                Additional_UploadDocumentFile2: customer.Additional_UploadDocumentFile2
                    ? baseUrl + getFileName(customer.Additional_UploadDocumentFile2)
                    : null,
            };
        });

        res.status(200).json(formattedRows);
    } catch (err) {
        console.error("❌ Database error:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};


exports.updateCustomer = async (req, res) => {
    try {
        // 🧩 Step 1: Extract and decrypt data safely
        let decryptedPayload = {};

        if (req.body.data) {
            try {
                decryptedPayload = JSON.parse(decryptData(req.body.data));
            } catch (err) {
                return res.status(400).json({ status: false, message: "Invalid encrypted data" });
            }
        } else {
            decryptedPayload = req.body;
        }

        // 🧩 Step 2: Get customer id safely
        const customerId = decryptedPayload.id;
        if (!customerId) {
            return res.status(400).json({ status: false, message: "Customer ID is required" });
        }

        // 🧩 Step 3: Handle uploaded files (if any)
        const files = req.files || {};

        const panFile = files?.panFile ? path.basename(files.panFile[0].path) : null;
        const aadharFile = files?.aadharFile ? path.basename(files.aadharFile[0].path) : null;
        const profileImage = files?.profileImage ? path.basename(files.profileImage[0].path) : null;
        const signature = files?.signature ? path.basename(files.signature[0].path) : null;
        const doc1 = files?.Additional_UploadDocumentFile1
            ? path.basename(files.Additional_UploadDocumentFile1[0].path)
            : null;
        const doc2 = files?.Additional_UploadDocumentFile2
            ? path.basename(files.Additional_UploadDocumentFile2[0].path)
            : null;

        // 🧩 Step 4: Prepare fields for SQL
        const updateData = {
            ...decryptedPayload,
            ...(panFile && { panFile }),
            ...(aadharFile && { aadharFile }),
            ...(profileImage && { profileImage }),
            ...(signature && { signature }),
            ...(doc1 && { Additional_UploadDocumentFile1: doc1 }),
            ...(doc2 && { Additional_UploadDocumentFile2: doc2 }),
            Updated_On: new Date(),
        };

        delete updateData.id; // prevent overwriting ID

        // 🧩 Step 5: Create dynamic update query
        const fields = Object.keys(updateData)
            .map((key) => `${key} = ?`)
            .join(", ");
        const values = Object.values(updateData);
        values.push(customerId);

        const sql = `UPDATE customers SET ${fields} WHERE id = ?`;

        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: false,
                message: "Customer not found or no changes detected",
            });
        }

        res.status(200).json({
            status: true,
            statuscode: 200,
            message: "✅ Customer updated successfully",
        });
    } catch (err) {
        console.error("❌ Error updating customer:", err);
        res.status(500).json({
            status: false,
            message: "Server error while updating customer",
            error: err.message,
        });
    }
};

exports.blockUnblockCustomer = async (req, res) => {
    try {
        const { id, block } = req.body;

        if (id === undefined || block === undefined) {
            return res.status(400).json({ message: "Missing customer ID or block status" });
        }

        const [result] = await db.query(
            "UPDATE customers SET block = ? WHERE id = ?",
            [block, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        return res.status(200).json({
            message: block ? "Customer blocked successfully" : "Customer unblocked successfully",
        });
    } catch (error) {
        console.error("❌ Error updating block status:", error);
        res.status(500).json({ message: "Server error", error });
    }
};