from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import HygieneRecord, HygieneChecklist, HygieneCertificate
from .serializers import HygieneRecordSerializer, HygieneChecklistSerializer, HygieneCertificateSerializer


class HygieneRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing hygiene records
    """
    queryset = HygieneRecord.objects.select_related(
        'product', 'cleaned_by', 'verified_by', 'related_return'
    ).prefetch_related('checklist_items', 'certificate').all()
    serializer_class = HygieneRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'status', 'cleaning_type', 'passed_inspection']
    search_fields = ['product__name', 'cleaning_notes']
    ordering_fields = ['scheduled_date', 'created_at']
    ordering = ['-scheduled_date']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def start_cleaning(self, request, pk=None):
        """Start cleaning process"""
        record = self.get_object()
        if record.status != 'pending':
            return Response(
                {'error': 'Cleaning must be pending to start'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        record.status = 'in_progress'
        record.started_at = timezone.now()
        record.cleaned_by = request.user
        record.save()
        
        serializer = self.get_serializer(record)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def complete_cleaning(self, request, pk=None):
        """Complete cleaning"""
        record = self.get_object()
        if record.status != 'in_progress':
            return Response(
                {'error': 'Cleaning must be in progress'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        record.status = 'completed'
        record.completed_at = timezone.now()
        cleaning_notes = request.data.get('cleaning_notes', '')
        chemicals_used = request.data.get('chemicals_used', '')
        temperature = request.data.get('temperature')
        
        if cleaning_notes:
            record.cleaning_notes = cleaning_notes
        if chemicals_used:
            record.chemicals_used = chemicals_used
        if temperature:
            record.temperature = temperature
        
        record.save()
        
        serializer = self.get_serializer(record)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def verify(self, request, pk=None):
        """Verify cleaning quality"""
        record = self.get_object()
        if record.status != 'completed':
            return Response(
                {'error': 'Cleaning must be completed to verify'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        passed = request.data.get('passed_inspection', False)
        quality_score = request.data.get('quality_score')
        inspection_notes = request.data.get('inspection_notes', '')
        
        record.status = 'verified' if passed else 'failed'
        record.passed_inspection = passed
        record.verified_by = request.user
        record.verified_at = timezone.now()
        
        if quality_score:
            record.quality_score = quality_score
        if inspection_notes:
            record.inspection_notes = inspection_notes
        
        record.save()
        
        # Create certificate if passed
        if passed:
            HygieneCertificate.objects.get_or_create(
                hygiene_record=record,
                defaults={
                    'certificate_number': f'HC-{record.id}-{timezone.now().strftime("%Y%m%d")}',
                }
            )
        
        serializer = self.get_serializer(record)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def pending(self, request):
        """Get pending hygiene records"""
        pending_records = self.queryset.filter(status='pending')[:10]
        serializer = self.get_serializer(pending_records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def latest_for_product(self, request):
        """Get latest hygiene record for a product"""
        product_id = request.query_params.get('product')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        latest_record = self.queryset.filter(
            product_id=product_id,
            status='verified'
        ).order_by('-completed_at').first()
        
        if not latest_record:
            return Response({'record': None})
        
        serializer = self.get_serializer(latest_record)
        return Response({'record': serializer.data})


class HygieneCertificateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing hygiene certificates
    """
    queryset = HygieneCertificate.objects.select_related('hygiene_record__product').filter(is_valid=True)
    serializer_class = HygieneCertificateSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_valid']
    search_fields = ['certificate_number', 'hygiene_record__product__name']
    permission_classes = [IsAuthenticated]

