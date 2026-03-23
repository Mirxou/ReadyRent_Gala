
from datetime import datetime

class VisualAssetsBuilder:
    """
    Constructs the standard Visual Assets JSON structure required by the Sovereign API.
    Dictates Mode, Seal, and Receipt to the Frontend.
    """
    
    @staticmethod
    def for_cooling_off(dispute_id, unlock_time):
        return {
            "mode": "DISPUTE",
            "seal": {
                "type": "SHIELD_SILVER",
                "ref_id": f"COOL-{datetime.now().strftime('%Y%m%d')}-{dispute_id}"
            },
            "receipt": {
                "stages": [
                    {
                        "label_ar": "استلام الطلب",
                        "status": "completed",
                        "timestamp": datetime.now().isoformat()
                    },
                    {
                        "label_ar": "فترة التهدئة", 
                        "status": "active",
                        "unlocks_at": unlock_time
                    },
                    {
                        "label_ar": "الفحص الأولي",
                        "status": "pending"
                    }
                ]
            }
        }

    @staticmethod
    def for_conditional(dispute_id):
        return {
            "mode": "DISPUTE", 
            "seal": {
                "type": "BOOK_GREY",
                "ref_id": f"COND-{datetime.now().strftime('%Y%m%d')}-{dispute_id}"
            },
            "receipt": {
                "stages": [] # No receipt yet for conditional, just requirements
            }
        }
        
    @staticmethod
    def for_proceeding(dispute_id):
        return {
            "mode": "DISPUTE",
            "seal": {
                "type": "BALANCE_GOLD",
                "ref_id": f"PROC-{datetime.now().strftime('%Y%m%d')}-{dispute_id}"
            },
            "receipt": {
                "stages": [
                    {
                        "label_ar": "تسجيل الطلب", 
                        "status": "completed",
                        "timestamp": datetime.now().isoformat()
                    },
                    {
                        "label_ar": "الفحص الأولي", 
                        "status": "active"
                    },
                    {
                        "label_ar": "تشكيل اللجنة", 
                        "status": "pending"
                    }
                ]
            }
        }
