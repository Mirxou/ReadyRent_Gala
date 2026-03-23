import openai
import json
from django.conf import settings
from rest_framework.exceptions import ValidationError

class AIContractService:
    @staticmethod
    def transcribe_audio(audio_file):
        """
        Transcribes audio using OpenAI Whisper.
        """
        if not settings.OPENAI_API_KEY:
            raise ValidationError("OpenAI API Key is not configured.")
            
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        try:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            return transcript
        except Exception as e:
            raise ValidationError(f"Transcription failed: {str(e)}")

    @staticmethod
    def extract_contract_terms(transcript):
        """
        Extracts structured contract terms using GPT-4.
        """
        if not settings.OPENAI_API_KEY:
            raise ValidationError("OpenAI API Key is not configured.")
            
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        system_prompt = """
        You are an AI Legal Assistant for a P2P rental platform (ReadyRent).
        Your job is to extract strict contract terms from a verbal agreement transcript.
        
        Return ONLY valid JSON with the following structure:
        {
            "agreed_price": number (in DZD),
            "rental_duration_days": number,
            "return_date": "YYYY-MM-DD" (calculate if relative date mentioned, or null),
            "items_included": [list of strings],
            "penalties_agreed": string (summary of penalties mentioned),
            "notes": string (any other important conditions)
        }
        If a field is not mentioned, use null.
        """
        
        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Transcript: {transcript}"}
                ],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            raise ValidationError(f"Term extraction failed: {str(e)}")

    @classmethod
    def process_agreement(cls, audio_file):
        """
        Orchestrates the full pipeline: Audio -> Text -> Struct.
        """
        transcript = cls.transcribe_audio(audio_file)
        terms = cls.extract_contract_terms(transcript)
        return transcript, terms
