"""
Django management command to seed database with sample data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.products.models import Category, Product, ProductImage
from apps.bookings.models import Booking
from apps.cms.models import Page, BlogPost, Banner, FAQ
from apps.vendors.models import Vendor, VendorProduct
from apps.branches.models import Branch, BranchInventory, BranchStaff
from apps.local_guide.models import ServiceCategory, LocalService
from apps.artisans.models import Artisan, ArtisanProduct
from apps.bundles.models import BundleCategory, Bundle, BundleItem
from apps.warranties.models import WarrantyPlan
from apps.reviews.models import Review
from apps.disputes.models import Dispute
from apps.users.models import StaffRole, UserProfile
from apps.notifications.models import Notification
from decimal import Decimal
from datetime import date, timedelta, datetime
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample data for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting data seeding...'))

        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            # Clear in reverse dependency order
            Dispute.objects.all().delete()
            Review.objects.all().delete()
            Booking.objects.all().delete()
            BundleItem.objects.all().delete()
            Bundle.objects.all().delete()
            BundleCategory.objects.all().delete()
            VendorProduct.objects.all().delete()
            Vendor.objects.all().delete()
            BranchStaff.objects.all().delete()
            BranchInventory.objects.all().delete()
            Branch.objects.all().delete()
            ArtisanProduct.objects.all().delete()
            Artisan.objects.all().delete()
            LocalService.objects.all().delete()
            ServiceCategory.objects.all().delete()
            FAQ.objects.all().delete()
            Banner.objects.all().delete()
            BlogPost.objects.all().delete()
            Page.objects.all().delete()
            ProductImage.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Notification.objects.all().delete()
            StaffRole.objects.all().delete()
            UserProfile.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        # Create categories
        self.stdout.write('Creating categories...')
        categories_data = [
            {
                'name': 'Evening Dresses',
                'name_ar': 'فساتين سهرة',
                'slug': 'evening-dresses',
                'description': 'Elegant evening dresses for special occasions - فساتين سهرة أنيقة للمناسبات الخاصة'
            },
            {
                'name': 'Wedding Dresses',
                'name_ar': 'فساتين أعراس',
                'slug': 'wedding-dresses',
                'description': 'Beautiful wedding dresses - فساتين أعراس جميلة'
            },
            {
                'name': 'Accessories',
                'name_ar': 'إكسسوارات',
                'slug': 'accessories',
                'description': 'Fashion accessories - إكسسوارات الموضة'
            },
            {
                'name': 'Shoes',
                'name_ar': 'أحذية',
                'slug': 'shoes',
                'description': 'Formal and casual shoes - أحذية رسمية وعادية'
            },
        ]

        categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            categories.append(category)
            if created:
                self.stdout.write(f'  Created category: {category.name} ({category.slug})')

        # Create admin user if doesn't exist
        self.stdout.write('Creating admin user...')
        admin, created = User.objects.get_or_create(
            email='admin@readyrent.gala',
            defaults={
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write('  Created admin user (password: admin123)')
        else:
            self.stdout.write('  Admin user already exists')

        # Create test users
        self.stdout.write('Creating test users...')
        test_users = []
        for i in range(1, 4):
            user, created = User.objects.get_or_create(
                email=f'test{i}@example.com',
                defaults={
                    'username': f'testuser{i}',
                    'first_name': f'Test',
                    'last_name': f'User {i}',
                    'role': 'customer',
                    'is_active': True,
                }
            )
            if created:
                user.set_password('test123')
                user.save()
                test_users.append(user)
                self.stdout.write(f'  Created test user: {user.email} (password: test123)')
            else:
                test_users.append(user)

        # Create products
        self.stdout.write('Creating products...')
        products_data = [
            {
                'name': 'Red Evening Dress',
                'name_ar': 'فسستان سهرة أحمر',
                'slug': 'red-evening-dress',
                'description': 'Beautiful red evening dress with elegant design',
                'description_ar': 'فسستان سهرة أحمر جميل بتصميم أنيق',
                'category': categories[0],
                'price_per_day': Decimal('2500.00'),
                'size': 'M',
                'color': 'Red',
                'color_hex': '#DC2626',
                'status': 'available',
                'is_featured': True,
            },
            {
                'name': 'White Wedding Dress',
                'name_ar': 'فسستان عرس أبيض',
                'slug': 'white-wedding-dress',
                'description': 'Classic white wedding dress',
                'description_ar': 'فسستان عرس أبيض كلاسيكي',
                'category': categories[1],
                'price_per_day': Decimal('5000.00'),
                'size': 'M',
                'color': 'White',
                'color_hex': '#FFFFFF',
                'status': 'available',
                'is_featured': True,
            },
            {
                'name': 'Blue Evening Dress',
                'name_ar': 'فسستان سهرة أزرق',
                'slug': 'blue-evening-dress',
                'description': 'Elegant blue evening dress',
                'description_ar': 'فسستان سهرة أزرق أنيق',
                'category': categories[0],
                'price_per_day': Decimal('2800.00'),
                'size': 'L',
                'color': 'Blue',
                'color_hex': '#2563EB',
                'status': 'available',
                'is_featured': False,
            },
            {
                'name': 'Gold Evening Dress',
                'name_ar': 'فسستان سهرة ذهبي',
                'slug': 'gold-evening-dress',
                'description': 'Luxurious gold evening dress',
                'description_ar': 'فسستان سهرة ذهبي فاخر',
                'category': categories[0],
                'price_per_day': Decimal('3500.00'),
                'size': 'S',
                'color': 'Gold',
                'color_hex': '#FBBF24',
                'status': 'available',
                'is_featured': True,
            },
            {
                'name': 'Pink Wedding Dress',
                'name_ar': 'فسستان عرس وردي',
                'slug': 'pink-wedding-dress',
                'description': 'Beautiful pink wedding dress',
                'description_ar': 'فسستان عرس وردي جميل',
                'category': categories[1],
                'price_per_day': Decimal('4500.00'),
                'size': 'M',
                'color': 'Pink',
                'color_hex': '#EC4899',
                'status': 'available',
                'is_featured': False,
            },
            {
                'name': 'Pearl Necklace',
                'name_ar': 'قلادة لؤلؤ',
                'slug': 'pearl-necklace',
                'description': 'Elegant pearl necklace',
                'description_ar': 'قلادة لؤلؤ أنيقة',
                'category': categories[2],
                'price_per_day': Decimal('800.00'),
                'size': 'M',  # Using valid size from SIZE_CHOICES
                'color': 'White',
                'color_hex': '#FFFFFF',
                'status': 'available',
                'is_featured': False,
            },
            {
                'name': 'Gold Earrings',
                'name_ar': 'أقراط ذهبية',
                'slug': 'gold-earrings',
                'description': 'Beautiful gold earrings',
                'description_ar': 'أقراط ذهبية جميلة',
                'category': categories[2],
                'price_per_day': Decimal('600.00'),
                'size': 'S',  # Using valid size from SIZE_CHOICES
                'color': 'Gold',
                'color_hex': '#FBBF24',
                'status': 'available',
                'is_featured': False,
            },
            {
                'name': 'High Heels',
                'name_ar': 'كعب عالي',
                'slug': 'high-heels',
                'description': 'Elegant high heel shoes',
                'description_ar': 'أحذية كعب عالي أنيقة',
                'category': categories[3],
                'price_per_day': Decimal('1200.00'),
                'size': 'M',  # Using valid size from SIZE_CHOICES
                'color': 'Black',
                'color_hex': '#000000',
                'status': 'available',
                'is_featured': False,
            },
        ]

        products = []
        for prod_data in products_data:
            product, created = Product.objects.get_or_create(
                slug=prod_data['slug'],
                defaults=prod_data
            )
            products.append(product)
            if created:
                self.stdout.write(f'  Created product: {product.name} ({product.slug})')

        # Create sample bookings
        self.stdout.write('Creating sample bookings...')
        booking_statuses = ['pending', 'confirmed', 'in_use', 'completed']
        
        for i, user in enumerate(test_users[:2]):  # Create bookings for first 2 test users
            for j in range(2):  # 2 bookings per user
                start_date = date.today() + timedelta(days=random.randint(1, 30))
                end_date = start_date + timedelta(days=random.randint(1, 5))
                total_days = (end_date - start_date).days
                
                product = random.choice(products)
                total_price = product.price_per_day * total_days
                
                booking = Booking.objects.create(
                    user=user,
                    product=product,
                    start_date=start_date,
                    end_date=end_date,
                    total_days=total_days,
                    total_price=total_price,
                    status=random.choice(booking_statuses),
                )
                self.stdout.write(f'  Created booking: {booking.product.name} for {user.email}')

        # Create CMS Pages
        self.stdout.write('Creating CMS pages...')
        pages_data = [
            {
                'title': 'About Us',
                'title_ar': 'من نحن',
                'slug': 'about-us',
                'page_type': 'about',
                'content': 'Welcome to ReadyRent.Gala - your premier destination for elegant dress rentals.',
                'content_ar': 'مرحباً بكم في ReadyRent.Gala - وجهتكم الأولى لكراء الفساتين الأنيقة.',
                'status': 'published',
                'is_featured': True,
                'order': 1,
            },
            {
                'title': 'Terms of Service',
                'title_ar': 'شروط الخدمة',
                'slug': 'terms',
                'page_type': 'terms',
                'content': 'Terms and conditions for using our platform.',
                'content_ar': 'الشروط والأحكام لاستخدام منصتنا.',
                'status': 'published',
                'order': 2,
            },
            {
                'title': 'Privacy Policy',
                'title_ar': 'سياسة الخصوصية',
                'slug': 'privacy',
                'page_type': 'privacy',
                'content': 'Our privacy policy and data protection measures.',
                'content_ar': 'سياسة الخصوصية وإجراءات حماية البيانات.',
                'status': 'published',
                'order': 3,
            },
        ]
        for page_data in pages_data:
            page_data['created_by'] = admin
            page_data['updated_by'] = admin
            Page.objects.get_or_create(slug=page_data['slug'], defaults=page_data)
        
        # Create FAQs
        self.stdout.write('Creating FAQs...')
        faqs_data = [
            {
                'question': 'How do I book a dress?',
                'question_ar': 'كيف أحجز فستان؟',
                'answer': 'Browse our catalog, select a dress, choose dates, and complete your booking.',
                'answer_ar': 'تصفح كتالوجنا، اختر فستاناً، حدد التواريخ، وأكمل حجزك.',
                'category': 'booking',
                'is_featured': True,
                'order': 1,
            },
            {
                'question': 'What is the cancellation policy?',
                'question_ar': 'ما هي سياسة الإلغاء؟',
                'answer': 'You can cancel up to 48 hours before the rental start date for a full refund.',
                'answer_ar': 'يمكنك الإلغاء حتى 48 ساعة قبل تاريخ بدء الإيجار لاسترداد كامل.',
                'category': 'booking',
                'is_featured': True,
                'order': 2,
            },
        ]
        for faq_data in faqs_data:
            FAQ.objects.get_or_create(question=faq_data['question'], defaults=faq_data)
        
        # Create Branches
        self.stdout.write('Creating branches...')
        branches_data = [
            {
                'name': 'Main Branch',
                'name_ar': 'الفرع الرئيسي',
                'code': 'MAIN-001',
                'address': '123 Main Street, Constantine',
                'address_ar': '123 شارع الرئيسي، قسنطينة',
                'city': 'Constantine',
                'phone': '+213123456789',
                'email': 'main@readyrent.gala',
                'is_active': True,
            },
        ]
        branches = []
        for branch_data in branches_data:
            branch_data['manager'] = admin
            branch, created = Branch.objects.get_or_create(code=branch_data['code'], defaults=branch_data)
            branches.append(branch)
            if created:
                self.stdout.write(f'  Created branch: {branch.name_ar}')
        
        # Create Vendors
        self.stdout.write('Creating vendors...')
        vendor_user, _ = User.objects.get_or_create(
            email='vendor@example.com',
            defaults={
                'username': 'vendor1',
                'first_name': 'Vendor',
                'last_name': 'One',
                'role': 'customer',
                'is_active': True,
            }
        )
        if not vendor_user.has_usable_password():
            vendor_user.set_password('vendor123')
            vendor_user.save()
        
        vendor, created = Vendor.objects.get_or_create(
            user=vendor_user,
            defaults={
                'business_name': 'Fashion Supplier Co.',
                'business_name_ar': 'شركة مورد الأزياء',
                'phone': '+213987654321',
                'email': 'vendor@example.com',
                'address': '456 Supplier Street',
                'city': 'Constantine',
                'commission_rate': Decimal('15.00'),
                'status': 'active',
                'is_verified': True,
            }
        )
        if created:
            self.stdout.write(f'  Created vendor: {vendor.business_name_ar}')
        
        # Create Warranty Plans
        self.stdout.write('Creating warranty plans...')
        warranty_plans_data = [
            {
                'name': 'Basic Coverage',
                'name_ar': 'تغطية أساسية',
                'plan_type': 'basic',
                'coverage_type': 'damage',
                'price': Decimal('500.00'),
                'is_active': True,
            },
            {
                'name': 'Premium Coverage',
                'name_ar': 'تغطية ممتازة',
                'plan_type': 'premium',
                'coverage_type': 'full',
                'price': Decimal('1500.00'),
                'is_active': True,
            },
        ]
        for plan_data in warranty_plans_data:
            WarrantyPlan.objects.get_or_create(name=plan_data['name'], defaults=plan_data)
        
        # Create Reviews
        self.stdout.write('Creating reviews...')
        if products and test_users:
            review_data = {
                'user': test_users[0],
                'product': products[0],
                'rating': 5,
                'title': 'Excellent dress!',
                'title_ar': 'فسستان رائع!',
                'comment': 'Very satisfied with the quality and service.',
                'comment_ar': 'راضية جداً بالجودة والخدمة.',
                'status': 'approved',
            }
            Review.objects.get_or_create(
                user=review_data['user'],
                product=review_data['product'],
                defaults=review_data
            )
        
        # Create Bundle Categories and Bundles
        self.stdout.write('Creating bundle categories and bundles...')
        bundle_category, _ = BundleCategory.objects.get_or_create(
            slug='wedding-packages',
            defaults={
                'name': 'Wedding Packages',
                'name_ar': 'باقات الأعراس',
                'description': 'Complete wedding packages',
                'description_ar': 'باقات أعراس كاملة',
                'is_active': True,
            }
        )
        
        if products and len(products) >= 3:
            bundle, _ = Bundle.objects.get_or_create(
                slug='complete-wedding-package',
                defaults={
                    'name': 'Complete Wedding Package',
                    'name_ar': 'باقة عرس كاملة',
                    'description': 'Dress + Accessories + Shoes',
                    'description_ar': 'فسستان + إكسسوارات + أحذية',
                    'category': bundle_category,
                    'discount_type': 'percentage',
                    'discount_value': Decimal('15.00'),
                    'is_active': True,
                }
            )
            # Add items to bundle
            if products[1]:  # Wedding dress
                BundleItem.objects.get_or_create(
                    bundle=bundle,
                    product=products[1],
                    defaults={'quantity': 1}
                )
            if len(products) > 5:  # Accessories
                BundleItem.objects.get_or_create(
                    bundle=bundle,
                    product=products[5],
                    defaults={'quantity': 1}
                )
            if len(products) > 7:  # Shoes
                BundleItem.objects.get_or_create(
                    bundle=bundle,
                    product=products[7],
                    defaults={'quantity': 1}
                )
        
        # Create Local Guide Services
        self.stdout.write('Creating local guide services...')
        service_category, _ = ServiceCategory.objects.get_or_create(
            slug='wedding-services',
            defaults={
                'name': 'Wedding Services',
                'name_ar': 'خدمات الأعراس',
                'is_active': True,
            }
        )
        
        LocalService.objects.get_or_create(
            slug='grand-hall-venue',
            defaults={
                'name': 'Grand Hall',
                'name_ar': 'قاعة جراند',
                'service_type': 'venue',
                'category': service_category,
                'phone': '+213123456789',
                'address': 'Constantine',
                'city': 'Constantine',
                'is_featured': True,
            }
        )
        
        # Create Artisans
        self.stdout.write('Creating artisans...')
        artisan_user, _ = User.objects.get_or_create(
            email='artisan@example.com',
            defaults={
                'username': 'artisan1',
                'first_name': 'Designer',
                'last_name': 'One',
                'role': 'customer',
                'is_active': True,
            }
        )
        if not artisan_user.has_usable_password():
            artisan_user.set_password('artisan123')
            artisan_user.save()
        
        artisan, _ = Artisan.objects.get_or_create(
            user=artisan_user,
            defaults={
                'name': 'Fatima Designer',
                'name_ar': 'فاتمة المصممة',
                'specialty': 'dress_designer',
                'phone': '+213987654321',
                'city': 'Constantine',
                'is_featured': True,
            }
        )
        
        # Create Staff Roles
        self.stdout.write('Creating staff roles...')
        staff_user, _ = User.objects.get_or_create(
            email='staff@readyrent.gala',
            defaults={
                'username': 'staff1',
                'first_name': 'Staff',
                'last_name': 'Member',
                'role': 'staff',
                'is_staff': True,
                'is_active': True,
            }
        )
        if not staff_user.has_usable_password():
            staff_user.set_password('staff123')
            staff_user.save()
        
        if branches:
            StaffRole.objects.get_or_create(
                user=staff_user,
                role='staff',
                branch=branches[0],
                defaults={
                    'department': 'Operations',
                    'is_active': True,
                    'assigned_by': admin,
                }
            )
        
        self.stdout.write(self.style.SUCCESS('Data seeding completed successfully!'))
        self.stdout.write(self.style.SUCCESS(f'Created {len(categories)} categories'))
        self.stdout.write(self.style.SUCCESS(f'Created {len(products)} products'))
        self.stdout.write(self.style.SUCCESS(f'Created {Booking.objects.count()} bookings'))
        self.stdout.write(self.style.SUCCESS(f'Created {Page.objects.count()} CMS pages'))
        self.stdout.write(self.style.SUCCESS(f'Created {FAQ.objects.count()} FAQs'))
        self.stdout.write(self.style.SUCCESS(f'Created {Branch.objects.count()} branches'))
        self.stdout.write(self.style.SUCCESS(f'Created {Vendor.objects.count()} vendors'))
        self.stdout.write(self.style.SUCCESS(f'Created {WarrantyPlan.objects.count()} warranty plans'))
        self.stdout.write(self.style.SUCCESS(f'Created {Review.objects.count()} reviews'))
        self.stdout.write(self.style.SUCCESS(f'Created {StaffRole.objects.count()} staff roles'))
        self.stdout.write(self.style.SUCCESS(f'Created {Bundle.objects.count()} bundles'))
        self.stdout.write(self.style.SUCCESS(f'Created {LocalService.objects.count()} local services'))
        self.stdout.write(self.style.SUCCESS(f'Created {Artisan.objects.count()} artisans'))

