// ##### This code Works Without Validators


const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../config/db');
const { parse, isValid, format, parseISO } = require('date-fns');

function convertToMySQLDate(dateString, defaultYear = 2024) {
    if (!dateString || dateString.toUpperCase() === 'N/A') return '1800-01-01';
    let date = parseISO(dateString);
    if (isValid(date)) return format(date, 'yyyy-MM-dd');

    const possibleFormats = [
        'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'dd.MM.yyyy',
        'd-MMM-yyyy', 'd-MMMM-yyyy', 'dd MMM yyyy', 'dd MMMM yyyy',
        'dd/MM', 'MM/dd', 'dd-MM-yy', 'dd.MM.yy', 'dd/MM/yy', 'MM/dd/yy',
        'd-MMM-yy', 'd-MMMM-yy', 'dd MMM yy', 'dd MMMM yy'
    ];

    for (let formatString of possibleFormats) {
        date = parse(dateString, formatString, new Date());
        if (isValid(date)) {
            if (formatString.includes('yy')) {
                const year = date.getFullYear();
                const century = year < 50 ? 2000 : 1900;
                date.setFullYear(century + year % 100);
            }
            if (formatString === 'dd/MM' || formatString === 'MM/dd') {
                date.setFullYear(defaultYear);
            }
            return format(date, 'yyyy-MM-dd');
        }
    }

    date = new Date(dateString);
    if (isValid(date)) {
        const currentYear = new Date().getFullYear();
        if (currentYear === date.getFullYear() && !dateString.includes(currentYear.toString())) {
            date.setFullYear(defaultYear);
        }
        return format(date, 'yyyy-MM-dd');
    }

    return '1800-01-01';
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
            let processedRows = 0;
            try {
                await pool.query('START TRANSACTION');
                for (const row of results) {
                    const bookingId = row['Reservation Number'] || row['Channel_booking _ID'] || '';
                    let name = row['Traveller name'] || row['Name'] || '';
                    const email = row['Traveller email'] || row['Email'] || '';
                    const phone = row['Phone Number'] || row['Mobile'] || '';
                    const dateOfBirth = convertToMySQLDate(row['Date of Birth']?.trim() || '');
                    
                    if (!name && email) name = email;

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
                            
                            const [travellerResult] = await pool.query(
                                `INSERT INTO travellers (name, email, mobile, gender, dob, json_data)
                                 VALUES (?, ?, ?, ?, ?, ?)
                                 ON DUPLICATE KEY UPDATE 
                                 name = VALUES(name), gender = VALUES(gender), dob = VALUES(dob), json_data = VALUES(json_data)`,
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

                        let hotelName = row['Property'] ? row['Property'] : 'Cloudbeds';
                    
                        // Add this condition to change the hotel name
                        if (hotelName === "Wandr Coles road") {
                            hotelName = "Wandr Settl Ulsoor";
                        }

                        // Check if hotel already exists
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

                        // Ensure 'Unknown' is inserted or retrieved for countries and regions
                        const countryName = row['Country']?.trim() || 'Unknown';
                        let [country] = await pool.query(`SELECT id FROM countries WHERE name = ?`, [countryName]);
                        if (country.length === 0) {
                            [country] = await pool.query(`INSERT INTO countries (name) VALUES (?)`, [countryName]);
                        }
                        const countryId = country.insertId || country[0].id;

                        const regionName = row['Region']?.trim() || 'Unknown';
                        let [region] = await pool.query(`SELECT id FROM regions WHERE name = ? AND country_id = ?`, [regionName, countryId]);
                        if (region.length === 0) {
                            [region] = await pool.query(`INSERT INTO regions (name, country_id) VALUES (?, ?)`, [regionName, countryId]);
                        }
                        const regionId = region.insertId || region[0].id;

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
                        const bookingDateRaw = row['Reservation Date'] ? row['Reservation Date'].trim() : row['Booked on'].trim();
                        const arrivalDateRaw = row['Reservation Date'] ? row['Reservation Date'].trim() : row['Arrival date'].trim();
                        const departureDateRaw = row['Check out Date'] ? row['Check out Date'].trim() : row['Departure date'].trim();
                        const cancellationDateRaw = row['Cancellation/No show date'] ? row['Cancellation/No show date'].trim() : 
                                                    row['Cancellation Date'] ? row['Cancellation Date'].trim() : '';

                        const bookingDate = convertToMySQLDate(bookingDateRaw);
                        const arrivalDate = convertToMySQLDate(arrivalDateRaw);
                        const departureDate = convertToMySQLDate(departureDateRaw);
                        const cancellationDate = cancellationDateRaw ? convertToMySQLDate(cancellationDateRaw) : departureDate;

                        const guestCount = row['Guest Count'] ? row['Guest Count'] : row['Adults'] ? row['Adults'] : 1;
                        

                        let grossAmountStr = row['Gross amount'] ? row['Gross amount'] : row['Grand Total'] ? row['Grand Total'] : 0;

                        grossAmountStr = typeof grossAmountStr === 'string' ? grossAmountStr.replace(/,/g, '') : grossAmountStr;

                        let grossAmount = !isNaN(parseFloat(grossAmountStr)) ? parseFloat(grossAmountStr) : 0;


                        // Insert booking data
                        await pool.query(
                            `INSERT INTO bookings (hotel_id, room_type_id, channel_id, channel_booking_id, booked_on,
                                arrival_date, departure_date, cancellation_no_show_date, guest_count, rate_plan_id, gross_amount,
                                status_id, country_id, region_id, traveller_id, json_data)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                                booked_on = VALUES(booked_on), arrival_date = VALUES(arrival_date), departure_date = VALUES(departure_date),
                                cancellation_no_show_date = VALUES(cancellation_no_show_date), guest_count = VALUES(guest_count),
                                rate_plan_id = VALUES(rate_plan_id), gross_amount = VALUES(gross_amount), status_id = VALUES(status_id),
                                country_id = VALUES(country_id), region_id = VALUES(region_id), traveller_id = VALUES(traveller_id),
                                json_data = VALUES(json_data)`,
                            [
                                hotelId, roomTypeId, channelId, bookingId, bookingDate, arrivalDate, departureDate, cancellationDate,
                                guestCount, ratePlanId, grossAmount, statusId, countryId, regionId, travellerId, JSON.stringify(row)
        
                            ]
                        );
                        
                        processedRows ++;
                    } 
                    await pool.query('COMMIT');
                    res.status(200).json({ success: true, message: 'File processed successfully!', processedRowsCount: processedRows });
                } catch (err) {
                    await pool.query('ROLLBACK');
                    res.status(500).json({ success: false, message: err.message, processedRowsCount: processedRows });
                } finally {
                    // Clean up the uploaded file
                    fs.unlink(req.file.path, (err) => {
                        if (err) console.error('Failed to delete the uploaded file:', err);
                    });
                }
            });
    };


