const pool = require('../config/db');

exports.handleRatePlan = async (ratePlan) => {
    if (!ratePlan) return null;

    // Check if rate plan already exists
    const [existingRatePlan] = await pool.query(
        `SELECT id FROM rate_plans WHERE name = ?`,
        [ratePlan]
    );

    if (existingRatePlan.length > 0) {
        return existingRatePlan[0].id;
    } else {
        const [ratePlanResult] = await pool.query(
            `INSERT INTO rate_plans (name) VALUES (?)`,
            [ratePlan]
        );
        return ratePlanResult.insertId;
    }
};