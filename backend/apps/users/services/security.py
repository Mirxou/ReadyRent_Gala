import pyotp
import qrcode
import io
import base64
from django.conf import settings
from ..models import User

class SovereignGuardService:
    """
    The High-Security Guardian.
    Handles TOTP (2FA) identity verification for the Sovereign Tier.
    """

    @classmethod
    def generate_new_secret(cls) -> str:
        """Generate a new base32 TOTP secret."""
        return pyotp.random_base32()

    @classmethod
    def get_provisioning_uri(cls, user: User, secret: str) -> str:
        """
        Generate the URI for Google Authenticator / Authy.
        Format: otpauth://totp/ReadyRent:user@email.com?secret=...&issuer=ReadyRent
        """
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name="ReadyRent Sovereign"
        )

    @classmethod
    def generate_qr_base64(cls, provisioning_uri: str) -> str:
        """Generate a Base64 encoded PNG of the QR code for the frontend."""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered)
        return base64.b64encode(buffered.getvalue()).decode()

    @classmethod
    def verify_token(cls, secret: str, token: str) -> bool:
        """
        Verify a 6-digit TOTP token against the secret.
        Includes a small window (valid_window=1) to allow for clock drift.
        """
        if not secret or not token:
            return False
            
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)

    @classmethod
    def enable_2fa(cls, user: User, secret: str, token: str) -> bool:
        """
        Atomic activation of 2FA. 
        User MUST prove they have the secret by providing a valid token.
        """
        if cls.verify_token(secret, token):
            user.totp_secret = secret
            user.is_2fa_enabled = True
            user.save()
            return True
        return False
