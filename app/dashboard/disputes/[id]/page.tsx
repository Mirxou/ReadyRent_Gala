"use client";

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '@/lib/api';
import { 
  Scale, 
  MessageSquare, 
  ShieldCheck, 
  FileText, 
  AlertTriangle,
  Gavel,
  History,
  Download,
  Info,
  Search,
  Send,
  ImageIcon,
  User,
  Bot,
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  filed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  under_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  mediation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  appealed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  filed: 'تم التقديم',
  under_review: 'قيد المراجعة',
  mediation: 'جلسة الوساطة',
  appealed: 'تم الاستئناف',
  resolved: 'تم الفصل',
  closed: 'مغلقة',
};

// Timeline stage definitions based on dispute status flow
const STAGE_FLOW = [
  { status: 'filed', labelAr: 'تقديم طلب التحكيم (Claim Filed)', icon: FileText },
  { status: 'under_review', labelAr: 'مراجعة الأدلة الرقمية (Evidence Review)', icon: Search },
  { status: 'mediation', labelAr: 'جلسة الوساطة (Mediation)', icon: Scale },
  { status: 'resolved', labelAr: 'الحكم النهائي (Final Verdict)', icon: ShieldCheck },
];

function buildTimelineFromHistory(history: any[], disputeStatus: string): any[] {
  // Build the timeline based on status flow
  const statusOrder = ['filed', 'under_review', 'mediation', 'appealed', 'resolved', 'closed'];
  const currentIndex = statusOrder.indexOf(disputeStatus);

  // Find status change events from history
  const statusChanges: Record<string, string> = {};
  history.forEach((entry: any) => {
    if (entry.is_status_change || entry.type === 'system') {
      const match = entry.message?.match(/(?:تم إنشاء النزاع بحالة|تم تغيير حالة النزاع من) "(\w+)"/);
      if (match) {
        if (!statusChanges[match[1]] || entry.created_at < statusChanges[match[1]]) {
          statusChanges[match[1]] = entry.created_at;
        }
      }
    }
  });

  // Use the history's first entry as filed date
  if (history.length > 0 && !statusChanges['filed']) {
    statusChanges['filed'] = history[0].created_at;
  }

  // Determine which stages to show
  const stages = STAGE_FLOW.map((stage, idx) => {
    const stageIndex = statusOrder.indexOf(stage.status);
    const isComplete = stageIndex < currentIndex;
    const isActive = stage.status === disputeStatus || 
      (disputeStatus === 'appealed' && stage.status === 'under_review') ||
      (disputeStatus === 'closed' && stage.status === 'resolved');
    
    // If appealed, insert appeal stage after mediation
    let dateStr = statusChanges[stage.status] ? new Date(statusChanges[stage.status]).toLocaleDateString('ar-DZ') : '--';

    return {
      ...stage,
      date: dateStr,
      complete: isComplete,
      active: isActive,
    };
  });

  // If appealed, add appeal stage before resolved
  if (disputeStatus === 'appealed') {
    const mediationIdx = stages.findIndex(s => s.status === 'mediation');
    if (mediationIdx !== -1) {
      stages.splice(mediationIdx + 1, 0, {
        status: 'appealed',
        labelAr: 'مرحلة الاستئناف (Appeal)',
        icon: Gavel,
        date: statusChanges['appealed'] ? new Date(statusChanges['appealed']).toLocaleDateString('ar-DZ') : '--',
        complete: false,
        active: true,
      });
    }
  }

  return stages;
}

function formatMessageTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('ar-DZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function DisputeDetailPage() {
  const { id } = useParams();
  const disputeId = Array.isArray(id) ? id[0] : (id ?? '');
  const queryClient = useQueryClient();
  const [chatText, setChatText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch single dispute with messages
  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => disputesApi.getDispute(disputeId).then(res => res.data),
  });

  // Fetch dispute history for timeline
  const { data: historyData } = useQuery({
    queryKey: ['dispute-history', disputeId],
    queryFn: () => disputesApi.getDisputeHistory(String(disputeId)).then(res => res.data),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) =>
      disputesApi.createDisputeMessage(String(disputeId), { content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['dispute-history', disputeId] });
      setChatText('');
      toast.success('تم إرسال الرسالة بنجاح');
    },
    onError: (err: any) => {
      toast.error(err?.data?.error || 'فشل إرسال الرسالة');
    },
  });

  const handleSendMessage = () => {
    const trimmed = chatText.trim();
    if (!trimmed || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dispute?.messages]);

  if (isLoading || !dispute) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Scale className="w-12 h-12 animate-pulse text-sovereign-gold" />
        <span className="text-xs font-black uppercase tracking-widest opacity-40 italic">Consulting Judicial Scrolls...</span>
      </div>
    );
  }

  const timeline = buildTimelineFromHistory(
    Array.isArray(historyData) ? historyData : [],
    dispute.status
  );

  const messages = Array.isArray(dispute.messages) ? dispute.messages : [];
  const evidenceUrls = Array.isArray(dispute.evidence_urls) ? dispute.evidence_urls : [];
  const statusColor = STATUS_COLORS[dispute.status] || STATUS_COLORS.filed;
  const statusLabel = STATUS_LABELS[dispute.status] || dispute.status;

  return (
    <div className="space-y-12 pb-40 text-right px-6" dir="rtl">
      
      {/* Header: The Judicial Vault */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-3">
          <Badge variant="outline" className={cn("border px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] italic", statusColor)}>
            {statusLabel} — Sovereign Arbitration Vault V.2
          </Badge>
          <h1 className="text-5xl font-black italic tracking-tighter text-foreground">
            {dispute.title || `قضية العقد`} <span className="text-sovereign-gold">#{dispute.booking_id?.slice(0, 8) || 'N/A'}</span>
          </h1>
          <p className="text-muted-foreground font-light text-xl italic opacity-80 pl-10 border-l-2 border-sovereign-gold/10">
            {dispute.description || 'تحكيم سيادي تحت إشراف الـ Oracle لمراجعة الالتزامات الائتمانية.'}
          </p>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>نوع الطلب: <strong className="text-foreground">{dispute.claim_type || 'عام'}</strong></span>
            <span className="opacity-30">|</span>
            <span>المبلغ المطالب: <strong className="text-sovereign-gold">{dispute.claimed_amount || 0} دج</strong></span>
            <span className="opacity-30">|</span>
            <span>الأولوية: <strong className="text-foreground">{dispute.priority || 'medium'}</strong></span>
          </div>
        </div>
        <SovereignButton variant="secondary" className="h-16 px-12 shadow-3xl shadow-sovereign-gold/10 rounded-2xl text-xl" withShimmer>
           تحميل التقرير الفني <Download className="w-5 h-5 ml-4" />
        </SovereignButton>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* RIGHT: The Judicial Process (Timeline - Span 4) */}
        <div className="lg:col-span-4 space-y-10">
           <GlassPanel className="p-10 space-y-12" gradientBorder>
              <h3 className="text-2xl font-black italic border-b border-white/5 pb-6">المسار القضائي (Protocol)</h3>
              
              <div className="relative space-y-12">
                 {/* The Timeline Line */}
                 <div className="absolute top-2 right-6 bottom-2 w-px bg-white/10" />
                 
                 {timeline.map((item: any, i: number) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.2 }}
                     className="relative flex items-start gap-8"
                   >
                     <div className={cn(
                       "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700",
                       item.complete ? "bg-emerald-500 text-black" : item.active ? "bg-sovereign-gold text-black shadow-3xl" : "bg-white/5 text-muted-foreground"
                     )}>
                        <item.icon className="w-6 h-6" />
                     </div>
                     <div className="text-right flex-1">
                        <p className="text-xs font-black text-muted-foreground opacity-40 uppercase tracking-widest">{item.date}</p>
                        <h4 className={cn(
                          "text-lg font-black italic",
                          item.active ? "text-sovereign-gold" : "text-foreground opacity-80"
                        )}>{item.labelAr}</h4>
                     </div>
                   </motion.div>
                 ))}
              </div>
           </GlassPanel>

           {/* Credit Warning */}
           {(dispute.status === 'filed' || dispute.status === 'under_review' || dispute.status === 'mediation') && (
             <GlassPanel className="p-10 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20 space-y-6">
                <div className="flex items-center gap-4 text-red-500">
                    <AlertTriangle className="w-8 h-8" />
                    <h4 className="text-xl font-black italic">تحذير ائتماني</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic opacity-80">
                   سيتم تجميد مبلغ الضمان (Escrow) بالكامل حتى يتم إصدار الحكم النهائي من قبل المحكم المستقل.
                </p>
             </GlassPanel>
           )}

           {/* Booking Info */}
           {dispute.booking && (
             <GlassPanel className="p-8 space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-4">تفاصيل الحجز</h4>
                <div className="flex items-center gap-4">
                  {dispute.booking.product_image && (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={dispute.booking.product_image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{dispute.booking.product_name || dispute.booking.product?.name_ar || 'منتج'}</p>
                    <p className="text-sm text-muted-foreground">
                      {dispute.booking.total_price ? `${dispute.booking.total_price} دج` : ''}
                      {dispute.booking.status && (
                        <Badge variant="outline" className="mr-2 text-[9px] px-2 py-0.5">{dispute.booking.status}</Badge>
                      )}
                    </p>
                  </div>
                </div>
             </GlassPanel>
           )}
        </div>

        {/* LEFT: Evidence & Communication (Span 8) */}
        <div className="lg:col-span-8 space-y-10">
           
           {/* Evidence Vault */}
           <GlassPanel className="p-12 relative overflow-hidden" gradientBorder>
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black italic flex items-center gap-4">
                     <ShieldCheck className="w-8 h-8 text-sovereign-gold" /> خزانة الأدلة (Evidence Vault)
                  </h3>
                  <Badge variant="outline" className="text-xs px-3 py-1 text-muted-foreground">
                    {evidenceUrls.length} دليل
                  </Badge>
              </div>

              {evidenceUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {evidenceUrls.map((url: string, idx: number) => (
                    <div key={idx} className="aspect-square bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-sovereign-gold/40 transition-all overflow-hidden">
                      {url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <img src={url} alt={`الدليل ${idx + 1}`} className="w-full h-full object-cover rounded-2xl" />
                        </div>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-sovereign-gold">
                            <FileText className="w-6 h-6" />
                          </div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground px-2 text-center truncate w-full">
                            {url.split('/').pop() || `الدليل ${idx + 1}`}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="aspect-square border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-muted-foreground opacity-20">
                    <FileText className="w-10 h-10 mb-4" />
                    <p className="text-[8px] font-black uppercase tracking-widest">Awaiting Evidence</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-40">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest">لا توجد أدلة مرفقة بعد</p>
                  <p className="text-xs mt-2 opacity-60">يمكن إضافة أدلة إضافية أثناء مرحلة المراجعة</p>
                </div>
              )}
           </GlassPanel>

           {/* Arbitrator Chat Hub */}
           <SovereignGlow color="blue">
               <GlassPanel className="p-10 relative group" gradientBorder>
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-2xl font-black italic flex items-center gap-4">
                        <MessageSquare className="w-8 h-8 text-sovereign-blue" /> حوار التحكيم المباشر
                     </h3>
                     <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 flex gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        {dispute.status === 'closed' || dispute.status === 'resolved' ? 'القضية منتهية' : 'المحكم متوفر'}
                     </Badge>
                  </div>

                  <div className="h-80 bg-black/20 rounded-3xl p-8 mb-8 space-y-4 overflow-y-auto scrollbar-thin">
                      {messages.length === 0 && (
                        <div className="h-full flex items-center justify-center text-muted-foreground opacity-40 text-sm italic">
                          لم يتم تبادل رسائل بعد. ابدأ المحادثة...
                        </div>
                      )}
                      {messages.map((msg: any) => {
                        const isSystem = msg.type === 'system';
                        const isAppeal = msg.type === 'appeal';
                        const isOwn = msg.sender_id === dispute.user_id;
                        
                        if (isSystem) {
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex justify-center"
                            >
                              <div className="px-4 py-2 bg-white/5 rounded-full text-xs text-muted-foreground italic border border-white/5 max-w-[90%] text-center">
                                <Info className="w-3 h-3 inline-block ml-1 opacity-50" />
                                {msg.message}
                              </div>
                            </motion.div>
                          );
                        }

                        if (isAppeal) {
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex justify-center"
                            >
                              <div className="px-5 py-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl max-w-[85%] text-center">
                                <p className="text-[10px] font-black text-orange-400 uppercase mb-1 flex items-center justify-center gap-1">
                                  <Gavel className="w-3 h-3" /> طعن (Appeal)
                                </p>
                                <p className="text-sm text-orange-200/80">{msg.message}</p>
                                <p className="text-[10px] text-orange-400/50 mt-1">{formatMessageTime(msg.created_at)}</p>
                              </div>
                            </motion.div>
                          );
                        }

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "p-5 rounded-2xl text-right max-w-[80%] border",
                              isOwn
                                ? "bg-sovereign-blue/20 border-sovereign-blue/20 ml-auto rounded-tl-none"
                                : "bg-white/5 border-white/5 mr-auto rounded-tr-none"
                            )}
                          >
                            <p className={cn(
                              "text-xs font-black uppercase mb-2 flex items-center gap-1.5",
                              isOwn ? "text-muted-foreground" : "text-sovereign-blue"
                            )}>
                              {isOwn ? (
                                <><User className="w-3 h-3" /> {dispute.user?.first_name || 'أنت'} (Claimant)</>
                              ) : (
                                <><Bot className="w-3 h-3" /> المحكم السيادي (Arbitrator)</>
                              )}
                            </p>
                            <p className="text-sm leading-relaxed italic opacity-90">"{msg.message}"</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-2">{formatMessageTime(msg.created_at)}</p>
                          </motion.div>
                        );
                      })}
                      <div ref={chatEndRef} />
                  </div>

                  <div className="relative">
                     <input
                       value={chatText}
                       onChange={(e) => setChatText(e.target.value)}
                       onKeyDown={handleKeyDown}
                       placeholder="أدخل رسالتك الرسمية..."
                       disabled={sendMessageMutation.isPending || dispute.status === 'closed' || dispute.status === 'resolved'}
                       className="w-full h-16 bg-white/5 rounded-2xl px-8 pl-24 focus:outline-none border border-white/5 focus:border-sovereign-blue/40 italic disabled:opacity-40 transition-all"
                     />
                     <SovereignButton
                       variant="primary"
                       className="absolute left-2 top-1/2 -translate-y-1/2 h-12 px-6 rounded-xl flex items-center gap-2"
                       onClick={handleSendMessage}
                       disabled={!chatText.trim() || sendMessageMutation.isPending || dispute.status === 'closed' || dispute.status === 'resolved'}
                     >
                        {sendMessageMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        إرسال
                     </SovereignButton>
                  </div>
               </GlassPanel>
           </SovereignGlow>

           {/* Legal Footer */}
           <div className="pt-10 flex items-center justify-center gap-10 opacity-20 grayscale scale-[0.8]">
              <History className="w-10 h-10" />
              <div className="h-px w-40 bg-white/20" />
              <ShieldCheck className="w-10 h-10" />
           </div>

        </div>

      </div>

    </div>
  );
}