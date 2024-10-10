const statusMappings = {
    'Check-in': [
        'Auto checked-in',
        'Check In',
        'Checked In',
        'Checked-in',
        'Complete checked in',
        'One-click checked in'
    ],
    'Check-out': [
        'Auto checked-out',
        'Check Out',
        'Completed',
        'Completed ',
        'Complete checked out',
        'One-click checked out'
    ],
    'Confirmed': [
        'Booked',
        'Confirmed',
        'Confirmed modified',
        'Confirmed Modify',
        'Reserved'
    ],
    'Cancelled': [
        'Cancelled',
        'Cancel',
        'Cancelled Already'
    ],
    'No show': [
        'No Show',
        'No-show',
        'Noshow Test'
    ]
};

function mapStatus(status) {
    if (status === null || status === undefined || status.trim() === '') {
        return 'Unknown';
    }
    
    status = status.trim();
    for (const [mappedStatus, statusList] of Object.entries(statusMappings)) {
        if (statusList.includes(status)) {
            return mappedStatus;
        }
    }
    return status; // Return original status if no mapping found
}

module.exports = {
    mapStatus
};