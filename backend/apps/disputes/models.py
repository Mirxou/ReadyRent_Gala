"""
Dispute models for ReadyRent.Gala
"""
from django.db import models
from django.db.models import F
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import hashlib
import json


class Dispute(models.Model):
    """Dispute model"""
    STATUS_CHOICES = [
        ('open', _('Open (Legacy Alias)')),
        ('filed', _('Filed (Pending Admissibility)')),
        ('admissible', _('Admissible (Discovery Open)')),
        ('inadmissible', _('Inadmissible (Rejected)')),
        ('under_review', _('Under Review (Deliberation)')),
        ('judgment_provisional', _('Judgment Provisional')),
        ('judgment_final', _('Judgment Final')),
        ('resolved', _('Resolved (Legacy Alias)')),
        ('closed', _('Closed')),
    ]
    
    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='disputes',
        verbose_name=_('user'))
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='disputes', null=True, blank=True,
        verbose_name=_('booking'))
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'))
    status = models.CharField(_('status'), max_length=50, choices=STATUS_CHOICES, default='filed')
    priority = models.CharField(_('priority'), max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Financials
    claimed_amount = models.DecimalField(_('Claimed Amount'), max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Admissibility Gate (Founder's Refinement)
    # Why is this dispute valid? (e.g. "Within 24h cooling window", "Smart Agreement #123 Valid")
    admissibility_report = models.JSONField(_('Admissibility Report'), default=dict, blank=True)
    inadmissible_reason = models.TextField(_('Rejection Reason'), blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_disputes',
        verbose_name=_('assigned_to'))
    
    # Phase 2: Sovereign Routing
    judicial_panel = models.ForeignKey(
        'JudicialPanel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disputes',
        verbose_name=_('Judicial Panel')
    )

    resolution = models.TextField(_('resolution'), blank=True)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_disputes',
        verbose_name=_('resolved_by'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الخلاف')
        verbose_name_plural = _('الخلافات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'priority']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"

    @staticmethod
    def canonical_status(status):
        return {
            'open': 'filed',
            'resolved': 'closed',
        }.get(status, status)

    @property
    def assigned_panel(self):
        return self.judicial_panel

    @assigned_panel.setter
    def assigned_panel(self, value):
        self.judicial_panel = value


class DisputeMessage(models.Model):
    """Messages in dispute conversation"""
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='messages',
        verbose_name=_('dispute'))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dispute_messages',
        verbose_name=_('user'))
    message = models.TextField(_('message'))
    attachments = models.JSONField(_('attachments'), default=list, blank=True)
    is_internal = models.BooleanField(_('internal'), default=False, help_text=_('Internal note not visible to user'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('رسالة الخلاف')
        verbose_name_plural = _('رسائل الخلافات')
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message {self.id} - {self.dispute.title}"


class SupportTicket(models.Model):
    """Support ticket system"""
    STATUS_CHOICES = [
        ('open', _('Open')),
        ('in_progress', _('In Progress')),
        ('waiting_customer', _('Waiting for Customer')),
        ('resolved', _('Resolved')),
        ('closed', _('Closed')),
    ]
    
    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets',
        verbose_name=_('user'))
    subject = models.CharField(_('subject'), max_length=200)
    description = models.TextField(_('description'))
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(_('priority'), max_length=20, choices=PRIORITY_CHOICES, default='medium')
    category = models.CharField(_('category'), max_length=50, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name=_('assigned_to'))
    resolution = models.TextField(_('resolution'), blank=True)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('تذكرة الدعم')
        verbose_name_plural = _('تذاكر الدعم')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'priority']),
        ]
    
    def __str__(self):
        return f"{self.subject} - {self.user.email}"


class TicketMessage(models.Model):
    """Messages in support ticket"""
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages',
        verbose_name=_('ticket'))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ticket_messages',
        verbose_name=_('user'))
    message = models.TextField(_('message'))
    attachments = models.JSONField(_('attachments'), default=list, blank=True)
    is_internal = models.BooleanField(_('internal'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('رسالة التذكرة')
        verbose_name_plural = _('رسائل التذاكر')
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message {self.id} - {self.ticket.subject}"


class EvidenceLog(models.Model):
    """
    The Evidence Vault (Phase 18).
    Immutable record of events with Historical Context.
    Write-Once, Read-Many.
    """
    # Core Data
    action = models.CharField(_("Event Action"), max_length=100) # e.g. "BOOKING_CREATED", "MESSAGE_SENT"
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='evidence_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Linked Entities (Generic Foreign Key could be used, but direct links are simpler for Phase 18)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='evidence_trail')
    dispute = models.ForeignKey('Dispute', on_delete=models.SET_NULL, null=True, blank=True, related_name='evidence_trail')
    
    # Content & Integrity
    metadata = models.JSONField(_("Event Metadata"), default=dict) # The raw data (e.g. message content, payment ID)
    hash = models.CharField(_("Integrity Hash"), max_length=128, blank=True) # Current log hash
    previous_hash = models.CharField(_("Previous Log Hash"), max_length=128, blank=True, null=True) # Cryptographic link
    
    # The Founder's Refinement: Contextual Truth
    context_snapshot = models.JSONField(
        _("Context Snapshot"), 
        default=dict,
        help_text=_("Versions of Policy, Contract, and Risk Engine at time of event.")
    )
    
    class Meta:
        verbose_name = _('سجل الأدلة')
        verbose_name_plural = _('سجل الأدلة (The Vault)')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['booking', '-timestamp']),  # Hot: admissibility gate (evidence count)
            models.Index(fields=['dispute', '-timestamp']),  # Hot: dispute timeline view
            models.Index(fields=['action', '-timestamp']),   # Analytics/audit queries
            models.Index(fields=['dispute', 'dispute_sequence']), # Integrity chain lookup
        ]
    
    # 🛡️ SOVEREIGN VAULT: Sequence within a dispute for gap detection.
    dispute_sequence = models.PositiveIntegerField(default=0, db_index=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.action} by {self.actor}"

    def generate_integrity_hash(self):
        """
        Generates a BLAKE2b hash of the current log state and its parent.
        🛡️ SOVEREIGN INTEGRITY: Uses stable identifiers (UUIDs/Hashes) instead of Primary Keys.
        """
        payload = {
            "dispute_id": str(self.dispute.id) if self.dispute else None,
            "dispute_sequence": self.dispute_sequence,
            "action": self.action,
            "actor_uuid": str(getattr(self.actor, 'supabase_user_id', None)) if self.actor else None,
            "booking_uuid": str(getattr(self.booking, 'idempotency_key', None)) if self.booking else None,
            "previous_hash": self.previous_hash,
            "metadata_hash": hashlib.blake2b(json.dumps(self.metadata, sort_keys=True).encode()).hexdigest()
        }
        data = json.dumps(payload, sort_keys=True).encode()
        return hashlib.blake2b(data).hexdigest()

    def save(self, *args, **kwargs):
        """
        🛡️ SOVEREIGN IMMUTABILITY: Prevent modification of existing evidence.
        Once a log is committed to the Evidence Vault, it cannot be altered.
        """
        from django.db import transaction
        
        if self.pk:
            # Detect tampering attempts by comparing with DB state
            existing = EvidenceLog.objects.get(pk=self.pk)
            if (existing.hash != self.hash or 
                existing.previous_hash != self.previous_hash or 
                existing.action != self.action or
                existing.dispute_id != self.dispute_id):
                raise ValueError("SECURITY VIOLATION: Evidence Vault records are immutable and cannot be modified.")
            
            # If nothing changed, we still block standard updates just to be safe (WORM)
            super().save(*args, **kwargs)
            return

        # 1. Chain to the anchor (Per-Dispute Latest Log)
        # 🔒 WORM SECURITY: Locking the latest row for THIS dispute to safely determine the anchor and sequence.
        with transaction.atomic():
            latest_log = EvidenceLog.objects.filter(
                dispute=self.dispute
            ).select_for_update().order_by('-dispute_sequence').first()

            if latest_log:
                self.previous_hash = latest_log.hash
                self.dispute_sequence = latest_log.dispute_sequence + 1
            else:
                self.previous_hash = None
                self.dispute_sequence = 0

            # 2. Generate Integrity Hash
            self.hash = self.generate_integrity_hash()
            
            # 3. Final Commit
            super().save(*args, **kwargs)
            latest_log = EvidenceLog.objects.filter(dispute=self.dispute).select_for_update().order_by('-dispute_sequence').first()
            
            if not self.previous_hash:
                if latest_log:
                    self.previous_hash = latest_log.hash
                    self.dispute_sequence = latest_log.dispute_sequence + 1
                else:
                    self.previous_hash = "GENESIS_ANCHOR"
                    self.dispute_sequence = 1
            else:
                # If previous_hash was provided (e.g. from a client-side verification), verify it matches
                if latest_log and self.previous_hash != latest_log.hash:
                    logger.critical(f"Evidence Vault Fork Attempted: dispute {self.dispute.id} expected {latest_log.hash} but got {self.previous_hash}")
                    raise ValueError("Integrity Violation: previous_hash mismatch.")
                self.dispute_sequence = (latest_log.dispute_sequence + 1) if latest_log else 1

            # 2. Seal the current log
            self.hash = self.generate_integrity_hash()
            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """🛡️ SOVEREIGN VAULT: Permanent record integrity enforcement."""
        raise ValueError("CRITICAL: EvidenceLog entries are immutable and cannot be deleted.")

    def update(self, *args, **kwargs):
        """🛡️ SOVEREIGN VAULT: Permanent record integrity enforcement."""
        raise ValueError("CRITICAL: EvidenceLog entries are immutable and cannot be updated.")


