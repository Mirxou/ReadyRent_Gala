'use client';

import { MessageSquare, Heart, Share2 } from 'lucide-react';

export function SocialFeed() {
  const activities = [
    { icon: Heart, text: 'أعجبت سارة بمنتج فستان سهرة ملكي', time: 'منذ 5 دقائق', color: 'text-rose-500' },
    { icon: MessageSquare, text: 'علّق أحمد على تقييم خدمة التصوير', time: 'منذ 12 دقيقة', color: 'text-blue-500' },
    { icon: Share2, text: 'شاركت فاطمة باقة عروس ذهبية', time: 'منذ 25 دقيقة', color: 'text-sovereign-gold' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">نبض المجتمع</h3>
      <div className="space-y-2">
        {activities.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-foreground/80">{item.text}</p>
              <p className="text-[10px] text-muted-foreground">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}