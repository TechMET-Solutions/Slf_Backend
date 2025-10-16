const db = require("../../config/database");
const { encryptData, decryptData } = require("../Helpers/cryptoHelper");
const path = require("path");

// export.addCustomer = (req, res) => {
exports.addCustomer = async (req, res) => {
    try {
        const encryptedPayload = req.body.data;
        const decryptedPayload = JSON.parse(decryptData(encryptedPayload));

        if (!decryptedPayload) {
            return res.status(400).json({ message: "Invalid or missing encrypted data" });
        }


        const files = req.files;
        const panFile = files?.panFile ? files.panFile[0].path : null;
        const aadharFile = files?.aadharFile ? files.aadharFile[0].path : null;
        const profileImage = files?.profileImage ? files.profileImage[0].path : null;
        const signature = files?.signature ? files.signature[0].path : null;
        const doc1 = files?.Additional_UploadDocumentFile1 ? files.Additional_UploadDocumentFile1[0].path : null;
        const doc2 = files?.Additional_UploadDocumentFile2 ? files.Additional_UploadDocumentFile2[0].path : null;

        const customerData = {
            ...decryptedPayload,
            panFile,
            aadharFile,
            profileImage,
            signature,
            Additional_UploadDocumentFile1: doc1,
            Additional_UploadDocumentFile2: doc2,
        };

        // SQL to create table if it doesn't exist
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
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // Execute create table
        await db.query(createTableSQL);

        // Insert customer data
        const [result] = await db.query("INSERT INTO customers SET ?", customerData);

        res.status(201).json({
            message: "✅ Customer added successfully",
            customerId: result.insertId,
        });
    } catch (err) {
        console.error("❌ Server Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


exports.getCustomers = async (req, res) => {
    db.query("SELECT * FROM customers", (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.status(200).json(result);
    });
};
