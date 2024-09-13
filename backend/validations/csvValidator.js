const cloudbedHeaders = [
    'reservation_number', 'traveller_name', 'traveller_email', 'phone_number', 'mobile_number', 'date_of_birth', 'gender',
    'reservation_date', 'arrival_date', 'departure_date',
    'channel', 'booking_status', 'room_type', 'country',
    'adults', 'children', 'grand_total'
  ];

  const zuzuHeaders = [
    'channel_booking_id', 'traveller_name', 'traveller_email', 'date_of_birth',
    'booking_date', 'arrival_date', 'departure_date', 'cancellation_no_show_date',
    'channel', 'booking_status', 'room_type', 'rate_plan', 'country', 
    'guest_count', 'gross_amount'
  ];

// Validate if all required headers are present
function validateHeaders(headers, hotel = 'cloudbeds') {
    const requiredHeaders = hotel.toLowerCase() == 'cloudbeds' ? cloudbedHeaders : zuzuHeaders
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
        return { valid: false, errors: `Missing headers: ${missingHeaders.join(', ')}` };
    }
    return { valid: true };
}

// Validate row data for required fields and correct formats
function validateRow(row, rowIndex) {
    let errors = [];

    // Check if mandatory fields are present
    if (!row['reservation_number'] && !row['channel_booking_id']) {
        errors.push(`Row ${rowIndex}: Missing Reservation Number or Channel Booking ID`);
    }
    if (!row['traveller_name'] && !row['traveller_email']) {
        errors.push(`Row ${rowIndex}: Missing Traveller name and Traveller email`);
    }
    if (!row['arrival_date']) {
        errors.push(`Row ${rowIndex}: Missing Arrival date`);
    }
    if (!row['departure_date']) {
        errors.push(`Row ${rowIndex}: Missing Departure date`);
    }
    if (!row['grand_total'] && !row['gross_amount']) {
        errors.push(`Row ${rowIndex}: Missing Grand Total or Gross Amount`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateHeaders,
    validateRow
};
