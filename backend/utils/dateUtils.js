const { parse, isValid, format, parseISO } = require('date-fns');

const POSSIBLE_FORMATS = [
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

const MONTH_REGEX = '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)';
const CUSTOM_PARSERS = [
    {
        regex: new RegExp(`^(\\d{1,2})\\s+${MONTH_REGEX}\\s+(\\d{4})(\\s+\\d{1,2}:\\d{2}(:\\d{2})?)?$`, 'i'),
        parse: (match, defaultYear) => new Date(`${match[2]} ${match[1]}, ${match[3]}${match[4] || ''}`)
    },
    {
        regex: new RegExp(`^(\\d{1,2})\\s+${MONTH_REGEX}$`, 'i'),
        parse: (match, defaultYear) => new Date(`${match[2]} ${match[1]}, ${defaultYear}`)
    },
    {
        regex: new RegExp(`^${MONTH_REGEX}\\s+(\\d{1,2})$`, 'i'),
        parse: (match, defaultYear) => new Date(`${match[1]} ${match[2]}, ${defaultYear}`)
    }
];

/**
 * Converts various date string formats to MySQL date format (YYYY-MM-DD)
 * @param {string} dateString - The input date string to convert
 * @param {number} [defaultYear=current year] - Default year to use for dates without year
 * @returns {string|null} - MySQL formatted date string or null if parsing fails
 */
function convertToMySQLDate(dateString, defaultYear = new Date().getFullYear()) {
    // Input validation
    if (!dateString || typeof dateString !== 'string') {
        console.warn(`Invalid dateString: "${dateString}". Returning null.`);
        return null;
    }

    // Normalize input
    dateString = dateString.trim();
    if (dateString.toUpperCase() === 'N/A') return null;

    // Try parsing with date-fns predefined formats
    for (const formatString of POSSIBLE_FORMATS) {
        const date = parse(dateString, formatString, new Date());
        if (isValid(date)) {
            if (formatString.includes('yy') && !formatString.includes('yyyy')) {
                // Handle two-digit years
                const year = date.getFullYear();
                date.setFullYear(year < 50 ? 2000 + year : 1900 + year);
            }
            if (!formatString.includes('y')) {
                // Handle dates without year
                date.setFullYear(defaultYear);
            }
            return format(date, 'yyyy-MM-dd');
        }
    }

    // Try parsing as ISO date
    const dateISO = parseISO(dateString);
    if (isValid(dateISO)) {
        return format(dateISO, 'yyyy-MM-dd');
    }

    // Try parsing with JavaScript's Date
    const jsDate = new Date(dateString);
    if (isValid(jsDate) && !isNaN(jsDate.getTime())) {
        return format(jsDate, 'yyyy-MM-dd');
    }

    // Try custom parsers
    for (const { regex, parse } of CUSTOM_PARSERS) {
        const match = dateString.match(regex);
        if (match) {
            const parsedDate = parse(match, defaultYear);
            if (isValid(parsedDate)) {
                return format(parsedDate, 'yyyy-MM-dd');
            }
        }
    }

    console.warn(`Failed to parse dateString: "${dateString}". Returning null.`);
    return null;
}

module.exports = { 
    convertToMySQLDate,
    // Expose for testing
    _POSSIBLE_FORMATS: POSSIBLE_FORMATS,
    _CUSTOM_PARSERS: CUSTOM_PARSERS
};