from rest_framework import viewsets, status, views, serializers, permissions
from rest_framework.response import Response
from django.utils import timezone
from .models import Vouch
from apps.users.models import User
from apps.users.services import RiskScoreService


def get_risk_score(user):
    """Helper to safely get risk score with fallback"""
    try:
        if hasattr(user, "verification") and user.verification:
            return user.verification.risk_score
    except Exception:
        pass
    return 50  # Default neutral score


class VouchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vouch
        fields = ["id", "voucher", "receiver", "created_at"]
        read_only_fields = ["voucher", "created_at"]

    def validate(self, data):
        request = self.context["request"]
        if request.user == data["receiver"]:
            raise serializers.ValidationError("You cannot vouch for yourself.")
        return data


class VouchCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        voucher_risk = get_risk_score(request.user)
        if voucher_risk > 20:
            return Response(
                {
                    "detail": "You must be a Trusted User (Risk Score <= 20) to vouch for others."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            receiver = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if Vouch.objects.filter(voucher=request.user, receiver=receiver).exists():
            return Response(
                {"detail": "You have already vouched for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vouch = Vouch.objects.create(voucher=request.user, receiver=receiver)
        receiver_risk = get_risk_score(receiver)

        return Response(
            {
                "detail": f"You successfully vouched for {receiver.username}.",
                "new_score": receiver_risk,
            },
            status=status.HTTP_201_CREATED,
        )


class SocialFeedView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vouches = Vouch.objects.select_related("voucher", "receiver").order_by(
            "-created_at"
        )[:10]

        activities = []
        for v in vouches:
            voucher_risk = get_risk_score(v.voucher)
            activities.append(
                {
                    "id": f"vouch-{v.id}",
                    "type": "vouch",
                    "user": {
                        "username": f"{v.voucher.first_name}.{v.voucher.last_name[0]}"
                        if v.voucher.last_name
                        else v.voucher.username,
                        "trust_score": voucher_risk,
                        "is_sovereign": voucher_risk <= 20,
                    },
                    "target_name": v.receiver.username,
                    "created_at": v.created_at.isoformat(),
                }
            )

        activities.append(
            {
                "id": "trend-1",
                "type": "trend",
                "user": {"username": "ReadyRent Intelligence", "is_sovereign": True},
                "content": "الطلب على القفطان العاصمي يرتفع بنسبة 25% في منطقة قسنطينة.",
                "created_at": timezone.now().isoformat(),
            }
        )

        return Response(activities)


class MarketPulseView(views.APIView):
    """
    Scrapped Social Trends from IG/TikTok (Logic based on Skills)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        platform = request.query_params.get("platform", "all")
        # Here we would invoke the scraper scripts from 'skiLL'
        pulse_data = {
            "trending_keywords": ["Kaftan", "Luxury Rent", "Constantine Weddings"],
            "market_sentiment": "High",
            "top_platforms": ["Instagram", "Facebook"],
        }
        return Response(pulse_data)
