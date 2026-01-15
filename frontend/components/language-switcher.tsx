'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguageStore } from '@/lib/store';
import { languages } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  // Update document attributes when language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = currentLanguage.dir;
    }
  }, [language, currentLanguage.dir]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        aria-label="تغيير اللغة"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute top-full right-0 mt-2 w-40 bg-background border border-gray-200 dark:border-white/20 rounded-lg shadow-lg z-50"
            role="menu"
            aria-label="خيارات اللغة"
          >
            <div className="p-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-right',
                    language === lang.code && 'bg-accent font-semibold'
                  )}
                  role="menuitem"
                  aria-label={`تغيير اللغة إلى ${lang.nativeName}`}
                >
                  <span>{lang.nativeName}</span>
                  {language === lang.code && (
                    <span className="text-primary" aria-hidden="true">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
