"use client";

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { bookingsApi, disputesApi } from '@/lib/api';
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  FileSignature, 
  AlertTriangle, 
  ChevronRight,
  Download,
  MessageSquare,
  Scale,
  ArrowLeft,
  Loader2,
  Truck,
  Package,
  Scissors,
  CheckCircle2,
  Sparkles,
  Activity
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignSparkle, SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { LogisticsProgress } from '@/features/logistics/components/logistics-progress';
import { SovereignRadar } from '@/shared/components/sovereign/sovereign-radar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isDisputeModalOpen, setIsDisputeModalOpen] = React.useState(false);
  const [disputeReason, setDisputeReason] = React.useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getById(id as string).then(res => res.data),
  });

  const createDisputeMutation = useMutation({
    mutationFn: (data: any) => disputesApi.createDispute(data),
    onSuccess: () => {
      toast.success('تم رفع النزاع للتحكيم السيادي (Dispute Lodged)');
      setIsDisputeModalOpen(false);
      router.push('/dashboard/disputes');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل في رفع النزاع');
    }
  });

  const handleRaiseDispute = () => {
    if (!disputeReason.trim()) {
      toast.error('يرجى توضيح سبب النزاع');
      return;
    }
    createDisputeMutation.mutate({
      booking_id: booking.id,
      reason: disputeReason,
      category: 'quality_issue' // MVP default
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-sovereign-gold" />
        <p className="text-xs font-black uppercase tracking-widest opacity-40">Retrieving Secure Agreement...</p>
      </div>
    );
  }

  if (!booking) return <div className="p-20 text-center">Agreement Not Found</div>;

  return (
    <div className="space-y-12 pb-20 text-right" dir="rtl">
      
      {/* Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-sovereign-gold transition-colors mb-4">
                <ArrowLeft className="w-4 h-4" /> العودة للسجل
            </button>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
                صك العقد السيادي <span className="text-sovereign-gold">#ST-{booking.id.toString().padStart(6, '0')}</span>
            </h1>
        </div>
        <div className="flex gap-4">
            <SovereignButton variant="secondary" size="sm" className="gap-2">
                <Download className="w-4 h-4" /> تحميل نسخة PDF
            </SovereignButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* RIGHT: Agreement Details (Span 8) */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* 1. High-Fidelity Logistics Pulse */}
            {(booking.status === 'confirmed' || booking.status === 'in_use') && (
               <div className="space-y-8">
                   <SovereignGlow color="blue">
                       <GlassPanel className="p-10 border-sovereign-gold/5" gradientBorder>
                          <div className="flex items-center justify-between mb-8">
                             <h3 className="text-sm font-black uppercase tracking-[0.4em] text-sovereign-gold flex items-center gap-2">
                                <Truck className="w-5 h-5" /> مسار الرحلة اللوجستية (Logistics Pulse)
                             </h3>
                             <Badge variant="outline" className="border-sovereign-gold/20 text-sovereign-gold">Real-time Tracking</Badge>
                          </div>
                          <LogisticsProgress status="assigned" />
                       </GlassPanel>
                   </SovereignGlow>

                   {/* 🛡️ Sovereign Packaging & Radar Reveal */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <GlassPanel className="p-8 border-white/5 bg-white/5 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-sovereign-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2 relative z-10">
                               <Package className="w-4 h-4 text-sovereign-gold" /> معايير التغليف (Sovereign Packaging)
                           </h4>
                           <div className="space-y-4 relative z-10">
                               <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                   <span className="text-xs text-muted-foreground">نوع الصندوق:</span>
                                   <span className="text-sm font-bold italic">Royal Box (Large)</span>
                               </div>
                               <div className="flex flex-wrap gap-2">
                                   <Badge variant="secondary" className="bg-white/5 text-[9px] border-white/10">Protective Sheet</Badge>
                                   <Badge variant="secondary" className="bg-white/5 text-[9px] border-white/10">Elite Hanger</Badge>
                                   <Badge variant="secondary" className="bg-white/5 text-[9px] border-white/10">Eco-Genesis Wrap</Badge>
                               </div>
                           </div>
                       </GlassPanel>
                       
                       <GlassPanel className="p-8 border-white/5 bg-white/5 overflow-hidden">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                               <Activity className="w-4 h-4 text-sovereign-blue" /> تتبع المسار التكتيكي (Radar)
                           </h4>
                           <SovereignRadar 
                             className="h-32 border-none bg-transparent" 
                             points={[
                                { x: 50, y: 50, label: 'Asset Location' },
                                { x: 20, y: 20, label: 'Hub Node' }
                             ]}
                           />
                       </GlassPanel>
                   </div>
               </div>
            )}

            {/* 2. Sovereign Agreement Header */}
            <GlassPanel className="p-8 relative overflow-hidden" gradientBorder>
                <div className="flex flex-col md:flex-row gap-10">
                    <div className="w-full md:w-64 h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                        <img src={booking.product_image || booking.product?.images?.[0]?.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <SovereignSparkle active={true}>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase border-sovereign-gold/20 text-sovereign-gold">Verified Asset</Badge>
                                </SovereignSparkle>
                                <h2 className="text-3xl font-black">{booking.product_name || booking.product?.name_ar}</h2>
                            </div>
                            <Badge className={cn(
                                "px-4 py-1.5 text-xs font-black uppercase rounded-full",
                                booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500" : "bg-sovereign-blue/10 text-sovereign-blue"
                            )}>
                                {booking.status}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">فترة الكراء</p>
                                <div className="flex items-center gap-3 font-mono font-bold text-lg">
                                    <Calendar className="w-5 h-5 text-sovereign-gold" />
                                    {format(new Date(booking.start_date), 'dd MMM')} — {format(new Date(booking.end_date), 'dd MMM yyyy')}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">حالة الضمان</p>
                                <div className="flex items-center gap-3 font-bold text-lg text-emerald-500">
                                    <ShieldCheck className="w-5 h-5" /> مؤمن سيادياً
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">القيمة الإجمالية</p>
                                <p className="text-4xl font-black text-foreground tracking-tighter">
                                    {Number(booking.total_price).toLocaleString()} <span className="text-sm font-normal">DA</span>
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Commission Fee</p>
                                <p className="text-xs font-bold text-sovereign-gold">10% Included</p>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassPanel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassPanel className="p-8 space-y-4">
                    <h4 className="font-black flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-sovereign-gold" /> استلام الأصل
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        يتم تسليم الأصل في فرع الجزائر العاصمة - حيدرة. يرجى إحضار الهوية الرقمية للتحقق.
                    </p>
                </GlassPanel>
                <GlassPanel className="p-8 space-y-4">
                    <h4 className="font-black flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" /> ميثاق الحماية
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        هذا العقد مغطى بضمان ReadyRent السيادي. سيتم استرداد مبلغ التأمين خلال 24 ساعة من الفحص.
                    </p>
                </GlassPanel>
            </div>

            {/* Post-Rental Inspection Report (Dynamic) */}
            {(booking.status === 'completed' || booking.return_request) && (
                <GlassPanel className="p-8 space-y-8 border-emerald-500/10" gradientBorder>
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black flex items-center gap-3">
                            <FileSignature className="w-6 h-6 text-emerald-500" /> تقرير فحص المرتجعات السيادي
                        </h3>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-0 uppercase font-black px-4 py-1">Verified Condition</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">حالة الأصل</p>
                            <p className="text-2xl font-black text-emerald-500">ممتازة (Excellent)</p>
                            <p className="text-xs text-muted-foreground">لا توجد ملاحظات على سلامة النسيج أو الملحقات.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">تاريخ الفحص</p>
                            <p className="text-lg font-bold">{booking.return_request?.inspection_date ? format(new Date(booking.return_request.inspection_date), 'dd MMM yyyy') : 'تم بنجاح'}</p>
                            <p className="text-xs text-muted-foreground">بواسطة: الخبير السيادي {booking.return_request?.inspector || 'ReadyRent Staff'}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">الحالة المالية</p>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <p className="text-lg font-black text-foreground">تم فك رهن الضمان</p>
                            </div>
                            <p className="text-xs text-muted-foreground">لم يتم احتساب أي رسوم أضرار إضافية.</p>
                        </div>
                    </div>

                    <Separator className="bg-white/5" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                        <div className="space-y-1">
                            <p className="text-sm font-black">إشعار الاسترجاع المالي (Automatic Refund)</p>
                            <p className="text-xs text-muted-foreground">تمت إعادة مبلغ {Number(booking.total_price * 0.2).toLocaleString()} DA إلى محفظتكم السيادية.</p>
                        </div>
                        <SovereignButton variant="secondary" size="sm" className="mt-4 md:mt-0 gap-2 border-emerald-500/20 text-emerald-500">
                             تحميل الفاتورة النهائية
                        </SovereignButton>
                    </div>
                </GlassPanel>
            )}
        </div>

        {/* LEFT: Actions & Resolution (Span 4) */}
        <div className="lg:col-span-4 space-y-8">
            <GlassPanel className="p-8 space-y-6" gradientBorder>
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Scale className="w-5 h-5 text-sovereign-gold" /> مركز النزاعات والتحكيم
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    في حال وجود أي اختلاف في جودة الأصل أو خروج عن ميثاق STANDARD، يمكنك رفع طلب تحكيم سيادي فوراً.
                </p>
                
                <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
                    <DialogTrigger asChild>
                        <SovereignButton variant="secondary" className="w-full gap-2 border-red-500/10 text-red-500 hover:bg-red-500/5">
                            <AlertTriangle className="w-4 h-4" /> رفع نزاع / شكوى جودة
                        </SovereignButton>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-sovereign-gold/20" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">فتح قضية تحكيم سيادية</DialogTitle>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                            <p className="text-sm text-muted-foreground font-light">
                                يرجى شرح المشكلة بوضوح. سيقوم الخبراء السياديون بمراجعة العقد والبيانات خلال 4 ساعات.
                            </p>
                            <Textarea 
                                placeholder="صف المشكلة هنا..." 
                                className="min-h-[150px] bg-white/5 border-white/10"
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                            />
                            <SovereignButton 
                                onClick={handleRaiseDispute} 
                                className="w-full h-14" 
                                disabled={createDisputeMutation.isPending}
                            >
                                {createDisputeMutation.isPending ? "جاري الإرسال..." : "تأكيد رفع النزاع"}
                            </SovereignButton>
                        </div>
                    </DialogContent>
                </Dialog>

                <Separator className="bg-white/5" />

                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">Agreement Tools</p>
                    <SovereignButton variant="secondary" className="w-full justify-between px-6">
                        <span className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /> مراسلة المالك</span>
                        <ChevronRight className="w-4 h-4" />
                    </SovereignButton>
                    <SovereignButton variant="secondary" className="w-full justify-between px-6">
                        <span className="flex items-center gap-3"><Clock className="w-4 h-4" /> تمديد العقد</span>
                        <ChevronRight className="w-4 h-4" />
                    </SovereignButton>
                </div>
            </GlassPanel>

            {/* 3. Marketplace Service Layer: The Artisan Connection */}
            <GlassPanel className="p-8 space-y-6 border-sovereign-blue/10" gradientBorder>
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-black uppercase tracking-[0.3em] text-sovereign-blue flex items-center gap-2">
                      <Scissors className="w-5 h-5" /> خدمات المختصين (Specialist Services)
                   </h4>
                   <Badge variant="outline" className="text-[9px] border-sovereign-blue/20 text-sovereign-blue">Ecosystem Perks</Badge>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                   يمكنك طلب تعديلات خاصة أو تعقيم إضافي لهذا الأصل من خلال شبكة حرفيي ReadyRent المعتمدين.
                </p>

                <div className="space-y-3 pt-2">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-sovereign-blue/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-sovereign-blue/10 rounded-lg text-sovereign-blue">
                            <Scissors className="w-4 h-4" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-sm font-bold">تعديل القياس (Express Fit)</p>
                            <p className="text-[10px] text-muted-foreground">بواسطة خياط معتمد (Tailor)</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-sovereign-blue transition-colors" />
                   </div>

                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-sovereign-gold/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-sovereign-gold/10 rounded-lg text-sovereign-gold">
                            <Sparkles className="w-4 h-4" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-sm font-bold">تعقيم كيميائي بلاتيني</p>
                            <p className="text-[10px] text-muted-foreground">Certified Clean-Lab</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-sovereign-gold transition-colors" />
                   </div>
                </div>

                <Link href="/dashboard/artisans">
                   <SovereignButton variant="secondary" size="sm" className="w-full mt-4 border-white/5 opacity-60 hover:opacity-100 text-[10px] font-black uppercase tracking-widest">
                      تصفح قائمة الحرفيين (Marketplace)
                   </SovereignButton>
                </Link>
            </GlassPanel>

            {/* 4. Contract Timeline (Simple) */}
            <GlassPanel className="p-8 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 italic">System Timeline</h4>
                <div className="relative space-y-8 pr-4">
                    <div className="absolute top-0 right-0 bottom-0 w-px bg-white/5" />
                    
                    <div className="relative flex items-center gap-4">
                        <div className="absolute -right-[4.5px] w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold">إبرام العقد</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(booking.created_at || Date.now()), 'dd MMM yyyy')}</p>
                        </div>
                    </div>

                    <div className="relative flex items-center gap-4">
                        <div className={cn(
                            "absolute -right-[4.5px] w-2 h-2 rounded-full",
                            booking.status === 'confirmed' ? "bg-sovereign-gold animate-pulse" : "bg-white/10"
                        )} />
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold">الاستلام المجدول</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(booking.start_date), 'dd MMM yyyy')}</p>
                        </div>
                    </div>

                    <div className="relative flex items-center gap-4 opacity-50">
                        <div className="absolute -right-[4.5px] w-2 h-2 rounded-full bg-white/10" />
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold">نهاية العقد وفك الضمان</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(booking.end_date), 'dd MMM yyyy')}</p>
                        </div>
                    </div>
                </div>
            </GlassPanel>
        </div>
      </div>
    </div>
  );
}
