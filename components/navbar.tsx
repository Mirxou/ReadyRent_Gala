'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingCart, User, Menu, Moon, Sun, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/* Navigation Links */

const navSections = [
  {
    label: 'الكراء',
    href: '/rentals',
    children: [
      { label: 'كل المنتجات', href: '/products' },
      { label: 'صفحة الكراء', href: '/rentals' },
      { label: 'الحزم والعروض', href: '/bundles' },
    ],
  },
  {
    label: 'الخدمات',
    href: '/services',
    children: [
      { label: 'دليل الخدمات', href: '/services' },
      { label: 'الحرفيات', href: '/artisans' },
      { label: 'التأمين', href: '/insurance' },
    ],
  },
  {
    label: 'السوق',
    href: '/marketplace',
    children: [
      { label: 'صفحة السوق', href: '/marketplace' },
      { label: 'البائعون', href: '/vendors' },
      { label: 'الحرفيات', href: '/artisans' },
    ],
  },
];

const quickLinks = [
  { label: 'البحث الذكي', href: '/ai-search' },
  { label: 'المحفظة', href: '/wallet' },
  { label: 'الاشتراكات', href: '/subscriptions' },
  { label: 'نقاط الثقة', href: '/trust-score' },
];

/* Component */

export function Navbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!openDropdown) return;
    const close = () => setOpenDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openDropdown]);

  const handleLogout = () => { setLogoutDialogOpen(false); logout(); };

  return (
    <>
      <nav className="fixed top-0 w-full z-50">
        <div className={cn(
          'mx-auto h-14 flex items-center justify-between px-4 sm:px-6 transition-all duration-200',
          isScrolled
            ? 'max-w-6xl mt-3 mx-4 sm:mx-auto bg-background/80 backdrop-blur-xl border border-border rounded-full px-6 shadow-lg shadow-black/5 dark:shadow-black/20'
            : 'border-b border-border'
        )}>
          {/* Logo */}
          <Link href="/" className="shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-lg sm:text-xl font-black tracking-tighter text-sovereign-gold not-italic">
              STANDARD
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navSections.map((section) => (
              <div key={section.label} className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === section.label ? null : section.label)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-sovereign-gold transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                >
                  {section.label}
                  <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', openDropdown === section.label && 'rotate-180')} />
                </button>
                {openDropdown === section.label && (
                  <div className="absolute top-full right-0 mt-1.5 w-48 bg-popover backdrop-blur-xl border border-border rounded-xl p-1.5 shadow-xl">
                    {section.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-2 text-sm text-muted-foreground hover:text-sovereign-gold hover:bg-muted rounded-lg transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <span className="w-px h-4 bg-border mx-1" />

            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-sovereign-gold transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
                لوحة التحكم
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="تبديل المظهر"
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-sovereign-gold hover:bg-muted transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {isAuthenticated ? (
              <>
                <Link href="/cart" className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-sovereign-gold hover:bg-muted transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                </Link>
                <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-sovereign-gold hover:bg-muted transition-colors">
                  <User className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setLogoutDialogOpen(true)}
                  className="hidden lg:flex h-8 px-4 items-center rounded-full text-xs font-semibold bg-sovereign-gold text-sovereign-black hover:bg-sovereign-gold-light transition-colors"
                >
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
                  دخول
                </Link>
                <Link href="/register" className="hidden lg:flex h-8 px-5 items-center rounded-full text-xs font-semibold bg-sovereign-gold text-sovereign-black hover:bg-sovereign-gold-light transition-colors">
                  التسجيل
                </Link>
                <Link href="/login" className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-sovereign-gold hover:bg-muted transition-colors">
                  <User className="w-4 h-4" />
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="القائمة"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-[360px] bg-background border-l border-border overflow-y-auto">
          <SheetHeader className="pb-0">
            <SheetTitle className="text-xl font-black text-sovereign-gold not-italic tracking-tight">STANDARD</SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm">كراء · خدمات · سوق محلي</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col mt-8 text-right pb-8">
            {navSections.map((section) => (
              <div key={section.label} className="mb-1">
                <Link
                  href={section.href}
                  className="block text-base font-bold text-foreground hover:text-sovereign-gold transition-colors py-2.5 px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {section.label}
                </Link>
                {section.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 pr-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="border-t border-border my-4" />

            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <div className="border-t border-border my-4" />
                <Link href="/dashboard" className="block text-base font-bold text-foreground hover:text-sovereign-gold transition-colors py-2.5 px-2" onClick={() => setMobileMenuOpen(false)}>لوحة التحكم</Link>
                <Link href="/cart" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-2" onClick={() => setMobileMenuOpen(false)}>السلة</Link>
                <button onClick={() => { setMobileMenuOpen(false); setLogoutDialogOpen(true); }} className="w-full mt-6 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-semibold hover:bg-red-500/20 transition-colors">
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2.5 mt-6">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-center rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                  تسجيل الدخول
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-center rounded-xl bg-sovereign-gold text-sovereign-black text-sm font-semibold hover:bg-sovereign-gold-light transition-colors">
                  التسجيل
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Logout Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-sovereign-gold not-italic">تسجيل الخروج</DialogTitle>
            <DialogDescription className="text-muted-foreground">هل أنت متأكد أنك تريد تسجيل الخروج؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-center">
            <button onClick={() => setLogoutDialogOpen(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">إلغاء</button>
            <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-sm font-semibold hover:bg-red-500/20 transition-colors">تأكيد الخروج</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