class Judgment(models.Model):
    """
    The Verdict.
    Separated from the Dispute to allow for multiple judgments (e.g. Appeals).
    """
    VERDICT_TYPES = [
        ('favor_tenant', _('Favor Tenant')),
        ('favor_renter', _('Favor Renter (Legacy Alias)')),
        ('favor_owner', _('Favor Owner')),
        ('split', _('Split Decision')),
        ('partial', _('Partial Decision (Legacy Alias)')),
        ('dismissed', _('Dismissed')),
    ]

    STATUS_CHOICES = [
        ('provisional', _('Provisional (Appeal Window Open)')),
        ('final', _('Final (Enforceable)')),
        ('overturned', _('Overturned (Void)')),
    ]

    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='judgments',
        verbose_name=_('dispute'))
    
    judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='judgments_authored',
        verbose_name=_('judge')
    )

    verdict = models.CharField(_('verdict'), max_length=20, choices=VERDICT_TYPES)
    ruling_text = models.TextField(_('ruling reasoning'))
    
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='provisional')
    
    # Financial Impact
    awarded_amount = models.DecimalField(_('Awarded Amount'), max_digits=10, decimal_places=2, default=0)
    split_renter_percentage = models.IntegerField(
        _('Split Renter Percentage'),
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(99)],
        help_text=_('Percentage of escrow allocated to renter in a split verdict (1-99)')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    finalized_at = models.DateTimeField(_('finalized at'), null=True, blank=True)

    class Meta:
        verbose_name = _('الحكم')
        verbose_name_plural = _('الأحكام')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['dispute', 'status']),      # Hot: tribunal logic (provisional judgments)
            models.Index(fields=['dispute', '-created_at']), # Hot: latest judgment per dispute (appeals)
            models.Index(fields=['status', '-finalized_at']), # Hot: public ledger filtering
        ]

    def __str__(self):
        return f"Judgment #{self.id} for Dispute #{self.dispute.id} ({self.status})"

    @staticmethod
    def canonical_verdict(verdict):
        return {
            'favor_renter': 'favor_tenant',
            'partial': 'split',
        }.get(verdict, verdict)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        if not is_new:
            try:
                old_status = Judgment.objects.get(pk=self.pk).status
            except Judgment.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        # ─────────────────────────────────────────────────────────────────────────────
        # REFACTORED: Financial Execution via Service Layer (Phase 24)
        # FIXED: Now covers ALL verdict types, not just 'split'.
        # ─────────────────────────────────────────────────────────────────────────────
        if self.status == 'final' and old_status != 'final':
            from apps.disputes.services.adjudication import AdjudicationService
            AdjudicationService.finalize_judgment(self, self.judge)


