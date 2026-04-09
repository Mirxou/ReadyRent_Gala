@echo off
echo Testing single backend test...
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\backend"
python -m pytest tests/unit/test_payments_serializers.py::TestPaymentMethodSerializer::test_payment_method_serialization -v --tb=short
echo Test completed.
pause