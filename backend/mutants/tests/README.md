# دليل الاختبارات - ReadyRent.Gala

## نظرة عامة

هذا الدليل يوضح كيفية تشغيل الاختبارات في مشروع ReadyRent.Gala.

## هيكل الاختبارات

```
backend/tests/
├── __init__.py
├── conftest.py              # Pytest fixtures المشتركة
├── unit/                    # Unit Tests
│   ├── test_cms_models.py
│   ├── test_vendors_models.py
│   ├── test_branches_models.py
│   ├── test_bundles_models.py
│   ├── test_warranties_models.py
│   ├── test_reviews_models.py
│   └── test_users_models.py
├── integration/             # Integration Tests
│   ├── test_booking_flow.py
│   ├── test_return_flow.py
│   ├── test_kyc_flow.py
│   └── test_dispute_flow.py
├── security/                # Security Tests
│   ├── test_authentication.py
│   ├── test_csrf.py
│   ├── test_xss.py
│   └── test_rate_limiting.py
└── load/                    # Performance Tests
    └── locustfile.py
```

## تشغيل الاختبارات

### جميع الاختبارات

```bash
# باستخدام pytest
pytest

# باستخدام Django test runner
python manage.py test
```

### اختبارات محددة

```bash
# Unit tests فقط
pytest backend/tests/unit/

# Integration tests فقط
pytest backend/tests/integration/

# Security tests فقط
pytest backend/tests/security/

# اختبار ملف محدد
pytest backend/tests/unit/test_cms_models.py

# اختبار class محدد
pytest backend/tests/unit/test_cms_models.py::TestPageModel

# اختبار function محدد
pytest backend/tests/unit/test_cms_models.py::TestPageModel::test_create_page
```

### مع Markers

```bash
# اختبارات الأمان فقط
pytest -m security

# اختبارات التكامل فقط
pytest -m integration

# اختبارات الوحدة فقط
pytest -m unit

# استثناء الاختبارات البطيئة
pytest -m "not slow"
```

### مع Coverage

```bash
# تثبيت coverage
pip install pytest-cov

# تشغيل مع coverage
pytest --cov=apps --cov-report=html

# عرض التقرير
# افتح htmlcov/index.html في المتصفح
```

## Load Testing

### تثبيت Locust

```bash
pip install locust
```

### تشغيل Load Test

```bash
cd backend/tests/load
locust -f locustfile.py --host=http://localhost:8000
```

ثم افتح http://localhost:8089 في المتصفح.

## إعدادات الاختبار

الاختبارات تستخدم `backend/config/settings/test.py` الذي:
- يستخدم SQLite في الذاكرة للسرعة
- يعطل Migrations
- يعطل Cache
- يعطل Celery
- يعطل Email sending
- يعطل External APIs

## Fixtures المشتركة

جميع Fixtures المشتركة موجودة في `backend/tests/conftest.py`:
- `api_client`: API client للاختبارات
- `authenticated_client`: API client مع مصادقة
- `admin_user`: مستخدم admin
- `regular_user`: مستخدم عادي
- `staff_user`: مستخدم staff
- `category`: فئة تجريبية
- `product`: منتج تجريبي
- `branch`: فرع تجريبي
- `vendor`: مورد تجريبي
- `booking`: حجز تجريبي

## كتابة اختبارات جديدة

### مثال: Unit Test

```python
import pytest
from apps.products.models import Product

@pytest.mark.unit
@pytest.mark.django_db
class TestProductModel:
    def test_create_product(self, category):
        product = Product.objects.create(
            name='Test',
            name_ar='تجريبي',
            slug='test',
            category=category,
            price_per_day=1000.00,
            status='available'
        )
        assert product.name == 'Test'
```

### مثال: Integration Test

```python
import pytest
from rest_framework.test import APIClient
from rest_framework import status

@pytest.mark.integration
@pytest.mark.django_db
class TestProductAPI:
    def test_list_products(self, api_client):
        response = api_client.get('/api/products/')
        assert response.status_code == status.HTTP_200_OK
```

## أفضل الممارسات

1. **استخدم Fixtures**: استخدم fixtures من `conftest.py` بدلاً من إنشاء بيانات في كل test
2. **استخدم Markers**: ضع markers مناسبة (`@pytest.mark.unit`, `@pytest.mark.integration`, إلخ)
3. **استخدم Descriptive Names**: أسماء الاختبارات يجب أن تكون واضحة
4. **Test One Thing**: كل test يجب أن يختبر شيء واحد
5. **Clean Up**: استخدم `@pytest.mark.django_db` للتنظيف التلقائي

## CI/CD Integration

الاختبارات يمكن تشغيلها في CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    pytest --cov=apps --cov-report=xml
```

## المساعدة

للمزيد من المعلومات:
- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-django Documentation](https://pytest-django.readthedocs.io/)
- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)

