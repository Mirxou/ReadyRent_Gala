"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  ShieldCheck, 
  History,
  Clock,
  Command,
  Zap
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components/ui/badge';

/**
 * SovereignOracle - The A.I. Guardian.
 * Moved to src/shared/components/sovereign/sovereign-oracle.tsx (Phase 11).
 * 
 * Principles:
 * - Conversational Persona: Helpful, elite, authoritative.
 * - Pill & Airy: 32px-40px radius and breathable chat containers.
 * - Real-time Pulse: Feedback on AI processing.
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function SovereignOracle() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً بك في فضاء ReadyRent السيادي. أنا مساعدك الرقمي (Oracle)، كيف يمكنني خدمتك اليوم؟' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate AI Response
    setTimeout(() => {
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: `لقد فهمت طلبك بخصوص "${input}". النظام السيادي يقوم بمعالجة استفسارك حالياً وفقاً لبروتوكول "STANDARD"...` 
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1200);
  };

  return (
    <>
      {/* 1. The Floating Sovereign Trigger */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-10 left-10 w-20 h-20 rounded-full bg-sovereign-gold text-sovereign-obsidian shadow-[0_20px_50px_rgba(197,160,89,0.4)] z-[100] flex items-center justify-center group overflow-hidden border-4 border-sovereign-obsidian/20",
          isOpen && "hidden"
        )}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles className="w-10 h-10 animate-pulse" />
      </motion.button>

      {/* 2. The Oracle Chat Chamber */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100, x: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: -50 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-10 left-10 w-[440px] h-[720px] max-h-[85vh] z-[100] text-right"
            dir="rtl"
          >
            <GlassPanel className="h-full flex flex-col p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]" variant="obsidian" gradientBorder>
              
              {/* Header: Authority Branding */}
              <div className="p-8 bg-white/[0.02] border-b border-white/5 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sovereign-gold/5 rounded-full blur-[60px] pointer-events-none" />
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-[20px] bg-sovereign-gold flex items-center justify-center text-sovereign-obsidian shadow-[0_10px_30px_rgba(197,160,89,0.3)]">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black italic tracking-tighter text-white">Sovereign Oracle</h4>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black italic tracking-[0.2em] px-2 py-0.5 rounded-full">ENCRYPTED_OK</Badge>
                        <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">A.I. Guardian</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all group relative z-10">
                  <X className="w-6 h-6 text-white/30 group-hover:text-white" />
                </button>
              </div>

              {/* Chat View: Narrative Flow */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? -20 : 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                    className={cn(
                      "flex gap-4",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border",
                      msg.role === 'user' ? "bg-white/5 border-white/5" : "bg-sovereign-gold/10 border-sovereign-gold/20"
                    )}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white/20" /> : <Bot className="w-5 h-5 text-sovereign-gold" />}
                    </div>
                    <div className={cn(
                      "p-5 rounded-[24px] max-w-[85%] text-sm leading-relaxed",
                      msg.role === 'user' ? "bg-white/[0.03] text-white/70 rounded-tl-none border border-white/5" : "bg-white/[0.01] border border-white/5 rounded-tr-none text-white/90 italic font-medium"
                    )}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Intelligence Shortcuts */}
              <div className="px-8 py-3 overflow-x-auto flex gap-3 no-scrollbar pb-6">
                 {[
                   { label: 'تمديد العقد السيادي', icon: History },
                   { label: 'ميثاق STANDARD', icon: ShieldCheck },
                   { label: 'موعد استلام الضمان', icon: Clock }
                 ].map((short, i) => (
                    <button 
                      key={i}
                      className="whitespace-nowrap px-6 py-3 bg-white/[0.02] border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-sovereign-gold/10 hover:text-sovereign-gold transition-all duration-500 flex items-center gap-3"
                    >
                        <short.icon className="w-3.5 h-3.5" /> {short.label}
                    </button>
                 ))}
              </div>

              {/* Command Input Chamber */}
              <div className="p-8 pt-4 bg-white/[0.01] border-t border-white/5">
                <div className="relative group">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="بماذا يمكنني إرشادك اليوم؟"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] p-6 pr-6 pl-20 resize-none focus:outline-none focus:border-sovereign-gold/30 transition-all text-sm italic text-white/90 placeholder:text-white/10"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <Command className="w-4 h-4 text-white/20" />
                    </div>
                    <SovereignButton 
                        onClick={handleSend}
                        variant="primary"
                        className="w-12 h-12 rounded-[14px] p-0 shadow-[0_10px_20px_rgba(197,160,89,0.3)]"
                        withShimmer
                    >
                        <Send className="w-5 h-5 ml-1" />
                    </SovereignButton>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 px-2">
                    <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] italic">
                        ReadyRent Sovereign AI V.10 | Forensic Intelligence Mode
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest">Secure Link</span>
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
