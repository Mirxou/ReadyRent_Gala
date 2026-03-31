import structlog
import openai
import json
from django.conf import settings
from .models import Booking, SmartAgreement

logger = structlog.get_logger("bookings.agreement")

class AgreementService:
    """
    The Contract Engine.
    Uses Whisper ASR and GPT-4 to manufacture the Smart Agreement.
    """
    
    @staticmethod
    def create_agreement(booking_id: int, raw_text: str = "", audio_file = None) -> SmartAgreement:
        """
        Orchestrates the pipeline: Input -> Transcription -> Analysis -> Agreement.
        """
        # Configure OpenAI
        if hasattr(settings, 'OPENAI_API_KEY'):
            openai.api_key = settings.OPENAI_API_KEY
        
        booking = Booking.objects.get(id=booking_id)
        agreement, _ = SmartAgreement.objects.get_or_create(booking=booking)
        
        full_text = raw_text

        # 1. Speech-to-Text (Whisper)
        if audio_file:
            # Save audio file to agreement first to have it on disk/storage
            agreement.audio_file = audio_file
            agreement.save()
            
            # If the file is stored locally, we can open it. 
            # If using S3/storage, might need to download or handle differently.
            # Assuming local dev environment for now or standard file access.
            try:
                # Open the file from its storage path if possible, or read from memory if it's small/available
                # For safety with Django FileFields, best to use the path if available or the file object directly if OpenAI supports it.
                # OpenAI Python lib supports reading from file-like objects.
                agreement.audio_file.open('rb')
                response = openai.Audio.transcribe(model="whisper-1", file=agreement.audio_file)
                transcript = response.get('text', '')
                full_text = f"{transcript} {raw_text}".strip()
                agreement.audio_file.close()
            except Exception as e:
                logger.error(
                    "whisper_transcription_failed",
                    booking_id=booking.id,
                    error=str(e),
                    exc_info=True
                )
                # Fallback or continue with just raw_text
                full_text = f"[Transcription Failed] {raw_text}".strip()

        # Update raw text in model
        agreement.raw_text = full_text
        agreement.save()

        # 2. GPT-4 Analysis (The Brain)
        try:
            prompt = f"""
            انت محامي قانوني خبير. استخرج من النص التالي:
            1. سعر الإيجار (بالدينار الجزائري).
            2. موعد الاستلام النهائي.
            3. أي شروط خاصة للإرجاع أو الأضرار.
            
            النص:
            {full_text}
            
            أجب بتنسيق JSON فقط:
            {{"price": 0, "deadline": "", "terms": ""}}
            """
            
            # Use ChatCompletion (Correct for current OpenAI Libs)
            # Utilizing gpt-4 or gpt-3.5-turbo if 4 is not available/costly, but user asked for GPT-4.
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "أنت مساعد قانوني دقيق."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content_json = response.choices[0].message['content']
            
            # Clean up partial JSON markdown if present
            if "```json" in content_json:
                content_json = content_json.split("```json")[1].split("```")[0].strip()
            elif "```" in content_json:
                content_json = content_json.split("```")[1].strip()

            agreement_data = json.loads(content_json)
        
        except Exception as e:
            logger.error(
                "gpt4_analysis_failed",
                booking_id=booking.id,
                error=str(e),
                exc_info=True
            )
            agreement_data = {"terms": "تعذر التحليل، يرجى المراجعة اليدوية.", "error": str(e)}

        # 3. Save Structured Data and Contract Text
        agreement.structured_terms = agreement_data
        
        # Map 'terms' or summary to contract_text for display
        agreement.contract_text = agreement_data.get('terms', full_text)  
        
        agreement.save()

        return agreement

    @staticmethod
    def generate_contract_text(agreement: SmartAgreement) -> SmartAgreement:
        # Legacy/Helper method if needed, but logic is now in create_agreement
        return agreement
