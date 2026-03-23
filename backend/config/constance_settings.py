

# --- SOVEREIGN CONSTANCE CONFIG ---
CONSTANCE_BACKEND = 'constance.backends.database.DatabaseBackend'

CONSTANCE_CONFIG = {
    # 1. The Gates (Territory & Verticals)
    # 1. The Gates (Territory) - The Sovereign Spectrum
    # Green Zone: Full Sovereignty (Open Expansion)
    # Yellow Zone: Controlled Expansion (Incubation)
    'SOVEREIGN_WILAYAS_GREEN': ([16], 'Green Zone Wilayas (Full Access)', list),
    'SOVEREIGN_WILAYAS_YELLOW': ([], 'Yellow Zone Wilayas (Limited Access)', list),
    
    # 2. The Arsenal (Verticals)
    'SOVEREIGN_ALLOWED_CATEGORIES': (['electronics'], 'Global Allowed Categories (Green Zone)', list),
    'SOVEREIGN_YELLOW_ZONE_CATEGORIES': (['electronics'], 'Restricted Categories for Yellow Zone', list),
    
    # 3. Regional Readiness Thresholds (RRS)
    'RRS_MIN_VERIFIED_HOSTS': (10, 'Min Verified Hosts for Green Zone', int),
    'RRS_MIN_TRANSACTIONS': (50, 'Min Successful Transactions for Green Zone', int),
    'RRS_MAX_DISPUTES': (0, 'Max Unresolved Disputes (Peace Treaty)', int),
    
    # 4. The Treasury (SPF)
    'SPF_RENTER_RATE': (0.05, 'Sovereign Protection Fee Rate (Renter)', float),
    'SPF_OWNER_RATE': (0.05, 'Sovereign Protection Fee Rate (Owner)', float),
}
# Legacy: SOVEREIGN_ALLOWED_WILAYAS is deprecated in favor of GREEN/YELLOW zones.
# -----------------------------------
