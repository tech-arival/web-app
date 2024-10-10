const pool = require('../config/db');

exports.handleTraveler = async (name, email, phone, row) => {
    // Check if traveller already exists
    const [existingTraveller] = await pool.query(
        `SELECT id FROM travellers WHERE email = ? OR mobile = ?`,
        [email, phone]
    );

    let travellerId;
    if (existingTraveller.length > 0) {
        travellerId = existingTraveller[0].id;
    } else {
        const [travellerResult] = await pool.query(
            `INSERT INTO travellers (name, email, mobile, gender, dob, json_data)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             name = VALUES(name), gender = VALUES(gender), dob = VALUES(dob), json_data = VALUES(json_data)`,
            [name, email, phone, row['gender'], convertToMySQLDate(row['date_of_birth']?.trim() || ''), JSON.stringify(row)]
        );
        travellerId = travellerResult.insertId;
    }
    
    return travellerId;
};