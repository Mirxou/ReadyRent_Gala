from rest_framework import viewsets, status, views, serializers, permissions
from rest_framework.response import Response
from .models import Vouch
from apps.users.models import User
from apps.users.services_risk import RiskScoreService

class VouchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vouch
        fields = ['id', 'voucher', 'receiver', 'created_at']
        read_only_fields = ['voucher', 'created_at']

    def validate(self, data):
        request = self.context['request']
        if request.user == data['receiver']:
            raise serializers.ValidationError("You cannot vouch for yourself.")
        return data

class VouchCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        # 1. Check if Voucher (Request User) is Worthy
        # Must have Low Risk Score (e.g., <= 20) to be a "Voucher"
        voucher_risk = request.user.verification.risk_score if hasattr(request.user, 'verification') else 50
        if voucher_risk > 20: 
            return Response(
                {"detail": "You must be a Trusted User (Risk Score <= 20) to vouch for others."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            receiver = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # 2. Check if already vouched
        if Vouch.objects.filter(voucher=request.user, receiver=receiver).exists():
             return Response({"detail": "You have already vouched for this user."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Create Vouch
        vouch = Vouch.objects.create(voucher=request.user, receiver=receiver)
        
        return Response(
            {"detail": f"You successfully vouched for {receiver.username}.", "new_score": receiver.verification.risk_score},
            status=status.HTTP_201_CREATED
        )