class Appeal(models.Model):
    """
    The High Court Request.
    A constitutional right to challenge a Provisional Judgment.
    Architecture: One-to-One with Judgment (Graph Node).
    """
    STATUS_CHOICES = [
        ('pending', _('Pending Review')),
        ('granted', _('Granted (Judgment Overturned)')),
        ('rejected', _('Rejected (Judgment Finalized)')),
        ('remanded', _('Remanded (Sent back to Tribunal)')),
    ]

    # One Appeal per Judgment to prevent infinite loops.
    # If overturned, a NEW Judgment node is created.
    judgment = models.OneToOneField(Judgment, on_delete=models.CASCADE, related_name='appeal',
        verbose_name=_('judgment'))
    
    appellant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appeals_filed',
        verbose_name=_('appellant')
    )
    
    reason = models.TextField(_('reason for appeal'), help_text=_('Why is the judgment flawed?'))
    
    # Cost & Skin in the Game (Preventing "Rage Appeals")
    # Future: Link to a specific Bond Transaction
    bond_reference = models.CharField(_('Bond Reference'), max_length=100, blank=True)
    
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # System Impact
    is_fund_frozen = models.BooleanField(_('Funds Frozen?'), default=True, help_text=_('Escrow execution is blocked while pending.'))
    
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appeals_reviewed',
        verbose_name=_('high court judge')
    )
    review_notes = models.TextField(_('review notes'), blank=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('الاستئناف')
        verbose_name_plural = _('الاستئنافات')
        ordering = ['-created_at']

    def __str__(self):
        return f"Appeal against Judgment #{self.judgment.id} by {self.appellant}"


class JudgmentPrecedent(models.Model):
    """
    The Institutional Memory.
    Links a current judgment to historical precedents that influenced it.
    """
    # Current judgment being evaluated
    judgment = models.ForeignKey(
        Judgment,
        on_delete=models.CASCADE,
        related_name='precedents_used',
        verbose_name=_('current judgment')
    )
    
    # Historical judgment used as reference
    precedent = models.ForeignKey(
        Judgment,
        on_delete=models.CASCADE,
        related_name='precedents_cited',
        verbose_name=_('historical precedent')
    )
    
    # Similarity Metrics
    similarity_score = models.FloatField(
        _('Similarity Score'),
        help_text=_('0.0 to 1.0 - How similar are the disputes?')
    )
    
    # Alignment Check
    was_followed = models.BooleanField(
        _('Was Followed?'),
        default=True,
        help_text=_('Did current judgment align with precedent verdict?')
    )
    
    divergence_reason = models.TextField(
        _('Divergence Reason'),
        blank=True,
        help_text=_('Why did we diverge from this precedent?')
    )
    
    created_at = models.DateTimeField(_('linked at'), auto_now_add=True)

    class Meta:
        verbose_name = _('سابقة قضائية')
        verbose_name_plural = _('السوابق القضائية')
        ordering = ['-created_at']
        unique_together = ['judgment', 'precedent']

    def __str__(self):
        return f"Judgment #{self.judgment.id} → Precedent #{self.precedent.id} ({self.similarity_score:.0%})"


class JudicialPanel(models.Model):
    """
    The Delegation System.
    Specialized panels for routine appeals to prevent High Court bottlenecks.
    """
    PANEL_TYPE_CHOICES = [
        ('routine', _('Routine Cases')),
        ('specialized', _('Specialized Domain')),
        ('high_court', _('High Court')),
    ]
    
    name = models.CharField(
        _('Panel Name'),
        max_length=100,
        help_text=_('e.g., "Damage Review Panel", "Timeliness Panel"')
    )
    
    panel_type = models.CharField(
        _('Panel Type'),
        max_length=20,
        choices=PANEL_TYPE_CHOICES,
        default='routine'
    )
    
    description = models.TextField(
        _('Description'),
        help_text=_('What types of cases does this panel handle?')
    )
    
    # Capacity Management
    max_cases_per_week = models.IntegerField(
        _('Weekly Capacity'),
        default=10,
        help_text=_('Maximum active cases this panel can handle')
    )
    
    current_load = models.IntegerField(
        _('Current Load'),
        default=0,
        help_text=_('Number of currently active cases')
    )
    
    # Members
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='judicial_panels',
        verbose_name=_('Panel Members'),
        blank=True
    )
    
    # Rotation tracking
    rotation_date = models.DateField(
        _('Last Rotation'),
        null=True,
        blank=True,
        help_text=_('When panel members were last rotated')
    )
    
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('لجنة قضائية')
        verbose_name_plural = _('اللجان القضائية')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.current_load}/{self.max_cases_per_week})"

    def has_capacity(self):
        """Check if panel can accept new cases"""
        return self.current_load < self.max_cases_per_week and self.is_active
    
    def assign_case(self):
        """Increment current load when case is assigned"""
        self.__class__.objects.filter(pk=self.pk).update(current_load=F('current_load') + 1)
        self.refresh_from_db(fields=['current_load'])

    def release_case(self):
        """Decrement current load when case is resolved"""
        self.__class__.objects.filter(pk=self.pk, current_load__gt=0).update(current_load=F('current_load') - 1)
        self.refresh_from_db(fields=['current_load'])


