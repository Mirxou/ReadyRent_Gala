
"""
المحاكمة الدستورية للنظام - التجربة الأولى
Constitutional Trial of the System - Phase 31
"""
import pytest
import json
from django.test import TestCase, Client
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.disputes.models import Dispute

class TestSovereignConstitutionalCompliance(TestCase):
    """المحاكمة الدستورية - هل النظام يحكم أم يخادع؟"""
    
    def setUp(self):
        """إعداد بيئة المحاكمة"""
        self.client = Client()
        
        # خلق مستخدم تجريبي مع جدارة عالية (لتجاوز الفحص التلقائي)
        self.user = User.objects.create_user(
            username="trial_citizen",
            email="test@trial.com",
            password="test123",
            merit_score=75
        )
        
        # تسجيل الدخول
        self.client.force_login(self.user)
        
        # قضية تجريبية
        self.dispute = Dispute.objects.create(
            user=self.user,
            title="TEST-CONTRACT-001",
            status="filed"
        )
    
    # ========== الاختبار 1: حارس البوابة (Middleware Enforcer) ==========
    
    def test_middleware_enforces_dignity_flag(self):
        """
        الاختبار 1: حارس البوابة
        هل يضمن الـ Middleware وجود العلم dignity_preserved في كل رد؟
        """
        # تنفيذ طلب مشروع (هادئ)
        response = self.client.post('/api/v1/judicial/disputes/initiate/', {
            'emotional_state': 'calm'
        }, content_type='application/json')
        
        data = response.json()
        
        # التحقق الدستوري
        assert 'dignity_preserved' in data, "❌ Middleware failed to inject dignity_preserved flag"
        assert data['dignity_preserved'] is True, "❌ Dignity was not preserved in response"
        assert data['status'].startswith('sovereign_'), f"❌ Response status is not sovereign: {data['status']}"

    # ========== الاختبار 2: ذاكرة الغضب (Memory of Anger) ==========
    
    def test_emotional_lock_persists_in_database(self):
        """
        الاختبار 2: ذاكرة الغضب
        هل يتذكر النظام حالة الغضب في قاعدة البيانات ويمنع التجاوز؟
        """
        # 1. محاكاة مستخدم غاضب
        response = self.client.post('/api/v1/judicial/disputes/initiate/', {
            'emotional_state': 'angry'
        }, content_type='application/json')
        
        data = response.json()
        assert data['status'] == 'sovereign_halt'
        
        # 2. فحص الداتابيز: هل تم القفل فعلاً؟
        self.user.refresh_from_db()
        assert self.user.emotional_lock_until is not None, "❌ القفل غير موجود في قاعدة البيانات!"
        assert self.user.emotional_lock_until > timezone.now(), "❌ القفل ليس في المستقبل!"
        
        # 3. محاولة "التحايل" (ادعاء الهدوء فوراً)
        response_cheat = self.client.post('/api/v1/judicial/disputes/initiate/', {
            'emotional_state': 'calm'
        }, content_type='application/json')
        
        data_cheat = response_cheat.json()
        # يجب أن يرفض النظام بناءً على القفل المحفوظ
        assert data_cheat['status'] == 'sovereign_halt'
        assert data_cheat['code'] == 'DIGNITY_COOLING_OFF'
        
        # 4. فحص انتهاء القفل
        self.user.emotional_lock_until = timezone.now() - timedelta(minutes=1)
        self.user.save()
        
        response_free = self.client.post('/api/v1/judicial/disputes/initiate/', {
            'emotional_state': 'calm'
        }, content_type='application/json')
        
        # بما أن الجدارة 75، يجب أن يمر الطلب الآن
        assert response_free.json()['status'] == 'sovereign_proceeding'

    # ========== الاختبار 3: ختم الدولة (Visual Seal) ==========
    
    def test_visual_assets_standardization(self):
        """
        الاختبار 3: ختم الدولة
        هل يولد الـ Builder الأصول المرئية بشكل صحيح ومنظم؟
        """
        # استخدام الحالة الغاضبة لاختبار ختم SHIELD_SILVER (الخاص بالـ Halt)
        response = self.client.post('/api/v1/judicial/disputes/initiate/', {
            'emotional_state': 'angry'
        }, content_type='application/json')
        
        data = response.json()
        assert 'visual_assets' in data, "❌ visual_assets مفقودة!"
        
        assets = data['visual_assets']
        assert assets['mode'] == 'DISPUTE'
        assert assets['seal']['type'] == 'SHIELD_SILVER'
        assert len(assets['receipt']['stages']) > 0
        
        # التأكد من صحة الـ Mode
        valid_modes = ['MARKET', 'DISPUTE', 'VERDICT']
        assert assets['mode'] in valid_modes
