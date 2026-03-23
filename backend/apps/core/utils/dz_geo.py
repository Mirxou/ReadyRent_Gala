# Algerian Wilayas Data (58 Wilayas)

WILAYAS = [
    (1, 'Adrar'), (2, 'Chlef'), (3, 'Laghouat'), (4, 'Oum El Bouaghi'),
    (5, 'Batna'), (6, 'Béjaïa'), (7, 'Biskra'), (8, 'Béchar'),
    (9, 'Blida'), (10, 'Bouira'), (11, 'Tamanrasset'), (12, 'Tébessa'),
    (13, 'Tlemcen'), (14, 'Tiaret'), (15, 'Tizi Ouzou'), (16, 'Alger'),
    (17, 'Djelfa'), (18, 'Jijel'), (19, 'Sétif'), (20, 'Saïda'),
    (21, 'Skikda'), (22, 'Sidi Bel Abbès'), (23, 'Annaba'), (24, 'Guelma'),
    (25, 'Constantine'), (26, 'Médéa'), (27, 'Mostaganem'), (28, "M'Sila"),
    (29, 'Mascara'), (30, 'Ouargla'), (31, 'Oran'), (32, 'El Bayadh'),
    (33, 'Illizi'), (34, 'Bordj Bou Arreridj'), (35, 'Boumerdès'), (36, 'El Tarf'),
    (37, 'Tindouf'), (38, 'Tissemsilt'), (39, 'El Oued'), (40, 'Khenchela'),
    (41, 'Souk Ahras'), (42, 'Tipaza'), (43, 'Mila'), (44, 'Aïn Defla'),
    (45, 'Naâma'), (46, 'Aïn Témouchent'), (47, 'Ghardaïa'), (48, 'Relizane'),
    (49, 'Timimoun'), (50, 'Bordj Badji Mokhtar'), (51, 'Ouled Djellal'), (52, 'Béni Abbès'),
    (53, 'In Salah'), (54, 'In Guezzam'), (55, 'Touggourt'), (56, 'Djanet'),
    (57, "El M'Ghair"), (58, "El Meniaa"),
    # Expansion Zones (Future Spread)
    (59, "Wilaya 59 (Expansion)"), (60, "Wilaya 60 (Expansion)"),
    (61, "Wilaya 61 (Expansion)"), (62, "Wilaya 62 (Expansion)"),
    (63, "Wilaya 63 (Expansion)"), (64, "Wilaya 64 (Expansion)"),
    (65, "Wilaya 65 (Expansion)"), (66, "Wilaya 66 (Expansion)"),
    (67, "Wilaya 67 (Expansion)"), (68, "Wilaya 68 (Expansion)"),
    (69, "Wilaya 69 (Expansion)")
]

# Map for Select Choice Field (Value, Label)
WILAYA_CHOICES = [(i, f"{i:02d} - {name}") for i, name in WILAYAS]

def get_wilaya_name(code):
    """Retrieve Wilaya name by code (1-58)"""
    for i, name in WILAYAS:
        if i == code:
            return name
    return "Unknown"