class JudgmentEmbedding(models.Model):
    """
    Phase 22: AI-Assisted Precedent Search
    """
    judgment = models.OneToOneField(
        Judgment,
        on_delete=models.CASCADE,
        related_name='embedding',
        verbose_name=_('judgment')
    )
    
    embedding_vector = models.JSONField(
        verbose_name=_('embedding vector'),
        help_text=_('Normalized text embedding for semantic search')
    )
    
    model_version = models.CharField(
        max_length=100,
        default='paraphrase-multilingual-MiniLM-L12-v2',
        verbose_name=_('model version'),
        help_text=_('Embedding model used to generate this vector')
    )
    
    original_text = models.TextField(
        verbose_name=_('original text'),
        help_text=_('Original judgment text (for display)')
    )
    
    normalized_text = models.TextField(
        verbose_name=_('normalized text'),
        help_text=_('Normalized text used for embedding (Arabic cleaned)')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('judgment embedding')
        verbose_name_plural = _('judgment embeddings')
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['model_version']),
        ]
        db_table = 'disputes_judgment_embedding'
    
    def __str__(self):
        return f"Embedding for Judgment #{self.judgment.id} ({self.model_version})"


class MediationSession(models.Model):
    """
    Automated negotiation process before full adjudication.
    """
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('accepted', _('Accepted')),
        ('rejected', _('Rejected')),
        ('expired', _('Expired')),
    ]

    dispute = models.OneToOneField(
        Dispute, 
        on_delete=models.CASCADE, 
        related_name='mediation_session',
        verbose_name=_('dispute')
    )
    
    current_round = models.IntegerField(default=1, verbose_name=_('Current Round'))
    max_rounds = models.IntegerField(default=3, verbose_name=_('Max Rounds'))
    
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(verbose_name=_('Expires At'))
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active', 
        db_index=True
    )
    
    class Meta:
        verbose_name = _('جلسة الوساطة')
        verbose_name_plural = _('جلسات الوساطة')

    def __str__(self):
        return f"Mediation for Dispute #{self.dispute.id} ({self.status})"


