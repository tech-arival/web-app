const pool = require('../config/db');

exports.handleLocation = async (countryName, regionName) => {
    // Handle country
    countryName = countryName?.trim() || 'Unknown';
    let [country] = await pool.query(`SELECT id FROM countries WHERE name = ?`, [countryName]);
    if (country.length === 0) {
        [country] = await pool.query(`INSERT INTO countries (name) VALUES (?)`, [countryName]);
    }
    const countryId = country.insertId || country[0].id;

    // Handle region
    regionName = regionName?.trim() || 'Unknown';
    let [region] = await pool.query(`SELECT id FROM regions WHERE name = ? AND country_id = ?`, [regionName, countryId]);
    if (region.length === 0) {
        [region] = await pool.query(`INSERT INTO regions (name, country_id) VALUES (?, ?)`, [regionName, countryId]);
    }
    const regionId = region.insertId || region[0].id;

    return { countryId, regionId };
};