'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { bookingsApi, authApi } from '@/lib/api';
import { Package, Calendar, Clock, TrendingUp, ShoppingCart, ArrowRight, User, Star, Bell } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { TiltCard } from '@/components/ui/tilt-card';

export default function DashboardPage() {
  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.getAll().then((res) => res.data),
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => bookingsApi.getCart().then((res) => res.data),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.me().then((res) => res.data),
  });

  const pendingBookings = bookings?.filter((b: any) => b.status === 'pending').length || 0;
  const activeBookings = bookings?.filter((b: any) =>
    b.status === 'confirmed' || b.status === 'in_use'
  ).length || 0;
  const cartItems = cart?.items?.length || 0;

  return (
    <div className="relative min-h-screen pb-20">
      <ParticleField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-12 relative z-10"
      >
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent">
              مرحباً، {user?.email?.split('@')[0] || 'عزيزي'} ✨
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              إليك نظرة سريعة على بستان جمالك وحجوزاتك
            </p>
          </div>

          <div className="flex gap-4">
            <Button size="lg" className="rounded-full bg-gradient-to-r from-gala-purple to-gala-pink border-0 shadow-lg hover:scale-105 transition-transform" asChild>
              <Link href="/products">
                <ShoppingCart className="ml-2 h-4 w-4" />
                تسوقي الجديد
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { title: 'الحجوزات النشطة', value: activeBookings, icon: Calendar, color: 'purple', sub: 'قيد الاستخدام أو مؤكدة' },
            { title: 'قيد الانتظار', value: pendingBookings, icon: Clock, color: 'pink', sub: 'في انتظار التأكيد' },
            { title: 'السلة الملكية', value: cartItems, icon: ShoppingCart, color: 'gold', sub: 'منتج في حقيبتك' },
            { title: 'إجمالي الحجوزات', value: bookings?.length || 0, icon: Package, color: 'cyan', sub: 'تاريخك معنا' },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="card-glass border-0 overflow-hidden group hover:glow-purple transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-white/10 text-white group-hover:bg-gala-purple group-hover:text-white transition-colors">
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                    <div className="text-4xl font-black">{stat.value}</div>
                    <p className="text-xs text-muted-foreground/60 font-medium">{stat.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions & Recent Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-gala-pink" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <Button variant="outline" className="w-full h-14 justify-start text-lg rounded-2xl border-white/10 hover:bg-white/5 transition-colors" asChild>
                <Link href="/products">
                  <Package className="h-5 w-5 ml-3 text-gala-purple" />
                  تصفح المنتجات
                  <ArrowRight className="h-5 w-5 mr-auto opacity-50" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-14 justify-start text-lg rounded-2xl border-white/10 hover:bg-white/5 transition-colors" asChild>
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5 ml-3 text-gala-pink" />
                  عرض السلة الملكية ({cartItems})
                  <ArrowRight className="h-5 w-5 mr-auto opacity-50" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-14 justify-start text-lg rounded-2xl border-white/10 hover:bg-white/5 transition-colors" asChild>
                <Link href="/dashboard/bookings">
                  <Calendar className="h-5 w-5 ml-3 text-gala-gold" />
                  سجل الحجوزات
                  <ArrowRight className="h-5 w-5 mr-auto opacity-50" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 card-glass border-0 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Clock className="h-6 w-6 text-gala-cyan" />
                الحجوزات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {bookings && bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.slice(0, 3).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gala-purple/20 to-gala-pink/20 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gala-pink" />
                        </div>
                        <div>
                          <p className="font-bold text-xl mb-1 group-hover:text-gala-purple transition-colors">{booking.product.name_ar}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.start_date).toLocaleDateString('ar-DZ')} - {new Date(booking.end_date).toLocaleDateString('ar-DZ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black bg-gradient-to-r from-gala-gold to-yellow-500 bg-clip-text text-transparent">
                          {Number(booking.total_price).toLocaleString('ar-DZ')} دج
                        </p>
                        <Badge variant="outline" className="mt-1 border-white/10 text-[10px] uppercase tracking-tighter opacity-70">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {bookings.length > 3 && (
                    <Button variant="ghost" className="w-full h-12 text-muted-foreground font-bold hover:text-white transition-colors" asChild>
                      <Link href="/dashboard/bookings">مشاهدة جميع الحجوزات</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-xl text-muted-foreground font-medium">لا توجد حجوزات في سجلاتنا حتى الآن</p>
                  <Button variant="link" className="mt-4 text-gala-purple" asChild>
                    <Link href="/products">ابدئي رحلة التألق الآن</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