class SettlementOffer(models.Model):
    """
    Specific proposal generated by the Mediator or proposed by a party.
    """
    OFFER_SOURCE_CHOICES = [
        ('system', _('System AI')),
        ('owner', _('Owner')),
        ('tenant', _('Tenant')),
    ]
    
    class Status(models.TextChoices):
        PENDING_REVIEW = 'pending_review', _('Pending Judicial Review')
        VISIBLE = 'visible', _('Visible to Parties')
        REJECTED = 'rejected', _('Rejected by Admin')

    session = models.ForeignKey(
        MediationSession, 
        on_delete=models.CASCADE, 
        related_name='offers',
        verbose_name=_('session')
    )
    
    source = models.CharField(max_length=20, choices=OFFER_SOURCE_CHOICES)
    
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.VISIBLE,
        verbose_name=_('Visibility Status')
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_offers',
        verbose_name=_('Approved By')
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Approved At'))
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Offer Amount'))
    
    reasoning = models.TextField(verbose_name=_('Reasoning'), blank=True)
    
    cited_precedents = models.ManyToManyField(
        Judgment, 
        blank=True, 
        related_name='settlement_citations',
        verbose_name=_('Cited Precedents')
    )
    
    confidence_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Confidence Minimum'),
    )
    confidence_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Confidence Maximum'),
    )
    explainability_version = models.CharField(
        max_length=20,
        default='v1-plain-language',
        verbose_name=_('Explainability Version'),
    )
    
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('عرض التسوية')
        verbose_name_plural = _('عروض التسوية')
        ordering = ['-created_at']

    def __str__(self):
        return f"Offer {self.amount} ({self.source}) - {self.session}"


