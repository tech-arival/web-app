const pool = require('../config/db');

exports.generateBookingId = () => {
    return `GEN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
};

exports.cleanGrossAmount = (grossAmountStr) => {
    let cleanedGrossAmount = grossAmountStr.replace(/[^\d.-]/g, '');
    cleanedGrossAmount = cleanedGrossAmount.replace(/^-?0+(?=\d)/, '');
    let grossAmount = !isNaN(parseFloat(cleanedGrossAmount)) ? parseFloat(cleanedGrossAmount) : 0;

    // Handle negative zero case
    if (grossAmount === 0 && grossAmountStr.includes('-')) {
        grossAmount = -0;
    }

    return grossAmount;
};

exports.insertBooking = async (bookingData) => {
    return await pool.query(
        `INSERT INTO bookings (
            hotel_id, room_type_id, channel_id, channel_booking_id, booked_on,
            arrival_date, departure_date, cancellation_no_show_date, guest_count, 
            rate_plan_id, gross_amount, status_id, country_id, region_id, 
            traveller_id, json_data
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            booked_on = VALUES(booked_on), 
            arrival_date = VALUES(arrival_date), 
            departure_date = VALUES(departure_date),
            cancellation_no_show_date = VALUES(cancellation_no_show_date), 
            guest_count = VALUES(guest_count),
            rate_plan_id = VALUES(rate_plan_id), 
            gross_amount = VALUES(gross_amount), 
            status_id = VALUES(status_id),
            country_id = VALUES(country_id), 
            region_id = VALUES(region_id), 
            traveller_id = VALUES(traveller_id),
            json_data = VALUES(json_data)`,
        [
            bookingData.hotelId, bookingData.roomTypeId, bookingData.channelId, 
            bookingData.bookingId, bookingData.bookingDate, bookingData.arrivalDate, 
            bookingData.departureDate, bookingData.cancellationDate,
            bookingData.guestCount, bookingData.ratePlanId, bookingData.grossAmount, 
            bookingData.statusId, bookingData.countryId, bookingData.regionId, 
            bookingData.travellerId, JSON.stringify(bookingData.jsonData)
        ]
    );
};