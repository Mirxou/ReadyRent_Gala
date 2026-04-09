"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  X, 
  Send, 
  Sparkles, 
  MessageSquare,
  Zap,
  ShieldCheck,
  Compass,
  ArrowLeft,
  Quote
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { chatbotApi } from '@/lib/api';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { useAuthStore, useLanguageStore } from '@/lib/store';

/**
 * SovereignConcierge - The Oracle of the Ecosystem.
 * Moved to src/shared/components/sovereign/sovereign-concierge.tsx (Phase 11).
 * 
 * Principles:
 * - Dignified Interaction: Slow, meaningful transitions.
 * - Consulting Aesthetic: McKinsey-style quote blocks and spacing.
 * - Floating Authority: Z-index 100 with deep glassmorphism.
 */

export function SovereignConcierge() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);

  useEffect(() => {
     if (messages.length === 0) {
        let greeting = language === 'ar' 
          ? 'أهلاً بك في جناح الاستشارات السيادية. كيف يمكنني مساعدتك في إدارة أصولك وتعظيم قيمتها اليوم؟' 
          : 'Bienvenue au pavillon du conseil souverain. Comment puis-je vous aider à maximiser la valeur de vos actifs aujourd\'hui ?';

        if (pathname.includes('/wallet')) {
          greeting = language === 'ar' 
            ? 'مرحباً في خزنتك السيادية. هل ترغب في تحليل تدفقاتك المالية أو مراجعة بروتوكولات الأمان لأدواتك الائتمانية؟'
            : 'Bienvenue dans votre coffre-fort souverain. Souhaitez-vous analyser vos flux financiers ?';
        } else if (pathname.includes('/bookings')) {
          greeting = language === 'ar'
            ? 'أنا هنا لمراجعة مواثيق حجزك. هل هناك تفصيل في العقد الذكي تود منّي توضيحه؟'
            : 'Je suis ici pour examiner vos protocoles de réservation. Souhaitez-vous clarifier un détail du contrat ?';
        } else if (pathname.includes('/dashboard')) {
          greeting = language === 'ar'
            ? 'مرصد الحقيقة نشط. هل تود أن أطلعك على تقارير النزاهة العالمية للنظام؟'
            : 'L\'Observatoire de la Vérité est actif. Souhaitez-vous consulter les rapports d\'intégrité ?';
        }

        setMessages([{ role: 'assistant', content: greeting }]);
     }
  }, [language, pathname, messages.length]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (directMessage?: string) => {
    const messageToSend = typeof directMessage === 'string' ? directMessage : input.trim();
    if (!messageToSend || isLoading) return;

    if (typeof directMessage !== 'string') setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsLoading(true);

    try {
      const response = await chatbotApi.quickChat(messageToSend, {
        language,
        trust_score: user?.trust_score
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response || 'عذراً، لم أستطع تحليل البروتوكول حالياً. يرجى المحاولة لاحقاً.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'حدث خطأ في الاتصال بنظام الأوراكل السيادي.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger - Refined for Phase 11 */}
      <motion.button
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-12 left-12 z-[100] w-24 h-24 bg-sovereign-obsidian border border-sovereign-gold/30 rounded-[32px] shadow-2xl flex items-center justify-center group overflow-hidden"
      >
         <SovereignGlow color="gold" intensity="high">
            <div className="absolute inset-0 bg-gradient-to-br from-sovereign-gold/10 to-transparent group-hover:opacity-100 opacity-50 transition-opacity" />
            <BrainCircuit className="w-12 h-12 text-sovereign-gold group-hover:scale-110 transition-transform relative z-10" />
            <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-sovereign-obsidian animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
         </SovereignGlow>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100, x: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100, x: -100 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-48 left-12 z-[100] w-full max-w-xl"
            dir="rtl"
          >
            <GlassPanel className="h-[700px] flex flex-col p-0 overflow-hidden shadow-[0_60px_150px_rgba(0,0,0,0.8)] border-white/5" variant="obsidian" gradientBorder>
               
               {/* 🛡️ Elite Header */}
               <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 rounded-[24px] bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold border border-sovereign-gold/20">
                        <Sparkles className="w-8 h-8 animate-golden-spark" />
                     </div>
                     <div className="text-right space-y-1">
                        <h4 className="text-2xl font-black italic tracking-tighter">الأوراكل السيادي</h4>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                           <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">Protocol Active Intelligence</span>
                        </div>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center transition-all group"
                  >
                     <X className="w-6 h-6 text-white/20 group-hover:text-sovereign-gold transition-colors" />
                  </button>
               </div>

               {/* Tactical Advice Feed */}
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-none scroll-smooth">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col gap-3 max-w-[90%]",
                        m.role === 'assistant' ? "items-start ml-auto text-right" : "items-end mr-auto text-left"
                      )}
                    >
                       <div className={cn(
                         "p-6 rounded-[32px] text-sm leading-relaxed border transition-all",
                         m.role === 'assistant' 
                          ? "bg-white/[0.03] border-white/5 rounded-tr-none text-white/80 font-medium italic" 
                          : "bg-sovereign-gold border-sovereign-gold text-sovereign-black font-black rounded-tl-none shadow-xl"
                       )}>
                          {m.role === 'assistant' && <Quote className="w-4 h-4 mb-3 text-sovereign-gold/40 fill-current" />}
                          {m.content}
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 px-2">
                          {m.role === 'assistant' ? 'Sovereign Intel' : 'Elite Citizen'}
                       </span>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 p-6 bg-white/[0.02] rounded-[32px] w-24 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-sovereign-gold" />
                        <div className="w-2 h-2 rounded-full bg-sovereign-gold opacity-60" />
                        <div className="w-2 h-2 rounded-full bg-sovereign-gold opacity-30" />
                    </div>
                  )}
               </div>

               {/* Intelligence Input Area */}
               <div className="p-10 border-t border-white/5 bg-black/40">
                  <div className="relative group">
                      {/* Dynamic Suggestion Chips based on Context */}
                      <div className="absolute -top-14 inset-x-0 flex justify-end gap-4 opacity-0 group-focus-within:opacity-100 transition-all duration-500 transform translate-y-2 group-focus-within:translate-y-0">
                        {pathname.includes('/wallet') ? (
                          <>
                            <button onClick={() => handleSend('تحليل السيولة')} className="text-[9px] font-black uppercase tracking-widest text-sovereign-gold/60 hover:text-sovereign-gold px-3 py-1 bg-white/[0.02] rounded-full border border-white/5">Liquidity Analysis</button>
                            <button onClick={() => handleSend('سجل الحجز الضامن')} className="text-[9px] font-black uppercase tracking-widest text-sovereign-gold/60 hover:text-sovereign-gold px-3 py-1 bg-white/[0.02] rounded-full border border-white/5">Escrow Audit</button>
                          </>
                        ) : pathname.includes('/bookings') ? (
                          <>
                            <button onClick={() => handleSend('شرح العقد الذكي')} className="text-[9px] font-black uppercase tracking-widest text-sovereign-gold/60 hover:text-sovereign-gold px-3 py-1 bg-white/[0.02] rounded-full border border-white/5">Contract Logic</button>
                            <button onClick={() => handleSend('وضعية النزاع')} className="text-[9px] font-black uppercase tracking-widest text-sovereign-gold/60 hover:text-sovereign-gold px-3 py-1 bg-white/[0.02] rounded-full border border-white/5">Dispute Protocol</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleSend('تقرير السوق 2026')} className="text-[9px] font-black uppercase tracking-widest text-sovereign-gold/60 hover:text-sovereign-gold px-3 py-1 bg-white/[0.02] rounded-full border border-white/5">Market Report</button>
                            <button onClick={() => handleSend('دليل المواطنة')} className="text-[9px] font-black uppercase tracking-widest text-sovereign-gold/60 hover:text-sovereign-gold px-3 py-1 bg-white/[0.02] rounded-full border border-white/5">Citizen Guide</button>
                          </>
                        )}
                      </div>
                     
                     <div className="relative flex items-center">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="أدخل برتوكول الطلب الاستشاري..."
                            className="w-full h-20 bg-white/[0.03] rounded-[24px] pr-8 pl-20 text-sm focus:outline-none focus:ring-1 focus:ring-sovereign-gold/30 border border-white/5 transition-all text-right font-medium italic"
                            dir="rtl"
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={isLoading}
                            className="absolute left-4 w-12 h-12 bg-sovereign-gold rounded-[11px] flex items-center justify-center text-sovereign-black hover:scale-105 active:scale-95 transition-all shadow-xl group/send"
                        >
                            <Send className="w-5 h-5 mr-0.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                     </div>
                  </div>
               </div>

            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
