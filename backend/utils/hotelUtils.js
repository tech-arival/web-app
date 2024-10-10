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

module.exports = {
    convertSettlToWandr,
    correctSpelling
};