class AnonymizedJudgment(models.Model):
    """
    Public-facing, de-identified judgment record.
    """
    judgment_hash = models.CharField(
        max_length=64,
        unique=True,
        verbose_name=_('judgment hash'),
    )
    
    category = models.CharField(
        max_length=100,
        verbose_name=_('category'),
        db_index=True
    )
    dispute_type = models.CharField(
        max_length=200,
        verbose_name=_('dispute type')
    )
    
    ruling_summary = models.TextField(
        verbose_name=_('ruling summary'),
    )
    verdict = models.CharField(
        max_length=20,
        verbose_name=_('verdict'),
        db_index=True
    )
    awarded_ratio = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('awarded ratio %'),
    )
    
    evidence_types = models.JSONField(
        default=list,
        verbose_name=_('evidence types'),
    )
    
    consistency_score = models.IntegerField(
        default=0,
        verbose_name=_('consistency score'),
    )
    similar_cases_count = models.IntegerField(
        default=0,
        verbose_name=_('similar cases count')
    )
    
    judgment_date = models.DateField(
        verbose_name=_('judgment date'),
        db_index=True
    )
    geographic_region = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name=_('geographic region'),
    )
    
    uniqueness_score = models.IntegerField(
        default=0,
        verbose_name=_('uniqueness score'),
    )
    publication_delayed_until = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('publication delayed until'),
    )
    
    published_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('published at')
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('updated at')
    )
    
    class Meta:
        verbose_name = _('anonymized judgment')
        verbose_name_plural = _('anonymized judgments')
        ordering = ['-judgment_date']
        db_table = 'disputes_anonymized_judgment'

    def __str__(self):
        return f"Anonymized Judgment: {self.category} ({self.verdict})"


class PublicMetrics(models.Model):
    """
    Pre-computed aggregate statistics for transparency dashboard.
    """
    METRIC_TYPES = [
        ('verdict_balance', _('Verdict Balance (Owner vs Renter)')),
        ('consistency_distribution', _('Consistency Distribution')),
        ('category_breakdown', _('Category Breakdown')),
        ('evidence_patterns', _('Evidence Patterns')),
        ('avg_resolution_time', _('Average Resolution Time')),
        ('consistency_trend', _('Consistency Trend')),
        ('appeal_rate', _('Appeal Rate')),
        ('settlement_rate', _('Pre-Dispute Settlement Rate')),
    ]
    
    metric_type = models.CharField(
        max_length=50,
        choices=METRIC_TYPES,
        verbose_name=_('metric type'),
        db_index=True
    )
    category = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name=_('category'),
    )
    
    period_start = models.DateField(verbose_name=_('period start'))
    period_end = models.DateField(verbose_name=_('period end'))
    
    value_numeric = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('numeric value')
    )
    value_json = models.JSONField(
        null=True,
        blank=True,
        verbose_name=_('complex value'),
    )
    
    computed_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('computed at')
    )
    
    class Meta:
        verbose_name = _('public metric')
        verbose_name_plural = _('public metrics')
        unique_together = [['metric_type', 'category', 'period_start']]
        ordering = ['-period_start']
        db_table = 'disputes_public_metrics'


