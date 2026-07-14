'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';
import { Users, Shield, Heart, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { socialApi } from '@/lib/api';

export default function SocialPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const store = useAuthStore.getState();
      setUserId(store.user?.id || null);
    }
  }, [isAuthenticated]);

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['social-feed'],
    queryFn: () => socialApi.getFeed().then(r => r.data),
  });

  const feed = feedData?.data || feedData || [];

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      <SovereignGlow />
      <SovereignSparkle />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-sovereign-gold via-yellow-300 to-sovereign-gold bg-clip-text text-transparent">
            الضمان الاجتماعي
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            نظام الثقة المجتمعي — حيث يضمن المجتمع بعضه البعض. كل ضمان يزيد من نقاط الثقة ويبني شبكة أمان حقيقية.
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Shield, title: 'ضمان مجتمعي', desc: '5 مستخدمين موثقين يضمنون لك' },
            { icon: Heart, title: 'نقاط ثقة', desc: 'كل ضمان يزيد من مصداقيتك' },
            { icon: TrendingUp, title: 'مزايا حصرية', desc: 'وصول لخدمات مخصصة بناءً على الثقة' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassPanel className="p-6 text-center">
                <f.icon className="h-8 w-8 text-sovereign-gold mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        {/* Social Feed */}
        <GlassPanel className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-sovereign-gold" />
            نبض المجتمع
          </h2>

          {feedLoading ? (
            <DignifiedLoader />
          ) : Array.isArray(feed) && feed.length > 0 ? (
            <div className="space-y-4">
              {feed.map((item: any, i: number) => (
                <div key={item.id || i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-sovereign-gold/20 flex items-center justify-center text-sovereign-gold font-bold">
                    {(item.userName || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.userName || 'مستخدم'}</p>
                    <p className="text-xs text-muted-foreground">{item.action || 'نشاط جديد'}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-sovereign-gold/30 text-sovereign-gold shrink-0">
                    {item.type || 'social'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              لا توجد أنشطة مجتمعية حتى الآن. سجّل دخولك وابدأ ببناء شبكة ثقتك!
            </p>
          )}
        </GlassPanel>

        {!isAuthenticated && (
          <div className="text-center">
            <Button
              className="bg-gradient-to-r from-sovereign-gold to-yellow-500 text-black font-bold rounded-2xl h-14 px-8 text-lg hover:opacity-90"
              onClick={() => router.push('/login')}
            >
              سجّل دخولك للمشاركة في الضمان الاجتماعي
            </Button>
          </div>
        )}

        {isAuthenticated && (
          <div className="text-center">
            <Button
              className="bg-gradient-to-r from-sovereign-gold to-yellow-500 text-black font-bold rounded-2xl h-14 px-8 text-lg hover:opacity-90"
              onClick={() => router.push('/dashboard/social')}
            >
              لوحة الضمان الاجتماعي
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}