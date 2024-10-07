const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../config/db');
const { parse, isValid, format, parseISO } = require('date-fns');

function convertToMySQLDate(dateString, defaultYear = new Date().getFullYear()) {
    if (!dateString || typeof dateString !== 'string' || dateString.trim().toUpperCase() === 'N/A') {
        console.warn(`Invalid dateString: "${dateString}". Returning null.`);
        return null;
    }

    dateString = dateString.trim();

    const possibleFormats = [
        'dd MMM yyyy HH:mm:ss',
        'dd MMM yyyy HH:mm',
        'dd MMM yyyy',
        'yyyy-MM-dd',
        'dd-MM-yyyy',
        'MM-dd-yyyy',
        'yyyy/MM/dd',
        'dd/MM/yyyy',
        'MM/dd/yyyy',
        'dd-MMM-yy',
        'dd-MMM-yyyy',
        'dd-MMMM-yyyy',
        'MMM dd yyyy',
        'MMMM dd yyyy',
        'yyyy-MM-dd HH:mm:ss',
        'yyyy-MM-dd HH:mm',
        'dd-MM-yyyy HH:mm:ss',
        'dd-MM-yyyy HH:mm',
        'MM-dd-yyyy HH:mm:ss',
        'MM-dd-yyyy HH:mm',
        'dd MMM',
        'MMM dd',
        'dd-MM',
        'MM-dd'
    ];

    // Try parsing with date-fns
    for (let formatString of possibleFormats) {
        let date = parse(dateString, formatString, new Date());
        if (isValid(date)) {
            // Handle two-digit years
            if (formatString.includes('yy') && !formatString.includes('yyyy')) {
                const year = date.getFullYear();
                if (year < 100) {
                    date.setFullYear(year < 50 ? 2000 + year : 1900 + year);
                }
            }
            // Handle dates without year
            if (!formatString.includes('y')) {
                date.setFullYear(defaultYear);
            }
            return format(date, 'yyyy-MM-dd');
        }
    }

    // Try parsing as ISO date
    let dateISO = parseISO(dateString);
    if (isValid(dateISO)) {
        return format(dateISO, 'yyyy-MM-dd');
    }

    // Try parsing with JavaScript's Date
    let jsDate = new Date(dateString);
    if (isValid(jsDate) && !isNaN(jsDate.getTime())) {
        return format(jsDate, 'yyyy-MM-dd');
    }

    // Custom parsing for unconventional formats
    const customParsers = [
        // Parse "dd MMM yyyy" with optional time
        (str) => {
            const match = str.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})(\s+\d{1,2}:\d{2}(:\d{2})?)?$/i);
            if (match) {
                const [, day, month, year, time] = match;
                const date = new Date(`${month} ${day}, ${year}${time || ''}`);
                return isValid(date) ? date : null;
            }
            return null;
        },
        // Parse dates with only day and month
        (str) => {
            const match = str.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i);
            if (match) {
                const [, day, month] = match;
                const date = new Date(`${month} ${day}, ${defaultYear}`);
                return isValid(date) ? date : null;
            }
            return null;
        },
        // Parse dates in format "MMM dd"
        (str) => {
            const match = str.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i);
            if (match) {
                const [, month, day] = match;
                const date = new Date(`${month} ${day}, ${defaultYear}`);
                return isValid(date) ? date : null;
            }
            return null;
        }
    ];

    for (let parser of customParsers) {
        const parsedDate = parser(dateString);
        if (parsedDate && isValid(parsedDate)) {
            return format(parsedDate, 'yyyy-MM-dd');
        }
    }

    // If all parsing attempts fail, return null
    console.warn(`Failed to parse dateString: "${dateString}". Returning null.`);
    return null;
}
// ... (rest of the code remains unchanged)

