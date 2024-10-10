const channelMappings = {
    'MMT': ['GO MMT', 'MakeMyTrip', 'GoibiboPrepay'],
    'Booking': ['Booking.Com', 'Booking.comPostpay'],
    'Expedia': ['Expedia', 'ExpediaPostpay', 'ExpediaPrepay'],
    'Agoda': ['Agoda', 'AgodaPrepay'],
    'Airbnb': ['AirBnB', 'AirbnbPrepay'],
    'Booking engine': ['BEIscheduled', 'GoogleScheduled', 'Zuzu'],
    'B2B': ['B2B', 'Broker Network'],
    'Ctrip': ['CtripPrepay'],
    'Extension': ['Extension', 'LS Extension', 'Wandr Extension', 'Settl Extension'],
    'Walkin': ['HotelOfflinePostpay', 'HotelOfflinePrepay', 'HotelWalk-in'],
    'Inbound Call': ['Inbound', 'inbound']
};

function mapChannel(channel) {
    if (channel === null || channel === undefined || channel.trim() === '') {
        return 'OTHERS';
    }
    
    channel = channel.trim();
    for (const [mappedChannel, channelList] of Object.entries(channelMappings)) {
        if (channelList.includes(channel) || channel.toLowerCase() === mappedChannel.toLowerCase()) {
            return mappedChannel;
        }
    }
    return 'OTHERS'; // Return 'OTHERS' for any unmapped channels
}

module.exports = {
    mapChannel
};