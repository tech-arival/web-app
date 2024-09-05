const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../config/db');

// Helper function to convert date to MySQL format
function convertToMySQLDate(dateString) {
    // console.log(`dateString: ${dateString}`);
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error(`Invalid date: ${dateString}`);
        return '';
    }
    // return date.toISOString().slice(0, 19).replace('T', ' ');
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 00:00:00`;
}

exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', async () => {
            try {
                let skippedRows = 0;
                let processedRows = 0;


                for (const row of results) {
                    const bookingId = row['Reservation Number'] ? row['Reservation Number'] : row['Channel Booking ID'] ? row['Channel Booking ID'] : '';
                    
                    // Check if booking already exists
                    const [existingBooking] = await pool.query(
                        `SELECT id FROM bookings WHERE channel_booking_id = ?`,
                        [bookingId]
                    );

                    if (!existingBooking.length) {
                        // Booking does not exist
                        // console.log(row);

                        let name = row['Traveller name'] ? row['Traveller name'] : row['Name'] ? row['Name'] : '';
                        const email = row['Traveller email'] ? row['Traveller email'] : row['Email'] ? row['Email'] : '';
                        const phone = row['Phone Number'] ? row['Phone Number'] : row['Mobile'] ? row['Mobile'] : '';
                        const dateOfBirth = convertToMySQLDate(row['Date of Birth']?row['Date of Birth'].trim(): '');

                        if(!name && email){
                            name = email;
                        }

                        // Check if traveller already exists
                        const [existingTraveller] = await pool.query(
                            `SELECT id FROM travellers WHERE email = ? OR mobile = ?`,
                            [email, phone]
                        );

                        let travellerId;
                        if (existingTraveller.length > 0) {
                            // Traveller exists, use the existing ID
                            travellerId = existingTraveller[0].id;
                        } else {
                            // Insert traveller data
                            const [travellerResult] = await pool.query(
                                `INSERT INTO travellers (name, email, mobile, gender, dob, json_data)
                                VALUES (?, ?, ?, ?, ?, ?)`,
                                [name, email, phone, row['Gender'], dateOfBirth, JSON.stringify(row)]
                            );
                            travellerId = travellerResult.insertId;
                        }

                        const bookingStatus = row['Booking status'] ? row['Booking status'] : '';

                        // Check if status already exists
                        const [existingStatus] = await pool.query(
                            `SELECT id FROM statuses WHERE name = ?`,
                            [bookingStatus]
                        );

                        let statusId;
                        if (existingStatus.length > 0) {
                            statusId = existingStatus[0].id;
                        } else {
                            // Insert status data
                            const [statusResult] = await pool.query(
                                `INSERT INTO statuses (name) VALUES (?)`,
                                [bookingStatus]
                            );
                            statusId = statusResult.insertId;
                        }

                        const hotelName = row['Hotel name'] ? row['Hotel name'] : 'Cloudbeds';

                        // Check if hotel already exists
                        const [existingHotel] = await pool.query(
                            `SELECT id FROM hotels WHERE name = ?`,
                            [hotelName]
                        );

                        let hotelId;
                        if (existingHotel.length > 0) {
                            hotelId = existingHotel[0].id;
                        } else {
                            // Insert hotel data
                            const [hotelResult] = await pool.query(
                                `INSERT INTO hotels (name, inventory_count) VALUES (?, 1)`,
                                [hotelName]
                            );
                            hotelId = hotelResult.insertId;
                        }

                        const roomType = row['Room Type'] ? row['Room Type'] : '';

                        // Check if room type already exists
                        const [existingRoomType] = await pool.query(
                            `SELECT id FROM room_types WHERE hotel_id = ? AND name = ?`,
                            [hotelId, roomType]
                        );

                        let roomTypeId;
                        if (existingRoomType.length > 0) {
                            roomTypeId = existingRoomType[0].id;
                        } else {
                            // Insert room type data
                            const [roomTypeResult] = await pool.query(
                                `INSERT INTO room_types (hotel_id, name) VALUES (?, ?)`,
                                [hotelId, roomType]
                            );
                            roomTypeId = roomTypeResult.insertId;
                        }

                        const channelName = row['Channel'] ? row['Channel'] : row['Source'] ? row['Source'] : 'Unknown';

                        // Check if booking channel already exists
                        const [existingChannel] = await pool.query(
                            `SELECT id FROM channels WHERE name = ?`,
                            [channelName]
                        );

                        let channelId;
                        if (existingChannel.length > 0) {
                            channelId = existingChannel[0].id;
                        } else {
                            // Insert channel data
                            const [channelResult] = await pool.query(
                                `INSERT INTO channels (name) VALUES (?)`,
                                [channelName]
                            );
                            channelId = channelResult.insertId;
                        }

                        const countryName = row['Country'] ? row['Country'] : 'Unknown';

                        // Check if country already exists
                        const [existingCountry] = await pool.query(
                            `SELECT id FROM countries WHERE name = ?`,
                            [countryName]
                        );

                        let countryId;
                        if (existingCountry.length > 0) {
                            countryId = existingCountry[0].id;
                        } else {
                            // Insert country data
                            const [countryResult] = await pool.query(
                                `INSERT INTO countries (name) VALUES (?)`,
                                [countryName]
                            );
                            countryId = countryResult.insertId;
                        }

                        let regionId;
                        if (countryId){
                            const regionName = row['Region'] ? row['Region'] : 'Unknown';

                            // Check if region already exists
                            const [existingRegion] = await pool.query(
                                `SELECT id FROM regions WHERE name = ? AND country_id = ?`,
                                [regionName, countryId]
                            );

                            if (existingRegion.length > 0) {
                                regionId = existingRegion[0].id;
                            } else {
                                // Insert region data
                                const [regionResult] = await pool.query(
                                    `INSERT INTO regions (name, country_id) VALUES (?, ?)`,
                                    [regionName, countryId]
                                );
                                regionId = regionResult.insertId;
                            }
                        }

                        let ratePlanId;
                        const ratePlan = row['Rate plan'] ? row['Rate plan'] : '';

                        if(ratePlan){
                            // Check if rate plan already exists
                            const [existingRatePlan] = await pool.query(
                                `SELECT id FROM rate_plans WHERE name = ?`,
                                [ratePlan]
                            );

                            if (existingRatePlan.length > 0) {
                                ratePlanId = existingRatePlan[0].id;
                            } else {
                                // Insert rate plan data
                                const [ratePlanResult] = await pool.query(
                                    `INSERT INTO rate_plans (name) VALUES (?)`,
                                    [ratePlan]
                                );
                                ratePlanId = ratePlanResult.insertId;
                            }
                        }

                        // console.log(Object.keys(row));  // Print all keys in the row object
                        // console.log(`Raw Arrival Date: ${row['Arrival date']}`);
                        // console.log(`Raw Departure Date: ${row['Departure date']}`);

                        const bookingDateRaw = row['Reservation Date'] ? row['Reservation Date'].trim() : row['Booked on'].trim();
                        const arrivalDateRaw = row['Reservation Date'] ? row['Reservation Date'].trim() : row['Arrival date'].trim();
                        const departureDateRaw = row['Check out Date'] ? row['Check out Date'].trim() : row['Departure date'].trim();
                        const cancellationDateRaw = row['Cancellation Date'] ? row['Cancellation Date'].trim() : row['Cancellation/No show date'] ? row['Cancellation/No show date'].trim() : departureDateRaw;

                        // Convert dates to MySQL format
                        const bookingDate = convertToMySQLDate(bookingDateRaw);
                        const arrivalDate = convertToMySQLDate(arrivalDateRaw);
                        const departureDate = convertToMySQLDate(departureDateRaw);
                        const cancellationDate = convertToMySQLDate(cancellationDateRaw);

                        // console.error(`bookingDate: ${bookingDate}`);
                        // console.error(`arrivalDate: ${arrivalDate}`);
                        // console.error(`departureDate: ${departureDate}`);
                        // console.error(`cancellationDate: ${cancellationDate}`);

                        const guestCount = row['Guest Count'] ? row['Guest Count'] : row['Adults'] ? row['Adults'] : 1;
                        const grossAmount = row['Gross Amount'] ? row['Gross Amount'] : row['Grand Total'] ? row['Grand Total'] : 0;

                        // Insert booking data
                        await pool.query(
                            `INSERT INTO bookings (hotel_id, room_type_id, channel_id, channel_booking_id, description, booked_on,
                                arrival_date, departure_date, cancellation_no_show_date, guest_count, rate_plan_id, gross_amount,
                                status_id, country_id, region_id, traveller_id, json_data)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                hotelId, roomTypeId, channelId, bookingId, row['Description'], bookingDate, arrivalDate, departureDate, cancellationDate,
                                guestCount, ratePlanId, grossAmount, statusId, countryId, regionId, travellerId, JSON.stringify(row)
                            ]
                        );
                        processedRows ++;
                    } else {
                        skippedRows ++;
                    }
                }

                res.status(200).json({ success: true, message: 'File processed successfully!', processedRowsCount: processedRows, skippedRowCount: skippedRows });
            } catch (err) {
                res.status(500).json({ success: false, message: err.message, processedRowsCount: processedRows, skippedRowCount: skippedRows });
            } finally {
                // Clean up the uploaded file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Failed to delete the uploaded file:', err);
                });
            }
        });
};
