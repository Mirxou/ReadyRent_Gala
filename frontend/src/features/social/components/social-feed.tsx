"use client";

import { useQuery } from '@tanstack/react-query';
import { socialApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Sparkles, Quote, Loader2, Heart } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * SocialFeed - The Community Pulse.
 * Moved to src/features/social/components/social-feed.tsx (Phase 11).
 * 
 * Principles:
 * - Real-time "Standard Pulse".
 * - High-DPI Avatars with Sovereign Badges.
 * - Localized for the Algerian Community.
 */

interface SocialActivity {
  id: number;
  type: 'vouch' | 'review' | 'new_item' | 'verification';
  user: {
    username: string;
    profile_image?: string;
    is_sovereign?: boolean;
    trust_score?: number;
  };
  target_name?: string;
  target_image?: string;
  content?: string;
  created_at: string;
}

export function SocialFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['social-feed'],
    queryFn: () => socialApi.getFeed().then((res: any) => res.data),
    refetchInterval: 30000, 
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 h-[600px]">
        <Loader2 className="w-10 h-10 animate-spin text-sovereign-gold opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-10" dir="rtl">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-sovereign-gold animate-golden-spark" />
            نبض المجتمع
            </h2>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                Real-time
            </Badge>
        </div>
        <p className="text-sm text-white/30 italic font-medium">مراقبة حية لنشاطات النخبة والتوثيق السيادي.</p>
      </div>

      <div className="flex flex-col gap-6">
        <AnimatePresence>
          {activities?.map((activity: SocialActivity, index: number) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.15,
                ease: [0.32, 0.72, 0, 1] 
              }}
            >
              <GlassPanel className="p-6 relative group overflow-hidden border-white/5 bg-white/[0.02]" variant="default">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-sovereign-gold/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="flex items-start gap-6 relative z-10">
                  {/* User Shield Avatar */}
                  <div className="relative w-14 h-14 rounded-full p-1 bg-gradient-to-br from-sovereign-gold/40 to-transparent flex-shrink-0 group-hover:rotate-6 transition-transform duration-500">
                    <div className="w-full h-full rounded-full bg-sovereign-obsidian flex items-center justify-center border border-white/10 overflow-hidden">
                        {activity.user.profile_image ? (
                        <Image src={activity.user.profile_image} alt="" fill className="object-cover" />
                        ) : (
                        <div className="text-xl font-black text-white/20">{activity.user.username[0]}</div>
                        )}
                    </div>
                    {activity.user.is_sovereign && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sovereign-gold rounded-full border-2 border-sovereign-obsidian flex items-center justify-center text-[10px] text-sovereign-obsidian shadow-xl">
                        👑
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h4 className="font-black text-base tracking-tight text-white/90">
                            {activity.user.username}
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sovereign-gold/60">
                            Trust Score: {activity.user.trust_score}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/20 font-bold">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ar })}
                      </span>
                    </div>

                    <div className="text-sm leading-relaxed text-white/50">
                      {activity.type === 'vouch' && (
                        <p>
                          قامت بضمان <span className="text-sovereign-gold font-black">"{activity.target_name}"</span>. 
                          <span className="block mt-2 text-[11px] italic opacity-60">"تؤكد جودة القطعة ومطابقتها للمواصفات."</span>
                        </p>
                      )}
                      {activity.type === 'verification' && (
                        <p className="text-emerald-400 font-black flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          أكملت توثيق الهوية السيادية بنجاح.
                        </p>
                      )}
                      {activity.type === 'review' && (
                        <div className="space-y-4 pt-2">
                          <p>
                            أضافت تقييماً لـ <span className="text-white/80 font-black">"{activity.target_name}"</span>
                          </p>
                          <div className="p-4 bg-white/[0.03] rounded-3xl text-sm italic border-r-4 border-sovereign-gold/30 relative">
                             <Quote className="absolute -top-3 -right-3 w-6 h-6 text-sovereign-gold/20 fill-current" />
                            "{activity.content}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="text-center pt-8">
        <button className="text-[10px] font-black text-white/20 hover:text-sovereign-gold transition-colors uppercase tracking-[0.4em] decoration-sovereign-gold/30 underline-offset-8 underline">
          Expand Registry
        </button>
      </div>
    </div>
  );
}
