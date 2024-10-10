const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../config/db');
// Import utility functions
const { convertToMySQLDate } = require('../utils/dateUtils');
const { convertSettlToWandr, correctSpelling } = require('../utils/hotelUtils');
const { mapStatus } = require('../utils/statusUtils');
const { mapChannel } = require('../utils/channelUtils');
const { handleTraveler } = require('../utils/travelerUtils');
const { handleLocation } = require('../utils/locationUtils');
const { handleRatePlan } = require('../utils/ratePlanUtils');
const { handleRoomType } = require('../utils/roomUtils');
const { generateBookingId, cleanGrossAmount, insertBooking } = require('../utils/bookingUtils');

exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const results = [];
        let processedRows = 0;
        let skippedRows = 0;

        // Read CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv({
                    mapHeaders: ({ header }) => header.toLowerCase().replace(/\W+/g, '_').trim()
                }))
                .on('data', (row) => results.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        try {
            await pool.query('START TRANSACTION');
            
            for (const row of results) {
                try {
                    const bookingData = await processBookingRow(row);
                    if (bookingData) {
                        await insertBooking(bookingData);
                        processedRows++;
                    } else {
                        skippedRows++;
                    }
                } catch (rowError) {
                    console.error(`Error processing row:`, rowError);
                    skippedRows++;
                }
            }

            await pool.query('COMMIT');
            res.status(200).json({ 
                success: true, 
                message: 'File processed successfully!', 
                processedRowsCount: processedRows,
                skippedRowsCount: skippedRows
            });
        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete the uploaded file:', err);
        });
    }
};

async function processBookingRow(row) {
    // Extract booking details
    let bookingId = row['booking_id_zuzu_id'] || row['stlmbr100011808'] || 
                    row['reservation_number'] || row['channel_booking_id'] || '';
    
    let name = row['name'] || row['traveller_name'] || '';
    const email = row['traveller_email'] || row['email'] || '';
    const phone = row['contact_number'] || row['phone_number'] || row['mobile'] || '';
    
    const arrivalDateRaw = row['move_in_date'] || row['arrival_date'] || '';
    const departureDateRaw = row['move_out_date'] || row['departure_date'] || '';
    const cancellationDateRaw = row['cancellation_no_show_date'] || row['cancellation_date'] || '';
    let bookingDateRaw = row['reservation_date'] || row['booked_on'] || '';

    // Skip if essential data is missing
    if (!bookingId && (!arrivalDateRaw || !departureDateRaw) && !bookingDateRaw) {
        console.warn(`Skipping row due to missing essential data`);
        return null;
    }

    // Generate booking ID if missing
    if (!bookingId) {
        bookingId = generateBookingId();
    }

    // Handle dates
    if (!bookingDateRaw && arrivalDateRaw) {
        bookingDateRaw = arrivalDateRaw;
    }
    
    const bookingDate = convertToMySQLDate(bookingDateRaw);
    const arrivalDate = arrivalDateRaw ? convertToMySQLDate(arrivalDateRaw) : bookingDate;
    
    let departureDate;
    if (!departureDateRaw) {
        const tomorrow = new Date(arrivalDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        departureDate = tomorrow.toISOString().split('T')[0];
    } else {
        departureDate = convertToMySQLDate(departureDateRaw);
    }
    
    const cancellationDate = cancellationDateRaw ? convertToMySQLDate(cancellationDateRaw) : null;

    // Handle name
    if (!name && email) name = email;

    // Process traveler
    const travellerId = await handleTraveler(name, email, phone, row);

    // Process hotel
    let hotelName = row['property_name'] || row['property'] || 'Unknown';
    hotelName = correctSpelling(hotelName);
    hotelName = convertSettlToWandr(hotelName);

    const [existingHotel] = await pool.query(
        `SELECT id FROM hotels WHERE name = ?`,
        [hotelName]
    );

    let hotelId;
    if (existingHotel.length > 0) {
        hotelId = existingHotel[0].id;
    } else {
        const [hotelResult] = await pool.query(
            `INSERT INTO hotels (name, inventory_count)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE 
            inventory_count = inventory_count + 1`,
            [hotelName, 1]
        );
        hotelId = hotelResult.insertId;
    }

    // Process room type
    const roomType = row['room_no'] || row['room_type'] || '';
    const roomTypeId = await handleRoomType(hotelId, roomType);

    // Process channel
    const channelName = mapChannel(row['booking_source'] || row['channel'] || row['source'] || '');
    const [existingChannel] = await pool.query(
        `SELECT id FROM channels WHERE name = ?`,
        [channelName]
    );

    let channelId;
    if (existingChannel.length > 0) {
        channelId = existingChannel[0].id;
    } else {
        const [channelResult] = await pool.query(
            `INSERT INTO channels (name) VALUES (?)`,
            [channelName]
        );
        channelId = channelResult.insertId;
    }

    // Process location
    const { countryId, regionId } = await handleLocation(row['country'], row['region']);

    // Process rate plan
    const ratePlanId = await handleRatePlan(row['rate_plan']);

    // Process status
    const bookingStatus = mapStatus(row['booking_status'] || row['booking_status_no_show_ota_team'] || '');
    const [existingStatus] = await pool.query(
        `SELECT id FROM statuses WHERE name = ?`,
        [bookingStatus]
    );

    let statusId;
    if (existingStatus.length > 0) {
        statusId = existingStatus[0].id;
    } else {
        const [statusResult] = await pool.query(
            `INSERT INTO statuses (name) VALUES (?)`,
            [bookingStatus]
        );
        statusId = statusResult.insertId;
    }

    // Process amount
    const grossAmountStr = row['gross_amount_paid_by_guest'] || row['gross_amount'] || 
                           row['grand_total'] || row["net_amount"] || '0';
    const grossAmount = cleanGrossAmount(grossAmountStr);

    // Return processed booking data
    return {
        hotelId,
        roomTypeId,
        channelId,
        bookingId,
        bookingDate,
        arrivalDate,
        departureDate,
        cancellationDate,
        guestCount: row['guest_count'] || row['adults'] || 1,
        ratePlanId,
        grossAmount,
        statusId,
        countryId,
        regionId,
        travellerId,
        jsonData: row
    };
}