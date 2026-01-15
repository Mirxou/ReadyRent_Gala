'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingCart, User, Menu, Moon, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
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
import { motion, useScroll } from 'framer-motion';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => bookingsApi.getCart().then((res) => res.data),
    enabled: isAuthenticated,
  });

  const cartItemsCount = cart?.items?.length || 0;

  return (
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
          <Link href="/" className="flex items-center space-x-2 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gala-purple to-gala-pink rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <span className="relative text-2xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold dark:from-white dark:via-white dark:to-white/40 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                READY RENT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { label: 'المنتجات', href: '/products' },
              { label: 'الحزم', href: '/bundles' },
              { label: 'دليل المناسبات', href: '/local-guide' },
              { label: 'الحرفيات', href: '/artisans' },
              { label: 'المدونة', href: '/blog' },
              { label: 'الأسئلة الشائعة', href: '/faq' },
              { label: 'عن غالا', href: '/about' },
              { label: 'الحجوزات', href: isAuthenticated ? '/dashboard/bookings' : '/login' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground dark:text-white/90 hover:text-gala-purple dark:hover:text-gala-purple transition-all magnetic-hover relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-gala-purple to-gala-pink transition-all group-hover:w-full" />
              </Link>
            ))}
            {isAuthenticated && (
              <Link href="/dashboard" className="text-sm font-medium text-foreground dark:text-white/90 hover:text-gala-purple dark:hover:text-gala-purple transition-all magnetic-hover relative group">
                لوحة التحكم
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-gala-purple to-gala-pink transition-all group-hover:w-full" />
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="rounded-full hover:bg-gala-purple/10 text-foreground dark:text-white/90 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-gala-gold" />
                ) : (
                  <Moon className="h-5 w-5 text-gala-purple" />
                )}
              </Button>
            )}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative group rounded-full hover:bg-gala-pink/10 text-foreground dark:text-white/90">
                    <ShoppingCart className="h-5 w-5 group-hover:text-gala-pink transition-colors" />
                    {cartItemsCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-gradient-to-br from-gala-pink to-gala-purple animate-pulse">
                        {cartItemsCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gala-purple/10 text-foreground dark:text-white/90">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  onClick={logout}
                  className="rounded-full bg-gradient-to-r from-gala-purple to-gala-pink hover:opacity-90 transition-all font-semibold"
                >
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full hover:bg-gala-purple/10">تسجيل الدخول</Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-full bg-gradient-to-r from-gala-purple to-gala-pink hover:opacity-90 shadow-lg glow-purple font-semibold">
                    التسجيل
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
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
                  <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">
                    READY RENT
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground">تصفح المجموعة الاستثنائية لعام 2026</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-12 text-right pb-8">
                  {[
                    { label: 'المنتجات', href: '/products' },
                    { label: 'الحزم', href: '/bundles' },
                    { label: 'دليل المناسبات', href: '/local-guide' },
                    { label: 'الحرفيات', href: '/artisans' },
                    { label: 'المدونة', href: '/blog' },
                    { label: 'الأسئلة الشائعة', href: '/faq' },
                    { label: 'الحجوزات', href: isAuthenticated ? '/dashboard/bookings' : '/login' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-2xl font-medium text-foreground dark:text-white/90 hover:text-gala-purple dark:hover:text-gala-purple transition-colors p-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {isAuthenticated ? (
                    <>
                      <Link href="/dashboard" className="text-2xl font-medium text-foreground dark:text-white/90 hover:text-gala-purple dark:hover:text-gala-purple transition-colors" onClick={() => setMobileMenuOpen(false)}>لوحة التحكم</Link>
                      <Link href="/profile" className="text-2xl font-medium text-foreground dark:text-white/90 hover:text-gala-purple dark:hover:text-gala-purple transition-colors" onClick={() => setMobileMenuOpen(false)}>الملف الشخصي</Link>
                      <Button onClick={logout} className="w-full mt-8 rounded-full bg-gradient-to-r from-gala-purple to-gala-pink font-bold">تسجيل الخروج</Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4 mt-8">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-full border-2">تسجيل الدخول</Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full rounded-full bg-gradient-to-r from-gala-purple to-gala-pink shadow-lg font-bold">التسجيل</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      {/* Scroll Progress Indicator */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
    </nav>
  );
}
