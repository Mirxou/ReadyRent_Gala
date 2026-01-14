"""
Services for Review app - Sentiment Analysis
"""
import os
from django.conf import settings
from decimal import Decimal
import openai


class SentimentAnalysisService:
    """Service for analyzing review sentiment using OpenAI API"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY', '')
        self.client = None
        if self.api_key:
            try:
                self.client = openai.OpenAI(api_key=self.api_key)
            except Exception as e:
                print(f"Error initializing OpenAI client: {e}")
    
    def analyze_sentiment(self, text: str) -> dict:
        """
        Analyze sentiment of review text
        
        Returns:
            {
                'score': float (-1 to 1, where -1 is negative, 0 is neutral, 1 is positive),
                'label': str ('positive', 'neutral', 'negative')
            }
        """
        if not self.client:
            # Fallback to simple rule-based sentiment if OpenAI not available
            return self._simple_sentiment_analysis(text)
        
        try:
            # Use OpenAI to analyze sentiment
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a sentiment analysis expert. Analyze the sentiment of Arabic or English text.
                        Return a JSON object with:
                        - score: a number between -1 (very negative) and 1 (very positive)
                        - label: one of "positive", "neutral", or "negative"
                        
                        Examples:
                        - "المنتج رائع وممتاز" -> {"score": 0.9, "label": "positive"}
                        - "المنتج جيد" -> {"score": 0.5, "label": "neutral"}
                        - "المنتج سيء جداً" -> {"score": -0.8, "label": "negative"}"""
                    },
                    {
                        "role": "user",
                        "content": f"Analyze the sentiment of this review text: {text}"
                    }
                ],
                temperature=0.3,
                max_tokens=100,
            )
            
            import json
            result_text = response.choices[0].message.content.strip()
            # Try to parse JSON from response
            if result_text.startswith('```json'):
                result_text = result_text.replace('```json', '').replace('```', '').strip()
            elif result_text.startswith('```'):
                result_text = result_text.replace('```', '').strip()
            
            result = json.loads(result_text)
            return {
                'score': Decimal(str(result.get('score', 0))),
                'label': result.get('label', 'neutral')
            }
        except Exception as e:
            print(f"Error in OpenAI sentiment analysis: {e}")
            # Fallback to simple analysis
            return self._simple_sentiment_analysis(text)
    
    def _simple_sentiment_analysis(self, text: str) -> dict:
        """
        Simple rule-based sentiment analysis as fallback
        """
        text_lower = text.lower()
        
        # Arabic positive words
        positive_words_ar = ['رائع', 'ممتاز', 'جميل', 'جيد', 'مشكور', 'شكراً', 'احسن', 'افضل', 'نظيف', 'انيق']
        # Arabic negative words
        negative_words_ar = ['سيء', 'رديء', 'مش', 'لا', 'مشكلة', 'تالف', 'قذر', 'قديم', 'مكسر']
        
        # English positive/negative words
        positive_words_en = ['great', 'excellent', 'good', 'nice', 'beautiful', 'amazing', 'wonderful', 'perfect', 'love', 'best']
        negative_words_en = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'disappointed', 'poor', 'broken', 'dirty']
        
        positive_count = sum(1 for word in positive_words_ar + positive_words_en if word in text_lower)
        negative_count = sum(1 for word in negative_words_ar + negative_words_en if word in text_lower)
        
        if positive_count > negative_count:
            score = min(0.8, 0.3 + (positive_count * 0.1))
            label = 'positive'
        elif negative_count > positive_count:
            score = max(-0.8, -0.3 - (negative_count * 0.1))
            label = 'negative'
        else:
            score = Decimal('0')
            label = 'neutral'
        
        return {
            'score': Decimal(str(score)),
            'label': label
        }

