import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ═══════════════════════════════════════════════════════════════════
// Chatbot LLM Chat API — AI-powered conversational assistant
// Uses z-ai-web-dev-sdk for LLM completions
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `أنت المساعد الذكي لمنصة STANDARD.Rent، منصة الإيجار الفاخر الأولى في الجزائر.

مهمتك:
- مساعدة المستخدمين في الاستفسارات عن المنتجات، الحجوزات، الأسعار، والخدمات
- تقديم معلومات عن خدمات المناسبات: حفلات الزفاف، التصوير، الدي جي، المكياج، تنسيق الزهور
- شرح نظام الضمان والتأمين المتوفر على المنصة
- مساعدة في استخدام حساب المستخدم وإدارة الحجوزات
- الإجابة عن أسئلة الدفع عبر نظام الضمان (Escrow) وباريديموب
- شرح نظام نقاط الثقة (Trust Score) وكيفية بناء السمعة
- مساعدة في الإرجاع والنزاعات

قواعد مهمة:
- أجب بنفس لغة المستخدم (العربية أو الإنجليزية)
- كن ودوداً، مهنياً، ومختصراً
- لا تخترع معلومات غير متأكد منها
- إذا لم تكن متأكداً، أرشد المستخدم لصفحة الاتصال بنا أو الواتساب
- استخدم لغة عربية فصيحة ومناسبة
- لا تذكر أنك ذكاء اصطناعي أو نموذج لغوي

مميزات المنصة:
- إيجار فساتين زفاف وقفطان جزائري وبدلات رجالية وجلابيات فاخرة وقرطاسيات
- خدمات مناسبات شاملة (زفاف، تصوير، موسيقى، مكياج، زهور)
- نظام ضمان شامل: عقد إلكتروني، تأمين ضد التلف، دفع بالضمان
- نظام نقاط ثقة لكل مستخدم وبائع
- محفظة رقمية مع دعم باريديموب
- توصيل في معظم المدن الجزائرية`;

// In-memory conversation history (Map<sessionId, messages[]>)
const conversationHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

const MAX_HISTORY_MESSAGES = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, language = 'ar' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: language === 'ar' ? 'الرسالة مطلوبة' : 'Message is required',
        },
        { status: 400 }
      );
    }

    // Resolve or generate session ID
    const sid = sessionId || crypto.randomUUID();

    // Get or create conversation history
    if (!conversationHistory.has(sid)) {
      conversationHistory.set(sid, []);
    }
    const history = conversationHistory.get(sid)!;

    // Build messages array for LLM
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'assistant', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message },
    ];

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      });

      const responseText = completion.choices?.[0]?.message?.content;

      if (!responseText) {
        throw new Error('Empty response from LLM');
      }

      // Update conversation history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: responseText });

      // Trim history to last MAX_HISTORY_MESSAGES messages (keep pairs)
      while (history.length > MAX_HISTORY_MESSAGES) {
        history.shift();
        history.shift(); // Remove both user and assistant message (pairs)
      }

      return NextResponse.json({
        success: true,
        dignity_preserved: true,
        data: {
          response: responseText,
          sessionId: sid,
        },
      });
    } catch (llmError) {
      console.error('LLM Error:', llmError);

      // Fallback: use rule-based response
      const fallbackResponse = getFallbackResponse(message, language);

      return NextResponse.json({
        success: true,
        dignity_preserved: true,
        data: {
          response: fallbackResponse,
          sessionId: sid,
          fallback: true,
        },
      });
    }
  } catch (error) {
    console.error('Chat API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'عذراً، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.',
      },
      { status: 500 }
    );
  }
}

function getFallbackResponse(message: string, language: string): string {
  const msg = message.toLowerCase();

  if (language === 'ar' || msg.match(/[\u0600-\u06FF]/)) {
    if (msg.includes('سعر') || msg.includes('ثمن') || msg.includes('تكلفة'))
      return 'أسعارنا تختلف حسب المنتج والمدة المطلوبة. يمكنك زيارة صفحة المنتجات لمزيد من التفاصيل.';
    if (msg.includes('حجز') || msg.includes('إيجار') || msg.includes('كيف أحجز'))
      return 'يمكنك حجز أي منتج من صفحة المنتج مباشرة. اختر التاريخ والمدة واختر مقاسك ولونك المفضل، ثم اتبع خطوات الحجز.';
    if (msg.includes('توصيل') || msg.includes('شحن'))
      return 'نوفر خدمة التوصيل في معظم المدن الجزائرية. يمكنك التحقق من مناطق التوصيل المتاحة من صفحة المنتج.';
    if (msg.includes('إرجاع') || msg.includes('استرجاع'))
      return 'يمكنك طلب إرجاع المنتج من خلال صفحة الحجوزات في حسابك. سنقوم بترتيب استلام المنتج وإعادة المبلغ.';
    if (msg.includes('مرحب') || msg.includes('سلام') || msg.includes('هاي') || msg.includes('أهلا'))
      return 'مرحباً بك في STANDARD.Rent! كيف يمكنني مساعدتك اليوم؟';
    if (msg.includes('ضمان') || msg.includes('تأمين'))
      return 'نوفر نظام ضمان شامل: عقد إلكتروني، تأمين ضد التلف، ونظام دفع بالضمان (Escrow) لحماية أموالك.';
    if (msg.includes('تواصل') || msg.includes('اتصل'))
      return 'يمكنك التواصل معنا عبر الواتساب أو صفحة اتصل بنا. فريقنا متاح لمساعدتك.';
    return 'شكراً لتواصلك مع STANDARD.Rent! يمكنني مساعدتك في المنتجات والحجوزات والتوصيل والضمان وأي استفسار آخر.';
  }

  if (msg.includes('price') || msg.includes('how much') || msg.includes('cost'))
    return 'Our prices vary by product and rental duration. Visit our products page for full details.';
  if (msg.includes('book') || msg.includes('rent'))
    return 'You can book any product directly from its page. Select dates, size, and color, then follow the booking steps.';
  if (msg.includes('deliver') || msg.includes('ship'))
    return 'We offer delivery across most Algerian cities. Check available zones from the product page.';
  if (msg.includes('return') || msg.includes('refund'))
    return 'You can request a return through your bookings page. We\'ll arrange pickup and refund.';
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey'))
    return 'Welcome to STANDARD.Rent! How can I help you today?';
  if (msg.includes('insurance') || msg.includes('guarantee'))
    return 'We provide comprehensive protection: digital contracts, damage insurance, and escrow payments.';
  if (msg.includes('contact') || msg.includes('support'))
    return 'You can reach us via WhatsApp or our Contact page.';
  return 'Thank you for contacting STANDARD.Rent! I can help with products, bookings, delivery, insurance, and more.';
}