class MetricContextCard(models.Model):
    """
    Mandatory context for every public metric.
    """
    metric = models.OneToOneField(
        PublicMetrics,
        on_delete=models.CASCADE,
        related_name='context_card',
        verbose_name=_('metric')
    )
    
    context_explanation = models.TextField(
        verbose_name=_('context explanation'),
    )
    
    counter_narrative = models.TextField(
        blank=True,
        verbose_name=_('counter narrative'),
    )
    
    sample_scenarios = models.JSONField(
        default=list,
        verbose_name=_('sample scenarios'),
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('metric context card')
        verbose_name_plural = _('metric context cards')
        db_table = 'disputes_metric_context_card'


class UserReputationLog(models.Model):
    """
    Private log of abuse attempts.
    """
    EVENT_TYPES = [
        ('frivolous_appeal', _('Frivolous Appeal (Rejected by Panel)')),
        ('emergency_abuse', _('Emergency Escalation Unjustified')),
        ('evidence_manipulation', _('Evidence Manipulation Detected')),
        ('repeated_filing', _('Repeated Filing of Similar Cases')),
        ('PATTERN_DETECTED', _('Abuse Pattern Detected')),
        ('WARNING_ISSUED', _('Warning Issued to User')),
    ]
    
    ACTIONS = [
        ('warning', _('Warning Issued')),
        ('priority_downgrade', _('Priority Downgraded')),
        ('scrutiny_increase', _('Scrutiny Level Increased')),
        ('escalation', _('Escalated to Human Review')),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reputation_logs',
        verbose_name=_('user')
    )
    event_type = models.CharField(
        max_length=50,
        choices=EVENT_TYPES,
        verbose_name=_('event type'),
        db_index=True
    )
    detection_method = models.CharField(
        max_length=100,
        blank=True,
        default='automatic',
        verbose_name=_('detection method'),
    )
    
    related_dispute = models.ForeignKey(
        'Dispute',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reputation_events',
        verbose_name=_('related dispute')
    )
    
    event_data = models.JSONField(
        null=True,
        blank=True,
        verbose_name=_('event data'),
    )
    context = models.TextField(
        blank=True,
        verbose_name=_('context'),
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('timestamp'),
        db_index=True
    )
    
    severity = models.IntegerField(
        default=1,
        verbose_name=_('severity'),
    )
    
    logged_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('logged at'),
        db_index=True
    )
    
    action = models.CharField(
        max_length=50,
        choices=ACTIONS,
        blank=True,
        default='',
        verbose_name=_('action taken')
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_('internal notes')
    )
    
    class Meta:
        verbose_name = _('user reputation log')
        verbose_name_plural = _('user reputation logs')
        ordering = ['-logged_at']
        db_table = 'disputes_user_reputation_log'


class PostJudgmentSurvey(models.Model):
    """
    Post-judgment acceptance survey.
    """
    judgment = models.OneToOneField(
        Judgment,
        on_delete=models.CASCADE,
        related_name='survey',
        verbose_name=_('judgment')
    )
    
    understands_decision = models.BooleanField(
        null=True,
        blank=True,
        verbose_name=_('understands decision'),
    )
    
    accepts_fairness = models.BooleanField(
        null=True,
        blank=True,
        verbose_name=_('accepts fairness'),
    )
    
    would_use_again = models.BooleanField(
        null=True,
        blank=True,
        verbose_name=_('would use again'),
    )
    
    feedback = models.TextField(
        blank=True,
        verbose_name=_('feedback'),
    )
    
    sent_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('sent at')
    )
    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('responded at')
    )
    
    class Meta:
        verbose_name = _('post-judgment survey')
        verbose_name_plural = _('post-judgment surveys')
        ordering = ['-sent_at']
        db_table = 'disputes_post_judgment_survey'


class SystemFlag(models.Model):
    """
    Persistent system-wide flags for critical operations.
    """
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_flags'
        
    def __str__(self):
        return f"{self.key}={self.value}"
    
    @classmethod
    def get_flag(cls, key, default=False):
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_flag(cls, key, value):
        obj, _ = cls.objects.update_or_create(key=key, defaults={'value': value})
        return obj
