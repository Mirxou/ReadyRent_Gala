@echo off
echo Testing single frontend test...
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\frontend"
call npm run test -- components/__tests__/product-card.test.tsx --watchAll=false --verbose
echo Test completed.
pause