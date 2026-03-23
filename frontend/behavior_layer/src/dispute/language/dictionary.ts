
// The Language Dictionary - Approved Phrases Only
// No free text for system messages is allowed outside this file.

export const DISPUTE_PHRASES = {
    // 3.2 Language as Shelter
    INITIATION: {
        title: "طلب وساطة تقنية", // Not "شكوى"
        description: "نحن هنا لمساعدتكم في الوصول إلى حل عادل.",
    },
    // 3. Waiting States Taxonomy (Phase 29)
    WAITING: {
        PROTECTIVE: {
            title: "نراجع المعطيات بهدوء",
            desc: "فترة تهدئة لضمان سلامة القرار.",
        },
        PROCEDURAL: {
            title: "في انتظار خطوة الطرف الآخر",
            desc: "الصمت هنا احترام لحق الرد.",
        },
        JUDGMENT: {
            title: "القضية قيد التداول",
            desc: "المداولة تأخذ وقتها لضمان العدالة.",
        },
        KNOWLEDGE: {
            title: "المعطيات الحالية لا تسمح بتقدير زمني دقيق",
            desc: "نعتذر عن التقدير، ونعد بالدقة.",
        }
    },
    // 4. Resolution Language (Phase 30) - The Endings
    RESOLUTION: {
        VICTORY: {
            TITLE: "استعادة الحق", // Not "Congratulations"
            DESC: "تم تثبيت الادعاء وعودة التوازن.",
            ACTION: "أرشفة الحكم",
        },
        LOSS: {
            TITLE: "البيينة لم تكتمل", // Not "Failed"
            DESC: "الادعاء لم يستوفِ شروط الإثبات.",
            ACTION: "إغلاق الملف",
        },
        COMPROMISE: {
            TITLE: "توافق مرضي",
            DESC: "تم الوصول إلى حل وسط يحفظ حقوق الطرفين.",
            ACTION: "اعتماد التسوية",
        }
    },
    ERRORS: {
        // 6.1 Response Neutrality - No accusation
        TOO_FAST: "يرجى الانتظار قليلاً لضمان معالجة دقيقة.", // Not "Don't spam"
        INCOMPLETE: "المسار يحتاج إلى معطيات إضافية للمتابعة.", // Not "You failed"
        RISK_STOP: "تم تحويل المسار للمراجعة اليدوية لضمان الجودة.", // Not "Banned"
    },
    EVIDENCE: {
        TITLE: "تقديم الإثباتات",
        INSTRUCTION: "الوثيقة أصدق من الوصف. يرجى رفع الملفات الداعمة.",
        NO_TEXT: "المجال النصي مغلق. الصورة تغني عن الشرح.", // Friction Logic
        UPLOAD_BTN: "رفع وثيقة",
    }
} as const;

export type DisputePhraseKey = keyof typeof DISPUTE_PHRASES;
