'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotApi } from '@/lib/api/innovation';
import {
  Bot,
  Send,
  X,
  ChevronDown,
  Scale,
  Loader2,
  Sparkles,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  is_typing?: boolean;
}

const QUICK_PROMPTS = [
  { label: 'كيف أرفع نزاعًا؟', icon: '⚖️' },
  { label: 'ما هي آجال الاستئناف؟', icon: '📅' },
  { label: 'ما الفرق بين الوساطة والتحكيم؟', icon: '🤝' },
  { label: 'كيف تعمل آلية Escrow؟', icon: '🔒' },
];

// ── Bubble ───────────────────────────────────────────────────────────────────
function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('flex gap-3 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
        )}
      >
        {isUser ? '👤' : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm'
        )}
      >
        {msg.is_typing ? (
          <div className="flex gap-1 items-center h-4">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-slate-400"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
              />
            ))}
          </div>
        ) : (
          <p style={{ direction: 'rtl' }}>{msg.content}</p>
        )}
        {!msg.is_typing && (
          <p
            className={cn(
              'text-[10px] mt-1',
              isUser ? 'text-blue-200' : 'text-slate-400'
            )}
          >
            {msg.timestamp.toLocaleTimeString('ar-DZ', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface AIDisputeAssistantProps {
  disputeId?: number;
  /** If true, renders inline (no floating button) */
  inline?: boolean;
}

export function AIDisputeAssistant({
  disputeId,
  inline = false,
}: AIDisputeAssistantProps) {
  const [isOpen, setIsOpen] = useState(inline);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: disputeId
        ? `مرحباً! أنا المساعد القضائي الذكي لـ RENTILY. يمكنني مساعدتك في فهم إجراءات قضيتك رقم #${disputeId}. اسألني أي شيء.`
        : 'مرحباً! أنا المساعد القضائي الذكي لـ RENTILY. يمكنني مساعدتك في فهم حقوقك وإجراءات النزاعات والوساطة. كيف يمكنني مساعدتك؟',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !inline) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, inline]);

  const initSession = async () => {
    if (sessionId) return sessionId;
    setIsInitializing(true);
    try {
      const res = await chatbotApi.createSession({ language: 'ar' });
      const sid = res.data?.id ?? res.data?.session_id;
      setSessionId(sid);
      return sid;
    } catch {
      return null;
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const typingMsg: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      is_typing: true,
    };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setIsLoading(true);

    try {
      // Build context-enhanced message
      const contextPrefix = disputeId
        ? `[سياق: قضية رقم ${disputeId}] `
        : '';
      const fullText = contextPrefix + text.trim();

      // Use quick-chat (session-less) or session-based
      let reply = '';
      const sid = await initSession();

      if (sid) {
        const res = await chatbotApi.sendMessage(sid, fullText);
        reply = res.data?.response || res.data?.message || res.data?.content || '';
      } else {
        const res = await chatbotApi.quickChat(fullText, { language: 'ar' });
        reply = res.data?.response || res.data?.message || res.data?.content || '';
      }

      if (!reply) reply = 'عذرًا، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.';

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== 'typing')
          .concat({
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply,
            timestamp: new Date(),
          })
      );
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== 'typing')
          .concat({
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'عذرًا، حدث خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت والمحاولة مجدداً.',
            timestamp: new Date(),
          })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'تم إعادة المحادثة. كيف يمكنني مساعدتك؟',
        timestamp: new Date(),
      },
    ]);
    setSessionId(null);
  };

  // ── Inline render ──
  if (inline) {
    return (
      <div className="flex flex-col h-full">
        <ChatBody
          messages={messages}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isLoading={isLoading}
          isInitializing={isInitializing}
          resetChat={resetChat}
          bottomRef={bottomRef}
          inputRef={inputRef}
        />
      </div>
    );
  }

  // ── Floating button + panel ──
  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "إغلاق المساعد القضائي" : "فتح المساعد القضائي"}
        aria-expanded={isOpen}
        className={cn(
          'fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all',
          'bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:scale-110'
        )}
        whileTap={{ scale: 0.95 }}
        title="المساعد القضائي"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              <ChevronDown className="w-6 h-6" aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              <Scale className="w-6 h-6" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            role="dialog"
            aria-label="نافذة المساعد القضائي"
            className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 h-[520px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center" aria-hidden="true">
                <Scale className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">المساعد القضائي</p>
                <p className="text-[10px] text-blue-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                  مدعوم بالذكاء الاصطناعي
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={resetChat}
                  title="إعادة المحادثة"
                  aria-label="إعادة بدء المحادثة"
                  className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="إغلاق النافذة"
                  className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <ChatBody
              messages={messages}
              input={input}
              setInput={setInput}
              sendMessage={sendMessage}
              isLoading={isLoading}
              isInitializing={isInitializing}
              resetChat={resetChat}
              bottomRef={bottomRef}
              inputRef={inputRef}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Shared chat body ──────────────────────────────────────────────────────────
function ChatBody({
  messages,
  input,
  setInput,
  sendMessage,
  isLoading,
  isInitializing,
  resetChat,
  bottomRef,
  inputRef,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  sendMessage: (text: string) => void;
  isLoading: boolean;
  isInitializing: boolean;
  resetChat: () => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        aria-live="polite"
        role="log"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — show only when 1 message (welcome) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 grid grid-cols-2 gap-2" role="group" aria-label="أسئلة شائعة">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.label)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-right"
            >
              <span className="ml-1" aria-hidden="true">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-center">
        <label htmlFor="chat-input" className="sr-only">رسالتك</label>
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="اسأل عن حقوقك في النزاع..."
          disabled={isLoading || isInitializing}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          style={{ direction: 'rtl' }}
        />
        <Button
          size="icon"
          aria-label="إرسال الرسالة"
          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
          disabled={!input.trim() || isLoading || isInitializing}
          onClick={() => sendMessage(input)}
        >
          {isLoading || isInitializing ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </>
  );
}
