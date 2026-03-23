
from datetime import datetime, timedelta
import json
import os
import sys

# PATH HACK: Ensure we can import from project root
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
if project_root not in sys.path:
    sys.path.append(project_root)

from backend.sovereignty.visual_assets import VisualAssetsBuilder

class SovereigntySimulator:
    MERIT_THRESHOLD = 60
    
    def initiate_dispute(self, user_merit=75, emotional_state="calm"):
        """Simulates POST /disputes/initiate"""
        
        # Scenario 1: Cooling off needed (Safety)
        if emotional_state == "angry":
            return self._cooling_off_response()
        
        # Scenario 2: Low merit - needs structure (Justice)
        if user_merit < self.MERIT_THRESHOLD:
            return self._structured_form_response()
        
        # Scenario 3: Normal proceeding (Clarity)
        return self._normal_proceeding_response()
    
    def _cooling_off_response(self):
        """Returns Sovereign Halt (Protective)"""
        unlock_time = (datetime.now() + timedelta(hours=2)).isoformat()
        
        # Use centralized builder for visual assets
        assets = VisualAssetsBuilder.for_cooling_off(
            dispute_id="SIM-123", # Simulated ID
            unlock_time=unlock_time
        )
        
        return {
            "status": "sovereign_halt",
            "dignity_preserved": True,
            "code": "DIGNITY_COOLING_OFF",
            "verdict": {
                "title_ar": "هدنة مؤقتة",
                "title_en": "Temporary Pause",
                "body_ar": "النظام يفرض فترة انتظار لحماية جودة القرار.",
                "body_en": "The system mandates a waiting period to ensure quality of decision.",
                "unlocks_at": unlock_time,
                "guidance": "نقترح مراجعة الأدلة المتاحة قبل إعادة المحاولة"
            },
            "visual_assets": assets,
            "metadata": { "reason": "emotional_dampening" }
        }
    
    def _structured_form_response(self):
        """Returns Sovereign Conditional (Educational)"""
        assets = VisualAssetsBuilder.for_conditional(dispute_id="SIM-456")
        
        return {
            "status": "sovereign_conditional",
            "dignity_preserved": True,
            "code": "STRUCTURED_FORM_REQUIRED",
            "requirements": [
                { "type": "document", "min_count": 2, "description": "إثبات واقعة" }
            ],
            "visual_assets": assets
        }
    
    def _normal_proceeding_response(self):
        """Returns Sovereign Proceeding (Judicial)"""
        assets = VisualAssetsBuilder.for_proceeding(dispute_id="SIM-789")
        
        return {
            "status": "sovereign_proceeding",
            "dignity_preserved": True,
            "code": "JUDICIAL_PROCESS_INITIATED",
            "phase": "JUDICIAL_REVIEW",
            "estimated_wait": "PROTECTIVE_48_HOURS",
            "visual_assets": assets
        }

if __name__ == "__main__":
    sim = SovereigntySimulator()
    print("=== TEST 1: ANGRY USER (Should Halt) ===")
    print(json.dumps(sim.initiate_dispute(emotional_state="angry"), indent=2, ensure_ascii=False))
    
    print("\n=== TEST 2: LOW MERIT USER (Should Condition) ===")
    print(json.dumps(sim.initiate_dispute(user_merit=40, emotional_state="calm"), indent=2, ensure_ascii=False))

    print("\n=== TEST 3: NORMAL USER (Should Proceed) ===")
    print(json.dumps(sim.initiate_dispute(user_merit=80, emotional_state="calm"), indent=2, ensure_ascii=False))
