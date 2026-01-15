/**
 * Simple i18n implementation for ReadyRent.Gala
 * Supports Arabic (ar), French (fr), and English (en)
 */

export type Language = 'ar' | 'fr' | 'en';

export const languages: { code: Language; name: string; nativeName: string; dir: 'rtl' | 'ltr' }[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
];

// Simple translations object
export const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.products': 'المنتجات',
    'nav.about': 'من نحن',
    'nav.contact': 'اتصل بنا',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'إنشاء حساب',
    'nav.dashboard': 'لوحة التحكم',
    'nav.logout': 'تسجيل الخروج',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'تم بنجاح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    
    // Products
    'products.title': 'المنتجات',
    'products.addToCart': 'إضافة إلى السلة',
    'products.viewDetails': 'عرض التفاصيل',
    'products.price': 'السعر',
    'products.perDay': 'في اليوم',
    'products.rating': 'التقييم',
    'products.available': 'متوفر',
    'products.unavailable': 'غير متوفر',
    
    // Cart
    'cart.title': 'السلة',
    'cart.empty': 'السلة فارغة',
    'cart.checkout': 'الدفع',
    'cart.total': 'المجموع',
    
    // Booking
    'booking.title': 'الحجوزات',
    'booking.status': 'الحالة',
    'booking.startDate': 'تاريخ البداية',
    'booking.endDate': 'تاريخ النهاية',
  },
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.products': 'Produits',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'nav.register': 'Créer un compte',
    'nav.dashboard': 'Tableau de bord',
    'nav.logout': 'Déconnexion',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    
    // Products
    'products.title': 'Produits',
    'products.addToCart': 'Ajouter au panier',
    'products.viewDetails': 'Voir les détails',
    'products.price': 'Prix',
    'products.perDay': 'par jour',
    'products.rating': 'Note',
    'products.available': 'Disponible',
    'products.unavailable': 'Indisponible',
    
    // Cart
    'cart.title': 'Panier',
    'cart.empty': 'Le panier est vide',
    'cart.checkout': 'Paiement',
    'cart.total': 'Total',
    
    // Booking
    'booking.title': 'Réservations',
    'booking.status': 'Statut',
    'booking.startDate': 'Date de début',
    'booking.endDate': 'Date de fin',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    
    // Products
    'products.title': 'Products',
    'products.addToCart': 'Add to Cart',
    'products.viewDetails': 'View Details',
    'products.price': 'Price',
    'products.perDay': 'per day',
    'products.rating': 'Rating',
    'products.available': 'Available',
    'products.unavailable': 'Unavailable',
    
    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Cart is empty',
    'cart.checkout': 'Checkout',
    'cart.total': 'Total',
    
    // Booking
    'booking.title': 'Bookings',
    'booking.status': 'Status',
    'booking.startDate': 'Start Date',
    'booking.endDate': 'End Date',
  },
};

export function getTranslation(key: string, lang: Language = 'ar'): string {
  return translations[lang][key] || key;
}

export function t(key: string, lang: Language = 'ar'): string {
  return getTranslation(key, lang);
}
