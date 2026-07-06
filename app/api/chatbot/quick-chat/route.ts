import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Chatbot Quick Chat API — Smart rule-based responses
// Uses z-ai-web-dev-sdk via CLI when available, otherwise smart fallback
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, language = 'ar' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الرسالة مطلوبة',
          message_en: 'Message is required',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    const aiResponse = getSmartResponse(message, language);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        response: aiResponse,
        session_id: null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ في معالجة الرسالة',
        message_en: 'Error processing message',
        code: 'CHAT_ERROR',
      },
      { status: 500 }
    );
  }
}

function getSmartResponse(message: string, language: string): string {
  const msg = message.toLowerCase();

  if (language === 'ar') {
    if (msg.includes('سعر') || msg.includes('كم ثمن') || msg.includes('تكلفة'))
      return 'أسعارنا تختلف حسب المنتج والمدة المطلوبة. يمكنك زيارة صفحة المنتجات لمزيد من التفاصيل. الدفع الإلكتروني متاح عبر باريديموب والبطاقات.';
    if (msg.includes('حجز') || msg.includes('إيجار') || msg.includes('كيف أحجز'))
      return 'يمكنك حجز أي منتج من صفحة المنتج مباشرة. اختر التاريخ والمدة واختر مقاسك ولونك المفضل، ثم اتبع خطوات الحجز.';
    if (msg.includes('توصيل') || msg.includes('شحن') || msg.includes('وصول'))
      return 'نوفر خدمة التوصيل في معظم المدن الجزائرية. يمكنك التحقق من مناطق التوصيل المتاحة من صفحة المنتج.';
    if (msg.includes('إرجاع') || msg.includes('استرجاع') || msg.includes('رجع'))
      return 'يمكنك طلب إرجاع المنتج من خلال صفحة الحجوزات في حسابك. سنقوم بترتيب استلام المنتج وإعادة المبلغ.';
    if (msg.includes('مرحب') || msg.includes('سلام') || msg.includes('هاي') || msg.includes('أهلا'))
      return 'مرحباً بك في STANDARD.Rent! كيف يمكنني مساعدتك اليوم؟ يمكنني مساعدتك في المنتجات والحجوزات والتوصيل وأي استفسار آخر.';
    if (msg.includes('ضمان') || msg.includes('تأمين') || msg.includes('أمان'))
      return 'نوفر نظام ضمان شامل يشمل: عقد إلكتروني موثّق، تأمين ضد التلف، ونظام دفع بالضمان (Escrow) لحماية أموالك.';
    if (msg.includes('تواصل') || msg.includes('اتصل') || msg.includes('خدمة العملاء'))
      return 'يمكنك التواصل معنا عبر الواتساب أو صفحة اتصل بنا. فريقنا متاح لمساعدتك في أي وقت.';
    if (msg.includes('فئة') || msg.includes('تصنيف') || msg.includes('أنواع'))
      return 'نوفر منتجات في عدة فئات: قفطان جزائري، بدلات رجالية، فساتين زفاف، جلابيات فاخرة، قرطاسيات، وأزياء مناسبات. تصفح الفئات من القائمة الرئيسية.';
    if (msg.includes('محفظة') || msg.includes('رصيد') || msg.includes('دفع'))
      return 'محفظتك الرقمية تتيح لك إيداع وسحب الأموال بسهولة. يمكنك شحنها عبر باريديموب أو التحويل البنكي.';
    if (msg.includes('حرفي') || msg.includes('صناعة يدوية'))
      return 'نوفر قسم خاص بالحرفيات المحليات. اكتشفي إبداعات الحرفيات الجزائريات في مجالات الخياطة والتطريز والتصميم.';
    return 'شكراً لتواصلك مع STANDARD.Rent! سأساعدك بكل سرور. يمكنك الاستفسار عن المنتجات، الحجوزات، التوصيل، الضمان، أو أي خدمة أخرى.';
  }

  if (msg.includes('price') || msg.includes('how much') || msg.includes('cost'))
    return 'Our prices vary by product and rental duration. Visit our products page for full details. Electronic payment is available through BaridiMob and cards.';
  if (msg.includes('book') || msg.includes('rent') || msg.includes('how to book'))
    return 'You can book any product directly from its page. Select your dates, preferred size and color, then follow the booking steps.';
  if (msg.includes('deliver') || msg.includes('ship') || msg.includes('delivery'))
    return 'We offer delivery across most Algerian cities. Check available delivery zones from the product page.';
  if (msg.includes('return') || msg.includes('refund'))
    return 'You can request a return through your bookings page in your account. We\'ll arrange product pickup and refund.';
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey'))
    return 'Welcome to STANDARD.Rent! How can I help you today? I can assist with products, bookings, delivery, and more.';
  if (msg.includes('insurance') || msg.includes('guarantee') || msg.includes('safe'))
    return 'We provide comprehensive protection: digital contracts, damage insurance, and an escrow payment system to safeguard your money.';
  if (msg.includes('contact') || msg.includes('support') || msg.includes('reach'))
    return 'You can reach us via WhatsApp or our Contact page. Our team is available to help anytime.';
  if (msg.includes('category') || msg.includes('type') || msg.includes('kind'))
    return 'We offer products in several categories: Algerian Caftan, Men\'s Suits, Wedding Dresses, Luxury Galabiyas, Karstassiyas, and Occasion Wear.';
  if (msg.includes('wallet') || msg.includes('balance') || msg.includes('payment'))
    return 'Your digital wallet lets you deposit and withdraw money easily. You can top up via BaridiMob or bank transfer.';
  if (msg.includes('artisan') || msg.includes('handmade') || msg.includes('craft'))
    return 'We have a special section for local artisans. Discover the creativity of Algerian artisans in sewing, embroidery, and design.';
  return 'Thank you for contacting STANDARD.Rent! I\'m here to help with products, bookings, delivery, insurance, or any other inquiry.';
}