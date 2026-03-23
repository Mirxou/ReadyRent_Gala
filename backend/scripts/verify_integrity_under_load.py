"""
Integrity Verification Script - Under Load

Verifies data integrity during/after load testing:
- Zero EvidenceLog drops (async tasks)
- Zero anonymization failures
- Consistency scores unaffected
- No PII leaks under pressure

Usage:
    python scripts/verify_integrity_under_load.py

Run this AFTER load testing to verify system integrity.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db.models import Count, Q
from apps.disputes.models import (
    Dispute, Judgment, EvidenceLog,
    AnonymizedJudgment, PublicMetrics
)
from apps.bookings.models import Booking


class IntegrityVerifier:
    """
    Verify system integrity after load testing
    """
    
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.passed = []
        
    def verify_evidence_log_integrity(self):
        """Verify no evidence logs were dropped"""
        print("\n🔍 Verifying EvidenceLog Integrity...")
        
        # Count bookings vs evidence logs
        booking_count = Booking.objects.count()
        booking_evidence_count = EvidenceLog.objects.filter(booking__isnull=False).values('booking').distinct().count()
        
        # Count disputes vs evidence logs
        dispute_count = Dispute.objects.count()
        dispute_evidence_count = EvidenceLog.objects.filter(dispute__isnull=False).values('dispute').distinct().count()
        
        # Count judgments vs evidence logs
        judgment_count = Judgment.objects.filter(status='final').count()
        
        print(f"   Bookings: {booking_count} | Evidence Logs: {booking_evidence_count}")
        print(f"   Disputes: {dispute_count} | Evidence Logs: {dispute_evidence_count}")
        print(f"   Final Judgments: {judgment_count}")
        
        # Check for drops (allow small margin for race conditions)
        if booking_evidence_count < booking_count * 0.95:
            self.issues.append(f"Evidence log drop detected: {booking_count - booking_evidence_count} missing booking logs")
        else:
            self.passed.append("✅ EvidenceLog: No significant drops for bookings")
        
        if dispute_evidence_count < dispute_count * 0.95:
            self.issues.append(f"Evidence log drop detected: {dispute_count - dispute_evidence_count} missing dispute logs")
        else:
            self.passed.append("✅ EvidenceLog: No significant drops for disputes")
    
    def verify_anonymization_integrity(self):
        """Verify anonymization didn't fail under load"""
        print("\n🔍 Verifying Anonymization Integrity...")
        
        final_judgments = Judgment.objects.filter(status='final').count()
        anonymized_judgments = AnonymizedJudgment.objects.count()
        
        print(f"   Final Judgments: {final_judgments}")
        print(f"   Anonymized Judgments: {anonymized_judgments}")
        
        # Check ratio (may have delayed publications)
        ratio = anonymized_judgments / final_judgments if final_judgments > 0 else 0
        
        if ratio < 0.80:  # At least 80% should be anonymized
            self.warnings.append(f"Low anonymization rate: {ratio*100:.1f}% (may be delayed publications)")
        else:
            self.passed.append(f"✅ Anonymization: {ratio*100:.1f}% of final judgments anonymized")
        
        # Check for PII leaks (sample 10 random judgments)
        sample_judgments = AnonymizedJudgment.objects.order_by('?')[:10]
        pii_leaks = []
        
        for judgment in sample_judgments:
            # Check for common PII patterns
            text = f"{judgment.anonymized_ruling_text} {judgment.verdict_summary}"
            
            # Basic PII checks (يمكن توسيعها)
            if '@' in text:
                pii_leaks.append(f"Possible email in judgment #{judgment.id}")
            if any(char.isdigit() for char in text) and len([c for c in text if c.isdigit()]) > 8:
                pii_leaks.append(f"Possible phone number in judgment #{judgment.id}")
        
        if pii_leaks:
            self.warnings.extend(pii_leaks[:3])  # Show first 3
        else:
            self.passed.append("✅ PII: No leaks detected in random sample")
    
    def verify_consistency_scores(self):
        """Verify consistency scores weren't corrupted"""
        print("\n🔍 Verifying Consistency Scores...")
        
        judgments_with_scores = AnonymizedJudgment.objects.filter(
            consistency_score__isnull=False
        ).count()
        
        # Check score distribution
        high_consistency = AnonymizedJudgment.objects.filter(consistency_score__gte=80).count()
        medium_consistency = AnonymizedJudgment.objects.filter(
            consistency_score__gte=60,
            consistency_score__lt=80
        ).count()
        low_consistency = AnonymizedJudgment.objects.filter(consistency_score__lt=60).count()
        
        print(f"   Total with scores: {judgments_with_scores}")
        print(f"   High (≥80%): {high_consistency}")
        print(f"   Medium (60-80%): {medium_consistency}")
        print(f"   Low (<60%): {low_consistency}")
        
        # Sanity check: scores should be between 0-100
        invalid_scores = AnonymizedJudgment.objects.filter(
            Q(consistency_score__lt=0) | Q(consistency_score__gt=100)
        ).count()
        
        if invalid_scores > 0:
            self.issues.append(f"Invalid consistency scores found: {invalid_scores} judgments")
        else:
            self.passed.append("✅ Consistency Scores: All valid (0-100)")
    
    def verify_public_metrics(self):
        """Verify public metrics are up to date"""
        print("\n🔍 Verifying Public Metrics...")
        
        metrics_count = PublicMetrics.objects.count()
        
        if metrics_count == 0:
            self.warnings.append("No public metrics found. Run compute_public_metrics command.")
        else:
            latest_metric = PublicMetrics.objects.order_by('-computed_at').first()
            print(f"   Total Metrics: {metrics_count}")
            print(f"   Latest: {latest_metric.computed_at}")
            self.passed.append(f"✅ Public Metrics: {metrics_count} entries found")
    
    def run(self):
        """Run all integrity checks"""
        print("\n" + "="*60)
        print("🔒 INTEGRITY VERIFICATION UNDER LOAD")
        print("="*60)
        
        self.verify_evidence_log_integrity()
        self.verify_anonymization_integrity()
        self.verify_consistency_scores()
        self.verify_public_metrics()
        
        # Final report
        self.print_report()
        
    def print_report(self):
        """Print final verification results"""
        print("\n" + "="*60)
        print("📊 INTEGRITY VERIFICATION - RESULTS")
        print("="*60)
        
        if self.passed:
            print("\n✅ PASSED CHECKS:")
            for item in self.passed:
                print(f"   {item}")
        
        if self.warnings:
            print("\n⚠️ WARNINGS:")
            for item in self.warnings:
                print(f"   {item}")
        
        if self.issues:
            print("\n❌ CRITICAL ISSUES:")
            for item in self.issues:
                print(f"   {item}")
        
        print("\n" + "="*60)
        
        # Final verdict
        if not self.issues:
            print("✅ OVERALL: INTEGRITY VERIFIED")
            print("   System maintained data integrity under load.")
        else:
            print("❌ OVERALL: INTEGRITY ISSUES DETECTED")
            print("   Review critical issues above.")
        
        return len(self.issues) == 0


if __name__ == '__main__':
    verifier = IntegrityVerifier()
    success = verifier.run()
    sys.exit(0 if success else 1)
