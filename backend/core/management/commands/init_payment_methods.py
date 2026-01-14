"""
Django management command to initialize payment methods
"""
from django.core.management.base import BaseCommand
from apps.payments.models import PaymentMethod


class Command(BaseCommand):
    help = 'Initialize payment methods (BaridiMob and Bank Card)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Initializing payment methods...'))

        # BaridiMob
        baridimob, created = PaymentMethod.objects.get_or_create(
            name='baridimob',
            defaults={
                'display_name': 'بريدي موب',
                'description': 'الدفع عبر الهاتف المحمول باستخدام بريدي موب',
                'icon': 'Smartphone',
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  Created payment method: {baridimob.display_name}'))
        else:
            self.stdout.write(f'  Payment method already exists: {baridimob.display_name}')

        # Bank Card
        bank_card, created = PaymentMethod.objects.get_or_create(
            name='bank_card',
            defaults={
                'display_name': 'البطاقة البنكية',
                'description': 'الدفع باستخدام البطاقة البنكية (CIB, BDL, CPA, etc.)',
                'icon': 'CreditCard',
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  Created payment method: {bank_card.display_name}'))
        else:
            self.stdout.write(f'  Payment method already exists: {bank_card.display_name}')

        self.stdout.write(self.style.SUCCESS('Payment methods initialized successfully!'))
