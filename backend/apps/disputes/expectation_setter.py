"""
Expectation Setting Service for Phase 23: Public Transparency

Sovereign Safeguard #4: Use scenario language, NOT raw percentages.

Instead of "60% favor owner", say:
"In similar cases with photo evidence, outcomes typically favor the owner"
"""
from typing import Dict, List, Optional
from decimal import Decimal

from django.db.models import Count, Q, Avg
from django.utils import timezone

from apps.disputes.models import AnonymizedJudgment
from apps.products.models import Product


class ExpectationSetter:
    """
    Generate context-rich outcome expectations for users.
    
    Sovereign Principle: Manage expectations WITHOUT creating entitlement.
    """
    
    @staticmethod
    def get_booking_expectations(product: Product) -> Dict:
        """
        Generate pre-booking expectation widget.
        
        Shows typical outcomes for this category BEFORE booking.
        
        Args:
            product: Product being considered for booking
        
        Returns:
            Dict with scenario-based expectations
        """
        category = product.category.name if product.category else "Unknown"
        
        # Get published judgments for this category
        similar_cases = AnonymizedJudgment.objects.filter(
            category__icontains=category,
            published_at__isnull=False
        ).exclude(
            publication_delayed_until__gt=timezone.now().date()
        )
        
        total_cases = similar_cases.count()
        
        if total_cases < 3:
            # Not enough data for meaningful expectations
            return {
                'has_data': False,
                'message': {
                    'ar': f"لا توجد بيانات كافية عن نزاعات {category} حتى الآن",
                    'en': f"Not enough dispute data for {category} yet"
                },
                'advice': {
                    'ar': "نصيحة: وثق حالة المنتج بالصور عند الاستلام والإرجاع",
                    'en': "Tip: Document product condition with photos at pickup and return"
                }
            }
        
        # Analyze verdict distribution
        verdict_counts = similar_cases.values('verdict').annotate(count=Count('id'))
        
        # Analyze evidence patterns
        evidence_patterns = ExpectationSetter._analyze_evidence_patterns(similar_cases)
        
        # Generate scenario-based language
        scenarios = ExpectationSetter._generate_scenarios(
            category, verdict_counts, evidence_patterns, total_cases
        )
        
        return {
            'has_data': True,
            'category': category,
            'total_cases': total_cases,
            'scenarios': scenarios,
            'general_advice': {
                'ar': "نصيحة عامة: الأدلة الجيدة تحسم القضايا، وليس الإحصائيات",
                'en': "General advice: Good evidence decides cases, not statistics"
            }
        }
    
    @staticmethod
    def get_dispute_warning(booking_id: int, dispute_category: str) -> Dict:
        """
        Generate pre-dispute warning with similar cases.
        
        Shows user similar cases BEFORE escalating to dispute.
        
        Args:
            booking_id: ID of booking in question
            dispute_category: Type of dispute (damage, non_delivery, etc.)
        
        Returns:
            Dict with similar cases and realistic expectations
        """
        # Find similar cases
        similar_cases = AnonymizedJudgment.objects.filter(
            dispute_type__icontains=dispute_category,
            published_at__isnull=False
        ).exclude(
            publication_delayed_until__gt=timezone.now().date()
        ).order_by('-consistency_score')[:5]
        
        total_similar = similar_cases.count()
        
        if total_similar == 0:
            return {
                'has_similar_cases': False,
                'message': {
                    'ar': f"لم يتم العثور على قضايا مشابهة لـ {dispute_category}",
                    'en': f"No similar cases found for {dispute_category}"
                },
                'recommendation': {
                    'ar': "توصية: حاول التفاوض المباشر مع الطرف الآخر أولاً",
                    'en': "Recommendation: Try direct negotiation with the other party first"
                }
            }
        
        # Analyze what made cases successful
        success_factors = ExpectationSetter._analyze_success_factors(similar_cases)
        
        return {
            'has_similar_cases': True,
            'total_similar': total_similar,
            'success_factors': success_factors,
            'realistic_expectation': {
                'ar': "التوقع الواقعي: النتيجة ستعتمد على جودة أدلتك",
                'en': "Realistic expectation: Outcome will depend on quality of your evidence"
            },
            'alternative': {
                'ar': "البديل: التسوية الودية أسرع وأقل تكلفة من النزاع الرسمي",
                'en': "Alternative: Friendly settlement is faster and less costly than formal dispute"
            }
        }
    
    @staticmethod
    def _analyze_evidence_patterns(judgments) -> Dict:
        """
        Analyze which evidence types appear in judgments.
        """
        evidence_counter = {}
        
        for judgment in judgments:
            for evidence_type in judgment.evidence_types:
                evidence_counter[evidence_type] = evidence_counter.get(evidence_type, 0) + 1
        
        total = judgments.count()
        
        # Convert to percentages and sort
        patterns = []
        for evidence_type, count in sorted(evidence_counter.items(), key=lambda x: x[1], reverse=True):
            patterns.append({
                'type': evidence_type,
                'frequency': round((count / total * 100), 0) if total > 0 else 0
            })
        
        return patterns
    
    @staticmethod
    def _generate_scenarios(category: str, verdict_counts, evidence_patterns, total: int) -> List[Dict]:
        """
        Generate scenario-based language from statistics.
        
        Sovereign Safeguard: NO raw percentages, use descriptive language.
        """
        scenarios = []
        
        # Convert verdict counts to scenarios
        verdicts = {item['verdict']: item['count'] for item in verdict_counts}
        
        owner_count = verdicts.get('favor_owner', 0)
        renter_count = verdicts.get('favor_renter', 0)
        partial_count = verdicts.get('partial', 0)
        
        owner_pct = (owner_count / total * 100) if total > 0 else 0
        renter_pct = (renter_count / total * 100) if total > 0 else 0
        
        # Scenario 1: Dominant pattern
        if owner_pct > 60:
            scenarios.append({
                'situation': {
                    'ar': f"عندما يكون لديك أدلة صورية واضحة على الضرر في {category}",
                    'en': f"When you have clear photo evidence of damage to {category}"
                },
                'typical_outcome': {
                    'ar': "النتيجة المعتادة: يميل الحكم لصالح المالك إذا كانت الأدلة قوية",
                    'en': "Typical outcome: Ruling tends to favor owner if evidence is strong"
                },
                'counterexample': {
                    'ar': "ولكن: إذا كان الضرر غير موثق أو غامض، قد تختلف النتيجة",
                    'en': "But: If damage is undocumented or ambiguous, outcome may differ"
                }
            })
        elif renter_pct > 60:
            scenarios.append({
                'situation': {
                    'ar': f"عندما تكون لديك إيصالات رسمية ومستندات في {category}",
                    'en': f"When you have official receipts and documentation for {category}"
                },
                'typical_outcome': {
                    'ar': "النتيجة المعتادة: يميل الحكم لصالح المستأجر إذا كانت المستندات كاملة",
                    'en': "Typical outcome: Ruling tends to favor renter if documentation is complete"
                },
                'counterexample': {
                    'ar': "ولكن: إذا كانت المستندات ناقصة أو متناقضة، قد تختلف النتيجة",
                    'en': "But: If documentation is incomplete or contradictory, outcome may differ"
                }
            })
        else:
            # Balanced
            scenarios.append({
                'situation': {
                    'ar': f"نزاعات {category} متنوعة ولا يوجد نمط واحد",
                    'en': f"{category} disputes are varied with no single pattern"
                },
                'typical_outcome': {
                    'ar': "النتيجة المعتادة: تعتمد بشكل كبير على جودة الأدلة المقدمة من الطرفين",
                    'en': "Typical outcome: Heavily depends on quality of evidence from both parties"
                },
                'counterexample': {
                    'ar': "كل قضية فريدة: الأدلة القوية تحسم النتيجة، وليس الإحصائيات",
                    'en': "Each case is unique: Strong evidence decides, not statistics"
                }
            })
        
        # Scenario 2: Evidence importance
        if evidence_patterns:
            top_evidence = evidence_patterns[0]
            scenarios.append({
                'situation': {
                    'ar': f"عندما تقدم أدلة من نوع '{top_evidence['type']}'",
                    'en': f"When you submit '{top_evidence['type']}' evidence"
                },
                'typical_outcome': {
                    'ar': f"هذا النوع شائع في {int(top_evidence['frequency'])}% من القضايا، لكن الجودة أهم من النوع",
                    'en': f"This type appears in {int(top_evidence['frequency'])}% of cases, but quality matters more than type"
                },
                'counterexample': {
                    'ar': "تنبيه: الأدلة الشائعة ليست دائماً الأكثر فعالية",
                    'en': "Note: Common evidence isn't always most effective"
                }
            })
        
        return scenarios
    
    @staticmethod
    def _analyze_success_factors(judgments) -> List[Dict]:
        """
        Identify what made similar cases successful.
        """
        factors = []
        
        # Factor 1: Evidence quality
        high_evidence_cases = [j for j in judgments if len(j.evidence_types) >= 2]
        if len(high_evidence_cases) > len(judgments) * 0.6:
            factors.append({
                'factor': {
                    'ar': "أدلة متعددة",
                    'en': "Multiple evidence types"
                },
                'importance': {
                    'ar': "القضايا الناجحة عادة تحتوي على نوعين أو أكثر من الأدلة",
                    'en': "Successful cases usually have 2+ types of evidence"
                },
                'advice': {
                    'ar': "نصيحة: اجمع صور + عقد + شهود إن أمكن",
                    'en': "Tip: Collect photos + contract + witnesses if possible"
                }
            })
        
        # Factor 2: Consistency
        avg_consistency = sum(j.consistency_score for j in judgments) / len(judgments) if judgments else 0
        if avg_consistency > 70:
            factors.append({
                'factor': {
                    'ar': "حالات مشابهة كثيرة",
                    'en': "Many similar cases"
                },
                'importance': {
                    'ar': "هذا النوع من النزاع له سوابق واضحة",
                    'en': "This dispute type has clear precedents"
                },
                'advice': {
                    'ar': "نصيحة: النتيجة قابلة للتوقع إذا كانت أدلتك مشابهة للسوابق",
                    'en': "Tip: Outcome is predictable if your evidence matches precedents"
                }
            })
        else:
            factors.append({
                'factor': {
                    'ar': "حالات فريدة",
                    'en': "Unique cases"
                },
                'importance': {
                    'ar': "هذا النوع من النزاع نادر ولا توجد سوابق كثيرة",
                    'en': "This dispute type is rare with few precedents"
                },
                'advice': {
                    'ar': "نصيحة: النتيجة أقل قابلية للتوقع، فكر في التسوية الودية",
                    'en': "Tip: Outcome less predictable, consider friendly settlement"
                }
            })
        
        return factors
