import { NextRequest, NextResponse } from 'next/server';
import { faqs, products } from '@/lib/mock-data';

// AI-like responses for the chatbot
const quickResponses: Record<string, string> = {
  'مرحبا': 'مرحباً بك في ستاندرد رنت! كيف يمكنني مساعدتك اليوم؟ يمكنك السؤال عن المنتجات المتاحة، الأسعار، أو كيفية الحجز.',
  'سلام': 'وعليكم السلام! أهلاً بك في ستاندرد رنت. أنا هنا لمساعدتك في العثور على ملابس فاخرة للكراء.',
  'أسعار': 'أسعار الكراء تبدأ من 5,000 دج للبدلات الرجالية وتصل إلى 25,000 دج لفساتين الزفاف. يمكنك تصفح المنتجات لمعرفة الأسعار الدقيقة.',
  'حجز': 'للحجز، اختر المنتج الذي يعجبك، حدد تواريخ الكراء، ثم أكمل عملية الدفع. ستصلك تأكيدات الحجز عبر البريد الإلكتروني والرسائل النصية.',
  'توصيل': 'نوفر خدمة التوصيل لجميع الولايات الجزائرية. التوصيل مجاني للحجوزات التي تتجاوز 10,000 دج.',
  'إرجاع': 'يجب إرجاع القطعة في نفس الحالة التي استلمتها بها، نظيفة ومكوية. الإرجاع في الموعد المحدد لتجنب غرامات التأخير.',
  'أقفان': 'لدينا مجموعة رائعة من الأقفان الجزائرية بأسعار تبدأ من 13,000 دج. القفطان الملكي الذهبي من تلمسان هو الأكثر طلباً!',
  'زفاف': 'للزفاف ننصح بباقتنا الشاملة التي تشمل فستان الزفاف وبدلة العريس مع خصم 15%. يمكنكم أيضاً الاستفادة من خدمات الدليل المحلي للمصورين ومكياج العروس.',
  'تأمين': 'التأمين اختياري لكنه موصى به. يغطي الأضرار العرضية بتكلفة 5-10% من قيمة الكراء.',
  'دفع': 'نقبل الدفع عبر بطاقة بريديموب، التحويل البنكي (CCP)، والنقد عند الاستلام. جميع المعاملات محمية بنظام الوداعة الآمن.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message?.toLowerCase() || '';

    // Find a matching response
    let reply = 'شكراً لتواصلك مع ستاندرد رنت! يمكنني مساعدتك في: الأسعار، الحجز، التوصيل، الإرجاع، التأمين، طرق الدفع، والمنتجات المتاحة. ما الذي تريد معرفته؟';

    for (const [key, value] of Object.entries(quickResponses)) {
      if (message.includes(key)) {
        reply = value;
        break;
      }
    }

    // Check for product-related queries
    if (message.includes('فستان') || message.includes('زفاف')) {
      const weddingProducts = products.filter((p) => p.category_name === 'فساتين زفاف');
      reply += `\n\nلدينا ${weddingProducts.length} فساتين زفاف متاحة حالياً بأسعار تبدأ من ${Math.min(...weddingProducts.map((p) => p.price_per_day))} دج/اليوم.`;
    }

    if (message.includes('بدلة') || message.includes('رجل')) {
      const suitProducts = products.filter((p) => p.category_name === 'بدلات رجالية');
      reply += `\n\nلدينا ${suitProducts.length} بدلات رجالية متاحة بأسعار تبدأ من ${Math.min(...suitProducts.map((p) => p.price_per_day))} دج/اليوم.`;
    }

    const response = {
      status: 'sovereign_proceeding',
      code: 'RESOLUTION_DELIVERED',
      dignity_preserved: true,
      message_ar: 'تمت العملية بنجاح',
      message_en: 'Operation successful',
      data: {
        reply,
        reply_ar: reply,
        suggestions: ['الأسعار', 'كيفية الحجز', 'التوصيل', 'الإرجاع', 'باقات الزفاف'],
      },
    };

    return NextResponse.json(response);
  } catch {
    const errorResponse = {
      status: 'sovereign_proceeding',
      code: 'RESOLUTION_DELIVERED',
      dignity_preserved: true,
      message_ar: 'تمت العملية بنجاح',
      message_en: 'Operation successful',
      data: {
        reply: 'عذراً، لم أفهم سؤالك. يمكنك إعادة صياغته أو اختيار من الاقتراحات أدناه.',
        reply_ar: 'عذراً، لم أفهم سؤالك. يمكنك إعادة صياغته أو اختيار من الاقتراحات أدناه.',
        suggestions: ['الأسعار', 'كيفية الحجز', 'التوصيل', 'الإرجاع', 'باقات الزفاف'],
      },
    };
    return NextResponse.json(errorResponse);
  }
}