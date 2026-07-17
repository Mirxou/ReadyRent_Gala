'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingCart, User, Menu, Moon, Sun, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, useScroll } from 'framer-motion';
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
} from "@/components/ui/dialog";

/* ═══════════════════════════════════════
   Navigation Structure — 3-in-1
   ═══════════════════════════════════════ */

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
  { label: 'السجل القضائي', href: '/judicial' },
];

export function Navbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();

  // setMounted: standard Next.js hydration pattern — React compiler warning is a false positive
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openDropdown]);

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  return (
    <>
      <nav
        className={cn(
          "fixed w-full z-50 transition-all duration-700 ease-in-out",
          isScrolled
            ? "top-4 px-4 h-16"
            : "top-0 px-0 h-20"
        )}
      >
        <div className={cn(
          "container mx-auto h-full transition-all duration-700",
          isScrolled
            ? "bg-background/95 dark:bg-black/40 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-full px-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            : "bg-transparent px-4"
        )}>
          <div className="flex h-full items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group" onClick={() => setMobileMenuOpen(false)}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-sovereign-gold to-sovereign-gold rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <span className="relative text-2xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-sovereign-gold via-sovereign-gold to-sovereign-gold dark:from-white dark:via-white dark:to-white/40 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  STANDARD
                </span>
              </div>
            </Link>

            {/* Desktop Navigation — 3-in-1 Sections + Quick Links */}
            <div className="hidden xl:flex items-center gap-1">
              {navSections.map((section) => (
                <div
                  key={section.label}
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setOpenDropdown(openDropdown === section.label ? null : section.label)}
                    className="flex items-center gap-1 text-sm font-medium text-foreground dark:text-white/90 hover:text-sovereign-gold dark:hover:text-sovereign-gold transition-all px-3 py-2 rounded-full hover:bg-sovereign-gold/5"
                  >
                    {section.label}
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openDropdown === section.label && "rotate-180")} />
                  </button>
                  {openDropdown === section.label && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-background/95 dark:bg-black/90 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50">
                      {section.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-3 text-sm text-foreground dark:text-white/80 hover:text-sovereign-gold dark:hover:text-sovereign-gold hover:bg-sovereign-gold/5 rounded-xl transition-all"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2" />

              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-sovereign-gold dark:hover:text-sovereign-gold transition-all px-3 py-2 rounded-full hover:bg-sovereign-gold/5"
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && (
                <Link href="/dashboard" className="text-sm font-medium text-foreground dark:text-white/90 hover:text-sovereign-gold dark:hover:text-sovereign-gold transition-all px-3 py-2 rounded-full hover:bg-sovereign-gold/5">
                  لوحة التحكم
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 xl:space-x-4">
              <LanguageSwitcher />

              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="تبديل المظهر"
                  className="rounded-full hover:bg-sovereign-gold/10 text-foreground dark:text-white/90 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-sovereign-gold" />
                  ) : (
                    <Moon className="h-5 w-5 text-sovereign-gold" />
                  )}
                </Button>
              )}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Link href="/cart">
                    <Button variant="ghost" size="icon" className="relative group rounded-full hover:bg-sovereign-gold/10 text-foreground dark:text-white/90">
                      <ShoppingCart className="h-5 w-5 group-hover:text-sovereign-gold transition-colors" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-sovereign-gold/10 text-foreground dark:text-white/90">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    onClick={() => setLogoutDialogOpen(true)}
                    className="hidden xl:flex rounded-full bg-gradient-to-r from-sovereign-gold to-sovereign-gold hover:opacity-90 transition-all font-semibold"
                  >
                    خروج
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login" className="hidden xl:block">
                    <Button variant="ghost" className="rounded-full hover:bg-sovereign-gold/10">دخول</Button>
                  </Link>
                  <Link href="/register" className="hidden xl:block">
                    <Button className="rounded-full bg-gradient-to-r from-sovereign-gold to-sovereign-gold hover:opacity-90 shadow-lg font-semibold">
                      التسجيل
                    </Button>
                  </Link>
                  <Link href="/login" className="xl:hidden">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-sovereign-gold/10 text-foreground dark:text-white/90">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="xl:hidden flex items-center gap-2">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-full text-foreground dark:text-white/90"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-foreground dark:text-white/90">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[80vw] sm:w-[400px] border-l border-gray-200 dark:border-white/10 bg-background dark:card-glass overflow-y-auto">
                  <SheetHeader className="flex-shrink-0">
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-sovereign-gold to-sovereign-gold bg-clip-text text-transparent">
                      STANDARD
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">كراء فاخر · خدمات · سوق مفتوح</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-8 text-right pb-8">
                    {/* 3-in-1 Sections */}
                    {navSections.map((section) => (
                      <div key={section.label}>
                        <Link
                          href={section.href}
                          className="text-xl font-bold text-foreground dark:text-white hover:text-sovereign-gold dark:hover:text-sovereign-gold transition-colors p-2 block"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {section.label}
                        </Link>
                        <div className="pr-4">
                          {section.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="text-base text-muted-foreground hover:text-sovereign-gold dark:hover:text-sovereign-gold transition-colors py-1.5 pr-4 block"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-gray-200 dark:border-white/10 my-3" />

                    {/* Quick Links */}
                    {quickLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-base text-muted-foreground hover:text-sovereign-gold dark:hover:text-sovereign-gold transition-colors p-2 block"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}

                    {isAuthenticated ? (
                      <>
                        <div className="border-t border-gray-200 dark:border-white/10 my-3" />
                        <Link href="/dashboard" className="text-xl font-bold text-foreground dark:text-white hover:text-sovereign-gold transition-colors p-2 block" onClick={() => setMobileMenuOpen(false)}>لوحة التحكم</Link>
                        <Link href="/cart" className="text-base text-muted-foreground hover:text-sovereign-gold transition-colors p-2 block" onClick={() => setMobileMenuOpen(false)}>السلة</Link>
                        <Button onClick={() => { setMobileMenuOpen(false); setLogoutDialogOpen(true); }} className="w-full mt-4 rounded-full bg-gradient-to-r from-red-500 to-pink-600 font-bold">تسجيل الخروج</Button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-3 mt-6">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full rounded-full border-2">تسجيل الدخول</Button>
                        </Link>
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full rounded-full bg-gradient-to-r from-sovereign-gold to-sovereign-gold shadow-lg font-bold">التسجيل</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        {/* Scroll Progress */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sovereign-gold via-sovereign-gold to-sovereign-gold origin-left z-50"
          style={{ scaleX: scrollYProgress }}
        />
      </nav>

      {/* Logout Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-sovereign-gold to-sovereign-gold bg-clip-text text-transparent mb-2">
              تسجيل الخروج
            </DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground">
              هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <User className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-4">
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)} className="rounded-full px-8 border-gray-300 dark:border-white/20">إلغاء</Button>
            <Button onClick={handleLogout} className="rounded-full px-8 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg">نعم، تأكيد الخروج</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}