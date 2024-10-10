const pool = require('../config/db');

exports.handleRoomType = async (hotelId, roomType) => {
    // Check if room type already exists
    const [existingRoomType] = await pool.query(
        `SELECT id FROM room_types WHERE hotel_id = ? AND name = ?`,
        [hotelId, roomType]
    );

    if (existingRoomType.length > 0) {
        return existingRoomType[0].id;
    } else {
        const [roomTypeResult] = await pool.query(
            `INSERT INTO room_types (hotel_id, name) VALUES (?, ?)`,
            [hotelId, roomType]
        );
        return roomTypeResult.insertId;
    }
};