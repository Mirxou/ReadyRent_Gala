أنت مراجع كود خبير بدقة المجهر. مهمتك: مراجعة الخطوة 2.4 (العقود والتوثيق) لمشروع STANDARD.Rent الجزائري.

## القواعد الصارمة:
- لا تعدل أي كود — مراجعة فقط
- ابحث عن: ثغرات أمنية، أخطاء منطقية، بيانات مفقودة، تناقضات مع المواصفات، أخطاء TypeScript، أخطاء تشغيلية (runtime)
- كل ID في Prisma هو String @id @default(cuid()) — لا Number()
- sovereignClient و apiFetch يلتقطان الأخطاء داخلياً ولا يرميانها أبداً
- Chargily Pay: بوابة دفع فقط (لا refund/payout/transfer API)
- القانون الجزائري 18-05: استرداد خلال 15 يوم، مادة 17: وصل استلام إلزامي

## نطاق الخطوة 2.4:
1. عقد رقمي تلقائي عند تأكيد الحجز (draft - signed)
2. محتوى العقد بالعربية (7 أقسام من 03-TRUST-SAFETY-SYSTEM.md)
3. contractHash (SHA-256) حتمي (no Date.now())
4. التوثيق (KYC) بحالته الحالية (face photo + community review, NO VLM)
5. لا نحتاج: VLM حقيقي، السجل القضائي

## المشاكل التي اكتشفتها وأحتاج تأكيداً/توسيعاً عليها:

### BUG 1: booking.depositAmount غير موجود في Prisma — حرج
الملفان: app/api/contracts/generate/route.ts:86 و app/api/payments/webhook/route.ts:222
كلاهما يمرران booking.depositAmount لكن نموذج Booking في Prisma لا يحتوي هذا الحقل.
Product.depositAmount موجود لكن Booking لا يحتويه.
النتيجة: depositAmount سيكون دائماً undefined — الوديعة لن تظهر في العقد.

### BUG 2: إشعار مكرر في webhook — متوسط
الملف: app/api/payments/webhook/route.ts
handlePaymentSuccess يُنشئ إشعار 'تم تأكيد الدفع' مرتين:
- المرة الأولى: سطور 148-156
- المرة الثانية: سطور 164-172
نفس المحتوى، نفس المستخدم.

### BUG 3: العقد لا يتحدث عند إلغاء الحجز — متوسط
الملف: app/api/bookings/[id]/cancel/route.ts
عند إلغاء حجز، حالة العقد تبقى 'draft' أو 'signed' ولا تتحول إلى 'expired'.

### BUG 4: contractData.id قد يكون null — حرج
الملف: app/bookings/[id]/page.tsx:398
contractData = booking.contracts?.[0] || null — لكن الرابط لعرض العقد لا يتحقق من null.
Link href={/contracts/${contractData.id}} — إذا لم يكن هناك عقد، هذا سيتسبب في crash.

### BUG 5: timelineContract يعرض 'signed' حتى لو العقد 'draft' — خفيف
الملف: app/bookings/[id]/page.tsx:174-198
المنطق: status = booking.status === 'cancelled' ? 'void' : contractData.status === 'finalized' ? 'finalized' : 'signed'
هذا يعني إذا العقد 'draft'، يُعرض كـ 'signed' في التايملاين.

### BUG 6: 9 أقسام في المواصفات مقابل 7 في التنفيذ — خفيف
المواصفات (03-TRUST-SAFETY-SYSTEM.md) تذكر 9 أقسام: بيانات الأطراف، المنتج المؤجر، مدة الإيجار، التكلفة (منفصل)، شروط الاستخدام، شروط الإرجاع، حالة الضمان، حل النزاعات، التوقيع الرقمي.
التنفيذ (lib/contract-terms.ts) يدمج التكلفة في مدة الإيجار ويحذف بند التوقيع الرقمي.

### BUG 7: contract sign API لا يتحقق من سلامة الهاش — متوسط
الملف: app/api/contracts/[id]/sign/route.ts
قبل السماح بالتوقيع، يجب إعادة حساب الهاش من terms والمقارنة مع contractHash المخزن.
إذا تم التلاعب بـ contract.terms في DB، لن يُكتشف.

### BUG 8: contract viewer has redundant state variables — خفيف
الملف: components/contract/contract-viewer.tsx:59-60
isSigning و signing هما حالتان مختلفتان لنفس الغرض.

### BUG 9: contract timeline dead code — خفيف
الملف: components/contract/contract-timeline.tsx:124
snap.escrow_status === 'HELD' (uppercase) — DB تستخدم lowercase 'held'. هذا كود ميت.

### BUG 10: KYC base64 photo in SQLite — خفيف (معروف، مقبول لـ MVP)
الملف: app/api/verification/submit/route.ts
facePhoto يُخزن كـ base64 كامل في SQLite — يمكن أن يكون 5MB.

### BUG 11: snapshot في webhook يحتوي deposit_amount لكن generate لا يحتويه — خفيف
webhook snapshot: deposit_amount: booking.depositAmount
generate snapshot: لا يحتوي deposit_amount
تناقض بين نسختي إنشاء العقد.

## المطلوب:
1. هل كل هذه المشاكل صحيحة؟ هل هناك إيجابيات زائفة؟
2. هل فاتني مشاكل أخرى؟ ركز على:
   - مشاكل أمنية (IDOR, injection, tampering)
   - أخطاء TypeScript صامتة
   - حالات edge case (null/undefined chains)
   - تناقضات بين API routes مختلفة
   - مشاكل في تدفق البيانات بين frontend و backend
3. صنّف كل مشكلة (حرج/متوسط/خفيف) مع الملف والسطر والحل المقترح
4. رتّب حسب الأولوية للإصلاح