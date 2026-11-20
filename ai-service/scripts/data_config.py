CITIES = [
    {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
    {"city": "Delhi", "state": "Delhi", "lat": 28.7041, "lon": 77.1025},
    {"city": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    {"city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
    {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
    {"city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867},
    {"city": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639},
    {"city": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lon": 72.5714},
    {"city": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873},
    {"city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462},
]

BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Bank of Baroda", "Kotak Mahindra", "Punjab National Bank"]

UPI_APPS = ["PhonePe", "GPay", "Paytm", "BHIM", "Amazon Pay"]

MERCHANT_CATEGORIES = {
    "Food & Dining": ["Swiggy", "Zomato", "Dominos", "McDonalds", "Local Restaurant"],
    "E-commerce": ["Amazon", "Flipkart", "Myntra", "Ajio"],
    "Groceries": ["BigBasket", "Blinkit", "DMart", "Local Kirana"],
    "Travel": ["IRCTC", "MakeMyTrip", "Ola", "Uber", "RedBus"],
    "Utilities": ["Electricity Board", "Gas Agency", "Water Board", "Broadband ISP"],
    "Entertainment": ["BookMyShow", "Netflix", "Spotify", "PVR Cinemas"],
    "Healthcare": ["Apollo Pharmacy", "1mg", "PharmEasy", "Local Clinic"],
    "P2P": [],
}

DEVICE_OS = ["Android 13", "Android 14", "iOS 17", "iOS 18"]

FRAUD_TYPES = [
    "HIGH_VALUE",
    "NEW_DEVICE",
    "ODD_HOUR",
    "IMPOSSIBLE_TRAVEL",
    "RAPID_SUCCESSION",
    "BLACKLISTED_MERCHANT",
    "MULE_NETWORK",
]

MULE_DEVICE_IDS = ["dev-mule" + str(i).zfill(3) for i in range(6)]

BLACKLISTED_MERCHANTS = ["QuickCash Traders", "InstaLoan Direct", "FastForex Exchange", "WinBig Rewards"]