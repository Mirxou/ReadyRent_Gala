// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Email HTML Templates (Arabic-first)
// RTL-ready templates for: welcome, booking confirmation,
// password reset, verification approved
// ═══════════════════════════════════════════════════════════════

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://standardrent.dz';

function wrapper(inner: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STANDARD.Rent</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        ${header()}
        <tr><td style="padding:32px 40px;">
          ${inner}
        </td></tr>
        ${footer()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function header(): string {
  return `<tr>
  <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px 40px;text-align:center;">
    <h1 style="margin:0;color:#d4a853;font-size:24px;font-weight:700;letter-spacing:1px;">STANDARD.Rent</h1>
  </td>
</tr>`;
}

function footer(): string {
  return `<tr>
  <td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #e4e4e7;">
    <p style="margin:0 0 4px;color:#71717a;font-size:13px;">© ${new Date().getFullYear()} STANDARD.Rent — جميع الحقوق محفوظة</p>
    <p style="margin:0;color:#a1a1aa;font-size:12px;">${BASE_URL}</p>
  </td>
</tr>`;
}

function button(label: string, href: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td align="center">
    <a href="${href}" target="_blank" style="display:inline-block;background:#d4a853;color:#1a1a2e;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">${label}</a>
  </td></tr>
</table>`;
}

// ──── Welcome Email ────
export function welcomeEmail(name: string): string {
  return wrapper(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">مرحباً ${name}! 👋</h2>
    <p style="margin:0 0 12px;color:#3f3f46;font-size:15px;line-height:1.7;">
      نشكرك على انضمامك إلى <strong>STANDARD.Rent</strong> — منصة تأجير السيارات الأولى في الجزائر.
    </p>
    <p style="margin:0 0 12px;color:#3f3f46;font-size:15px;line-height:1.7;">
      يمكنك الآن استعراض السيارات المتاحة، حجزها بسهولة، وإدارة كل شيء من لوحة التحكم الخاصة بك.
    </p>
    <ul style="margin:0 0 20px;padding-right:20px;color:#3f3f46;font-size:15px;line-height:2;">
      <li>🔍 استكشف تشكيلة واسعة من السيارات</li>
      <li>📋 احجز بسهولة في بضع نقرات</li>
      <li>💰 أدفع بأمان عبر طرق دفع متعددة</li>
      <li>📍 تتبع حجزك في الوقت الحقيقي</li>
    </ul>
    ${button('ابدأ الآن', `${BASE_URL}`)}
    <p style="margin:0;color:#a1a1aa;font-size:13px;">
      إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.
    </p>
  `);
}

// ──── Booking Confirmation ────
export function bookingConfirmationEmail(
  name: string,
  bookingDetails: {
    bookingId: string;
    carName: string;
    startDate: string;
    endDate: string;
    totalPrice: string;
    pickupLocation: string;
  }
): string {
  const { bookingId, carName, startDate, endDate, totalPrice, pickupLocation } = bookingDetails;
  return wrapper(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">تم تأكيد حجزك بنجاح ✅</h2>
    <p style="margin:0 0 20px;color:#3f3f46;font-size:15px;line-height:1.7;">
      مرحباً ${name}، تم تأكيد حجزك بنجاح. إليك تفاصيل الحجز:
    </p>
    <table width="100%" cellpadding="12" cellspacing="0" style="background:#fafafa;border-radius:8px;margin-bottom:24px;border:1px solid #e4e4e7;">
      <tr>
        <td style="color:#71717a;font-size:14px;padding:8px 12px;border-bottom:1px solid #e4e4e7;">رقم الحجز</td>
        <td style="color:#1a1a2e;font-size:14px;font-weight:600;padding:8px 12px;border-bottom:1px solid #e4e4e7;text-align:left;direction:ltr;">#${bookingId}</td>
      </tr>
      <tr>
        <td style="color:#71717a;font-size:14px;padding:8px 12px;border-bottom:1px solid #e4e4e7;">السيارة</td>
        <td style="color:#1a1a2e;font-size:14px;font-weight:600;padding:8px 12px;border-bottom:1px solid #e4e4e7;">${carName}</td>
      </tr>
      <tr>
        <td style="color:#71717a;font-size:14px;padding:8px 12px;border-bottom:1px solid #e4e4e7;">تاريخ البداية</td>
        <td style="color:#1a1a2e;font-size:14px;font-weight:600;padding:8px 12px;border-bottom:1px solid #e4e4e7;">${startDate}</td>
      </tr>
      <tr>
        <td style="color:#71717a;font-size:14px;padding:8px 12px;border-bottom:1px solid #e4e4e7;">تاريخ النهاية</td>
        <td style="color:#1a1a2e;font-size:14px;font-weight:600;padding:8px 12px;border-bottom:1px solid #e4e4e7;">${endDate}</td>
      </tr>
      <tr>
        <td style="color:#71717a;font-size:14px;padding:8px 12px;border-bottom:1px solid #e4e4e7;">مكان الاستلام</td>
        <td style="color:#1a1a2e;font-size:14px;font-weight:600;padding:8px 12px;border-bottom:1px solid #e4e4e7;">${pickupLocation}</td>
      </tr>
      <tr>
        <td style="color:#71717a;font-size:14px;padding:8px 12px;">المبلغ الإجمالي</td>
        <td style="color:#d4a853;font-size:16px;font-weight:700;padding:8px 12px;">${totalPrice} د.ج</td>
      </tr>
    </table>
    ${button('عرض التفاصيل', `${BASE_URL}/dashboard/bookings`)}
    <p style="margin:0;color:#a1a1aa;font-size:13px;">تأكد من الوصول في الموعد المحدد لاستلام السيارة.</p>
  `);
}

// ──── Password Reset ────
export function passwordResetEmail(name: string, resetLink: string): string {
  return wrapper(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">إعادة تعيين كلمة المرور 🔐</h2>
    <p style="margin:0 0 12px;color:#3f3f46;font-size:15px;line-height:1.7;">
      مرحباً ${name}،
    </p>
    <p style="margin:0 0 20px;color:#3f3f46;font-size:15px;line-height:1.7;">
      تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط على الزر أدناه لتعيين كلمة مرور جديدة. هذا الرابط صالح لمدة ساعة واحدة فقط.
    </p>
    ${button('إعادة تعيين كلمة المرور', resetLink)}
    <p style="margin:20px 0 0;color:#a1a1aa;font-size:13px;">
      إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة — لن يتم تغيير أي شيء.
    </p>
    <p style="margin:8px 0 0;color:#a1a1aa;font-size:12px;direction:ltr;text-align:left;">
      ${resetLink}
    </p>
  `);
}

// ──── Verification Approved ────
export function verificationApprovedEmail(name: string): string {
  return wrapper(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">تهانينا! تم قبول طلب التحقق الخاص بك 🎉</h2>
    <p style="margin:0 0 12px;color:#3f3f46;font-size:15px;line-height:1.7;">
      مرحباً ${name}،
    </p>
    <p style="margin:0 0 12px;color:#3f3f46;font-size:15px;line-height:1.7;">
      تم مراجعة وثائقك وقبولها بنجاح. أنت الآن مستخدم <strong>موثّق</strong> في STANDARD.Rent.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#166534;font-size:14px;line-height:1.7;">
        ✅ <strong>مزايا الحساب الموثّق:</strong>
      </p>
      <ul style="margin:8px 0 0;padding-right:20px;color:#166534;font-size:14px;line-height:2;">
        <li>ثقة أعلى لدى مالكي السيارات</li>
        <li>أولوية في الحجوزات</li>
        <li>حدود دفع مرتفعة</li>
        <li>شارة التوثيق على ملفك الشخصي</li>
      </ul>
    </div>
    ${button('اذهب إلى ملفي الشخصي', `${BASE_URL}/dashboard/settings`)}
    <p style="margin:0;color:#a1a1aa;font-size:13px;">شكراً لثقتك في STANDARD.Rent.</p>
  `);
}
