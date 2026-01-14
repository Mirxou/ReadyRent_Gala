"""
Django management command to reset demo data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product, ProductImage
from apps.bookings.models import Booking
from apps.cms.models import Page, BlogPost, Banner, FAQ
from apps.vendors.models import Vendor, VendorProduct
from apps.branches.models import Branch, BranchInventory, BranchStaff
from apps.local_guide.models import ServiceCategory, LocalService
from apps.artisans.models import Artisan, ArtisanProduct
from apps.bundles.models import BundleCategory, Bundle, BundleItem
from apps.warranties.models import WarrantyPlan
try:
    from apps.warranties.models import WarrantyPurchase
except ImportError:
    WarrantyPurchase = None
from apps.reviews.models import Review
from apps.disputes.models import Dispute
from apps.users.models import StaffRole, UserProfile, VerificationStatus
from apps.notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Reset all demo data (keeps admin user)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep-admin',
            action='store_true',
            help='Keep admin user (default: True)',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Skip confirmation prompt',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING('This will delete all demo data!'))
            confirm = input('Are you sure? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Operation cancelled'))
                return

        self.stdout.write(self.style.WARNING('Resetting demo data...'))

        # Delete in reverse dependency order
        self.stdout.write('Deleting disputes...')
        Dispute.objects.all().delete()

        self.stdout.write('Deleting reviews...')
        Review.objects.all().delete()

        if WarrantyPurchase:
            self.stdout.write('Deleting warranty purchases...')
            WarrantyPurchase.objects.all().delete()

        self.stdout.write('Deleting warranty plans...')
        WarrantyPlan.objects.all().delete()

        self.stdout.write('Deleting bundle items...')
        BundleItem.objects.all().delete()

        self.stdout.write('Deleting bundles...')
        Bundle.objects.all().delete()

        self.stdout.write('Deleting bundle categories...')
        BundleCategory.objects.all().delete()

        self.stdout.write('Deleting vendor products...')
        VendorProduct.objects.all().delete()

        self.stdout.write('Deleting vendors...')
        Vendor.objects.all().delete()

        self.stdout.write('Deleting branch staff...')
        BranchStaff.objects.all().delete()

        self.stdout.write('Deleting branch inventory...')
        BranchInventory.objects.all().delete()

        self.stdout.write('Deleting branches...')
        Branch.objects.all().delete()

        self.stdout.write('Deleting artisan products...')
        ArtisanProduct.objects.all().delete()

        self.stdout.write('Deleting artisans...')
        Artisan.objects.all().delete()

        self.stdout.write('Deleting local services...')
        LocalService.objects.all().delete()

        self.stdout.write('Deleting service categories...')
        ServiceCategory.objects.all().delete()

        self.stdout.write('Deleting FAQs...')
        FAQ.objects.all().delete()

        self.stdout.write('Deleting banners...')
        Banner.objects.all().delete()

        self.stdout.write('Deleting blog posts...')
        BlogPost.objects.all().delete()

        self.stdout.write('Deleting pages...')
        Page.objects.all().delete()

        self.stdout.write('Deleting bookings...')
        Booking.objects.all().delete()

        self.stdout.write('Deleting product images...')
        ProductImage.objects.all().delete()

        self.stdout.write('Deleting products...')
        Product.objects.all().delete()

        self.stdout.write('Deleting categories...')
        Category.objects.all().delete()

        self.stdout.write('Deleting notifications...')
        Notification.objects.all().delete()

        self.stdout.write('Deleting staff roles...')
        StaffRole.objects.all().delete()

        self.stdout.write('Deleting verification statuses...')
        VerificationStatus.objects.all().delete()

        self.stdout.write('Deleting user profiles...')
        UserProfile.objects.all().delete()

        # Delete users (except admin if keep_admin is True)
        if options['keep_admin']:
            self.stdout.write('Deleting non-admin users...')
            User.objects.filter(is_superuser=False).delete()
        else:
            self.stdout.write('Deleting all users...')
            User.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Demo data reset completed!'))
        self.stdout.write(self.style.SUCCESS('You can now run: python manage.py seed_data'))