const hotelMappings = {
    "Wandr Centauri": ["Settl. Pisa A", "Settl. Pisa B", "Settl.Pisa block b", "Settl. Pisa Block B", "Settl.Pisa", "settl.Pisa A", "Settl.pisa Block A", "Settl.Pisa Block B", "Settl. Pisa Block A", "Settl Pisa Block B", "Settl.pisa", "Settl.Pisa block A", "Settl.Pisa block b", "settl.pisa block B"],
    "Wandr Alberia": "Settl. Alba",
    "Wandr Lepus": ["Settl. Lumia", "settl. Lumia"],
    "Wandr Tiaki": ["Settl. Tavira", "Settl Tavira"],
    "Wandr Leo": ["Settl. Colmar", "Settl.colmar", "Sttl.Colmar"],
    "Wandr Serpens": "Settl. Sorrento",
    "Wandr Taurus": ["Settl. Alberti", "Setll.Alberti"],
    "Wandr Vela": "Settl. Verona",
    "Wandr Sagitta": "Settl. Samoa",
    "Wandr Urbian": "Settl. Urbino",
    "Wandr Alcor": "Settl. Athea",
    "Wandr Pilar": ["Settl. Prague", "Settl Prague"],
    "Wandr Gemini": "Settl. Delvin",
    "Wandr Aries": ["Settl. Arlon", "settl. Arlon"],
    "Wandr Auriga": ["Settl. Hallstatt","settl. Hallstatt"],
    "Wandr Sarin": "Settl. Sofia",
    "Wandr Mizar": ["Settl. Springfield", "settl. Springfield"],
    "Wandr Vega": "Settl. Vienna",
    "Wandr Ogma": "Settl. Oslo",
    "Wandr Azura": "Settl. Azore",
    "Wandr Dorado": ["Settl. Deia","Settl Deia"],
    "Wandr Polaris": "Settl. Bologna",
    "Wandr Nodus": "Settl. Nola",
    "Wandr Deneb": "Settl. Dinant",
    "Wandr Orion": ["Settl. Tellaro", "Settl Tellaro"],
    "Wandr Berlin": "Settl. Bosa",
    "Wandr Naos": "Settl. Norcia",
    "Wandr Sirius": "Settl. Santana",
    "Wandr Salm": "Settl. Santorini",
    "Wandr Caroli": "Settl. Contes",
    "Wandr Virgo": "Settl. Vernazza",
    "Wandr Libertas": "Settl. Lugano",
    "Wandr Mensa": ["Settl. Monsanto", "settl. Monsanto"],
    "Wandr Rigel": "Settl. Reine",
    "Wandr Sargas": "Settl. Samara",
    "Wandr Rigarus": "Settl. Riga",
    "Wandr Meleph": "Settl. Minori",
    "Wandr Carina": "Settl. Belfort",
    "Wandr Altair": "Settl. Altea",
    "Wandr Gomeisa": "Settl. Gorbio",
    "Wandr Clarion": "Settl. Clare",
    "Wandr Blaze": "Settl. Bron",
    "Wandr Almira": "Settl. Amalfi",
    "Wandr Scorpious": ["Settl. Siena Block A", "Settl. Siena A Block", "Settl. Siena", "Settl.siena", "Sttl.siena A", "Settl.siena Block A"],
    
};

function convertSettlToWandr(hotelName) {
    // First, check if the hotelName starts with "Settl." and remove it if present
    const cleanedName = hotelName.startsWith("Settl.") ? hotelName.slice(6).trim() : hotelName;

    // Then look for a match in our mappings
    for (const [wandrName, settlNames] of Object.entries(hotelMappings)) {
        if (Array.isArray(settlNames)) {
            if (settlNames.includes(hotelName) || settlNames.some(name => name.endsWith(cleanedName))) {
                return wandrName;
            }
        } else if (settlNames === hotelName || settlNames.endsWith(cleanedName)) {
            return wandrName;
        }
    }
    return hotelName;
}

function correctSpelling(hotelName) {
    if (hotelName === "Wandr Riganus") return "Wandr Rigarus";
    if (hotelName === "Wandr Scorpius") return "Wandr Scorpious";
    return hotelName;
}

exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const results = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv({
                    mapHeaders: ({ header, index }) => header.toLowerCase().replace(/\W+/g, '_').trim()
                }))
                .on('data', (row) => results.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        let processedRows = 0;
        let skippedRows = 0;
        try {
            await pool.query('START TRANSACTION');
            for (const row of results) {
                try {
                    // New logic for handling the new CSV format
                    let bookingId = row['booking_id_zuzu_id'] || row['stlmbr100011808'] || row['reservation_number'] || row['channel_booking_id'] || '';
                    let name = row['name'] || row['traveller_name'] || '';
                    const email = row['traveller_email'] || row['email'] || '';
                    const phone = row['contact_number'] || row['phone_number'] || row['mobile'] || '';
                    const arrivalDateRaw = row['move_in_date'] || row['arrival_date'] || '';
                    const departureDateRaw = row['move_out_date'] || row['departure_date'] || '';
                    const cancellationDateRaw = row['cancellation_no_show_date'] || row['cancellation_date'] || '';
                    let bookingDateRaw = row['reservation_date'] || row['booked_on'] || '';

                    // If there's no booking ID and no arrival/departure dates, skip the row
                    if (!bookingId && (!arrivalDateRaw || !departureDateRaw) && !bookingDateRaw) {
                        console.warn(`Skipping row due to missing essential data: Booking ID, Arrival/Departure Dates, and Booking Date`);
                        skippedRows++;
                        continue;
                    }

                    // If there's no booking ID but we have arrival/departure dates or booking date, create a booking ID
                    if (!bookingId) {
                        bookingId = `GEN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                    }

                    // Replace empty booked_on with arrival_date if available
                    if (!bookingDateRaw && arrivalDateRaw) {
                        console.log(`booked_on is empty. Replacing with arrival_date: "${arrivalDateRaw}"`);
                        bookingDateRaw = arrivalDateRaw;
                    }

                    const bookingDate = convertToMySQLDate(bookingDateRaw);
                    
                    // Handle missing arrival date
                    let arrivalDate;
                    if (!arrivalDateRaw) {
                        arrivalDate = bookingDate; // Use booking date as arrival date if arrival date is missing
                        console.log(`Arrival date is missing. Using booking date: "${bookingDate}" as arrival date.`);
                    } else {
                        arrivalDate = convertToMySQLDate(arrivalDateRaw);
                    }

                    // Handle missing departure date
                    let departureDate;
                    if (!departureDateRaw) {
                        // If departure date is null, set it to tomorrow's date
                        const tomorrow = new Date(arrivalDate);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        departureDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                        console.log(`Departure date is missing. Setting to day after arrival: "${departureDate}"`);
                    } else {
                        departureDate = convertToMySQLDate(departureDateRaw);
                    }

                    const cancellationDate = cancellationDateRaw ? convertToMySQLDate(cancellationDateRaw) : departureDate;

                    if (!name && email) name = email;

                    // Check for necessary features
                    if (!arrivalDate || !departureDate) {
                        console.warn(`Skipping row due to missing essential data: Arrival Date: ${arrivalDate}, Departure Date: ${departureDate}`);
                        skippedRows++;
                        continue;
                    }

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

                    const bookingStatus = row['booking_status'] || row['booking_status_no_show_ota_team'] || '';

                    // Check if status already exists
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

                    let hotelName = row['property_name'] || row['property'] || 'Unknown';

                    // Modify hotel name as per conditions
                    if (hotelName === "Wandr Coles road" || hotelName === "Wandr Settl Ulsoor") {
                        hotelName = "Wandr by Settl Ulsoor";
                    }

                    // Apply hotel name mappings and spelling corrections
                    hotelName = correctSpelling(hotelName);
                    hotelName = convertSettlToWandr(hotelName);
                    

                    // Modify hotel name as per conditions
                    if (hotelName === "Wandr Coles road" || hotelName === "Wandr Settl Ulsoor") {
                        hotelName = "Wandr by Settl Ulsoor";
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
                    const roomType = row['room_no'] || row['room_type'] || '';

                    // Check if room type already exists
                    const [existingRoomType] = await pool.query(
                        `SELECT id FROM room_types WHERE hotel_id = ? AND name = ?`,
                        [hotelId, roomType]
                    );

                    let roomTypeId;
                    if (existingRoomType.length > 0) {
                        roomTypeId = existingRoomType[0].id;
                    } else {
                        const [roomTypeResult] = await pool.query(
                            `INSERT INTO room_types (hotel_id, name) VALUES (?, ?)`,
                            [hotelId, roomType]
                        );
                        roomTypeId = roomTypeResult.insertId;
                    }

                    const channelName = row['booking_source'] || row['channel'] || row['source'] || 'Unknown';

                    // Check if booking channel already exists
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

                const countryName = row['country']?.trim() || 'Unknown';
                let [country] = await pool.query(`SELECT id FROM countries WHERE name = ?`, [countryName]);
                if (country.length === 0) {
                    [country] = await pool.query(`INSERT INTO countries (name) VALUES (?)`, [countryName]);
                }
                const countryId = country.insertId || country[0].id;

                const regionName = row['region']?.trim() || 'Unknown';
                let [region] = await pool.query(`SELECT id FROM regions WHERE name = ? AND country_id = ?`, [regionName, countryId]);
                if (region.length === 0) {
                    [region] = await pool.query(`INSERT INTO regions (name, country_id) VALUES (?, ?)`, [regionName, countryId]);
                }
                const regionId = region.insertId || region[0].id;

                let ratePlanId;
                const ratePlan = row['rate_plan'] || '';

                if (ratePlan) {
                    // Check if rate plan already exists
                    const [existingRatePlan] = await pool.query(
                        `SELECT id FROM rate_plans WHERE name = ?`,
                        [ratePlan]
                    );

                    if (existingRatePlan.length > 0) {
                        ratePlanId = existingRatePlan[0].id;
                    } else {
                        const [ratePlanResult] = await pool.query(
                            `INSERT INTO rate_plans (name) VALUES (?)`,
                            [ratePlan]
                        );
                        ratePlanId = ratePlanResult.insertId;
                    }
                }

                const guestCount = row['guest_count'] || row['adults'] || 1;

                    const grossAmountStr = row['gross_amount_paid_by_guest'] || row['gross_amount'] || row['grand_total'] || row["net_amount"] || '0';
                    let cleanedGrossAmount = grossAmountStr.replace(/[^\d.-]/g, '');
                    cleanedGrossAmount = cleanedGrossAmount.replace(/^-?0+(?=\d)/, ''); // Remove leading zeros
                    let grossAmount = !isNaN(parseFloat(cleanedGrossAmount)) ? parseFloat(cleanedGrossAmount) : 0;

                    // Handle negative zero case
                    if (grossAmount === 0 && grossAmountStr.includes('-')) {
                        grossAmount = -0;
                    }

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
                            row['guest_count'] || row['adults'] || 1, row['rate_plan_id'], grossAmount, statusId, 
                            row['country_id'], row['region_id'], travellerId, JSON.stringify(row)
                        ]
                    );

                    processedRows++;
                } catch (rowError) {
                    console.error(`Error processing row: ${rowError.message}`);
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
            res.status(500).json({ 
                success: false, 
                message: err.message, 
                processedRowsCount: processedRows,
                skippedRowsCount: skippedRows
            });
        } finally {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to delete the uploaded file:', err);
            });
        }

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete the uploaded file:', err);
        });
    }
};