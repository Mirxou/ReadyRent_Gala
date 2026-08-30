import crypto from 'crypto';

interface ContractTermsData {
  renterName: string;
  renterEmail: string;
  renterPhone: string | null;
  vendorName: string;
  vendorEmail: string;
  productName: string;
  productDescription: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  depositAmount?: number;
  currency?: string;
}

export function generateContractTerms(data: ContractTermsData): string {
  const days = Math.max(1, Math.ceil(
    (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const dailyPrice = Math.round(data.totalPrice / days);
  const currency = data.currency || 'د.ج';

  const sections = [
    `بند 1: بيانات الأطراف`,
    `المستأجر: ${data.renterName}
البريد الإلكتروني: ${data.renterEmail}
الهاتف: ${data.renterPhone || 'غير محدد'}

المؤجر: ${data.vendorName}
البريد الإلكتروني: ${data.vendorEmail}`,

    `بند 2: المنتج المؤجر`,
    `المنتج: ${data.productName}
${data.productDescription ? `الوصف: ${data.productDescription}` : ''}

يقر المستأجر بأنه اطلع على حالة المنتج ووافق على تأجيره كما هو.`,

    `بند 3: مدة الإيجار`,
    `تاريخ البداية: ${data.startDate}
تاريخ النهاية: ${data.endDate}
المدة: ${days} يوم`,

    `بند 4: التكلفة`,
    `السعر اليومي: ${dailyPrice.toLocaleString('ar-DZ')} ${currency}
الإجمالي: ${data.totalPrice.toLocaleString('ar-DZ')} ${currency}${data.depositAmount ? `\nالوديعة: ${data.depositAmount.toLocaleString('ar-DZ')} ${currency}` : ''}`,

    `بند 5: شروط الاستخدام`,
    `يتعهد المستأجر باستخدام المنتج وفقًا للغرض المحدد وبحالة جيدة.
لا يجوز للمستأجر إعادة تأجير المنتج أو تفويض استخدامه لطرف ثالث دون موافقة كتابية من المؤجر.
المستأجر مسؤول عن أي تلف ينتج عن الاستخدام غير السليم أو الإهمال.
في حالة التلف، يحق للمؤجر المطالبة بقيمة الإصلاح أو الاستبدال.`,

    `بند 6: شروط الإرجاع`,
    `يُرجَع المنتج في نفس الحالة التي استُلِم بها أو في حالة مماثلة مع مراعاة الاستهلاك الطبيعي.
يتم الفحص المشترك عند الاستلام والإرجاع.
في حالة التأخر عن الإرجاع، يتحمل المستأجر رسوم تأخير تعادل قيمة إيجار يوم إضافي عن كل يوم تأخير.`,

    `بند 7: الضمان والتأمين`,
    `يتم حجز المبلغ المالي في حساب الضمان (Escrow) الخاص بالمنصة.
يتم تحرير المبلغ للمؤجر بعد تأكيد المستأجر بالاستلام ورضاه عن حالة المنتج.
في حالة نزاع، يُحتجز المبلغ حتى يتم الفصل في النزاع وفقًا لنظام المنصة.`,

    `بند 8: حل النزاعات`,
    `في حالة نزاع، يُلجأ أولاً لنظام النزاعات في المنصة.
يتم تبادل الرسائل والأدلة بين الطرفين خلال 48 ساعة.
إذا لم يتم التوصل لحل ودي، يتدخل فريق الدعم لاتخاذ قرار نهائي.
يخضع هذا العقد للقانون الجزائري رقم 18-05 المتعلق بالتجارة الإلكترونية.`,

    `بند 9: التوقيع الرقمي`,
    `بتوقيع هذا العقد إلكترونيًا، يُقر الطرفان بأنهما اطلعا على جميع البنود المذكورة أعلاه ويوافقان عليها.
التوقيع الرقمي يُسجَّل مع عنوان IP والتاريخ والوقت ويُعتبر بمثابة توقيع إلكتروني معتمد وفقًا للقانون الجزائري.`,
  ];

  return sections.join('\n\n---\n\n');
}

export function computeContractHash(terms: string, bookingId: string): string {
  // Deterministic: uses ONLY terms + bookingId — no Date, no timestamp
  // This ensures the hash is stable across days and verifiable later
  return crypto.createHash('sha256').update(`${bookingId}:${terms}`, 'utf8').digest('hex');
}

/**
 * Compute contract hash from raw booking fields (used by release-escrow for verification).
 * MUST match the output of computeContractHash(terms, bookingId) when terms are generated
 * from the same booking fields.
 */
export function computeContractHashFromBooking(fields: {
  bookingId: string;
  renterName: string;
  renterEmail: string;
  vendorName: string;
  vendorEmail: string;
  productName: string;
  productDescription: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  depositAmount?: number;
}): string {
  const terms = generateContractTerms(fields);
  return computeContractHash(terms, fields.bookingId);
}
