'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// ──── Types ────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ──── Icons ────
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
  );
}

// ──── Typing indicator ────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 px-3 py-2">
      <div className="w-7 h-7 rounded-full bg-sovereign-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <SparkleIcon className="w-3.5 h-3.5 text-sovereign-gold" />
      </div>
      <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 bg-sovereign-gold/60 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-sovereign-gold/60 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-sovereign-gold/60 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

// ──── Main Component ────
export function SovereignConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguageStore();

  const isRTL = language === 'ar';

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Send message handler
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          language: language === 'ar' ? 'ar' : 'en',
        }),
      });

      const data = await res.json();

      if (data.success && data.response) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: isRTL
            ? 'عذراً، لم أتمكن من معالجة رسالتك. يرجى المحاولة مرة أخرى.'
            : 'Sorry, I could not process your message. Please try again.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: isRTL
          ? 'عذراً، حدث خطأ في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.'
          : 'Sorry, a connection error occurred. Please check your internet and try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId, language, isRTL]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Welcome message when chat first opens
  const getWelcomeMessage = (): string => {
    if (isRTL) {
      return 'مرحباً بك في STANDARD.Rent! 👋\nأنا مساعدك الذكي. يمكنني مساعدتك في المنتجات، الحجوزات، الأسعار، والخدمات. كيف يمكنني مساعدتك؟';
    }
    return 'Welcome to STANDARD.Rent! 👋\nI\'m your AI assistant. I can help with products, bookings, pricing, and services. How can I help you?';
  };

  const handleToggle = () => {
    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: getWelcomeMessage(),
          timestamp: Date.now(),
        },
      ]);
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-end gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'w-[calc(100vw-3rem)] sm:w-[380px] max-w-[420px]',
              'rounded-2xl overflow-hidden',
              'bg-sovereign-black/95 backdrop-blur-3xl',
              'border border-sovereign-gold/20',
              'shadow-[0_0_60px_rgba(184,159,103,0.15),0_25px_50px_rgba(0,0,0,0.5)]',
              'flex flex-col',
              'h-[min(520px,70vh)]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-sovereign-gold/15 bg-sovereign-gold/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sovereign-gold/30 to-sovereign-gold/10 flex items-center justify-center">
                    <SparkleIcon className="w-4.5 h-4.5 text-sovereign-gold" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-sovereign-black" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-sovereign-white">
                    {isRTL ? 'مساعد STANDARD.Rent' : 'STANDARD.Rent Assistant'}
                  </h3>
                  <p className="text-[11px] text-sovereign-gold/70">
                    {isRTL ? 'متصل الآن' : 'Online now'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label={isRTL ? 'إغلاق' : 'Close'}
              >
                <CloseIcon className="w-4 h-4 text-sovereign-white/70" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-start gap-2',
                    msg.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  {/* Avatar */}
                  {msg.role === 'assistant' ? (
                    <div className="w-7 h-7 rounded-full bg-sovereign-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <SparkleIcon className="w-3.5 h-3.5 text-sovereign-gold" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-sovereign-white/70" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-sovereign-gold/20 text-sovereign-white rounded-tl-sm'
                        : 'bg-white/[0.07] text-sovereign-white/90 rounded-tr-sm'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-3 py-3 border-t border-sovereign-gold/15 bg-sovereign-gold/[0.03]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 bg-white/[0.06] border border-sovereign-gold/15 rounded-xl',
                    'px-4 py-2.5 text-sm text-sovereign-white placeholder:text-sovereign-white/30',
                    'focus:outline-none focus:border-sovereign-gold/40 focus:ring-1 focus:ring-sovereign-gold/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                  dir="auto"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                    'bg-sovereign-gold/20 hover:bg-sovereign-gold/30 text-sovereign-gold',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                    'hover:scale-105 active:scale-95'
                  )}
                  aria-label={isRTL ? 'إرسال' : 'Send'}
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-sovereign-white/20 mt-1.5 text-center">
                {isRTL ? 'مدعوم بالذكاء الاصطناعي' : 'AI-powered'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all',
          'bg-gradient-to-br from-sovereign-gold to-sovereign-gold/70',
          'hover:shadow-[0_0_30px_rgba(184,159,103,0.4)]',
          'group relative'
        )}
        aria-label={isRTL ? 'المساعد الذكي' : 'AI Assistant'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CloseIcon className="w-6 h-6 text-sovereign-obsidian" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatIcon className="w-6 h-6 text-sovereign-obsidian" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-sovereign-gold/30 animate-ping" />
        )}
      </motion.button>
    </div>
  );
}