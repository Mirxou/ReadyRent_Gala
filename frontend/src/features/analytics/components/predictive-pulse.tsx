"use client";

import React from 'react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  ComposedChart,
} from 'recharts';
import { BrainCircuit, TrendingUp, AlertTriangle, Droplets, Sparkles, Quote } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * SovereignPredictivePulse - Market Intelligence.
 * Refined for Phase 11: Sovereign Mastery (McKinsey Standard).
 * 
 * Features:
 * - High-DPI Area Rendering.
 * - Takeaway Narrative (Consulting Style).
 * - Risk & Liquidity Synthesis.
 */

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const MOCK_DATA = Array.from({ length: 12 }).map((_, i) => ({
  month: AR_MONTHS[i % 12],
  price: 150000 + (Math.sin(i / 2) * 20000) + (i * 5000), // More organic growth
  liquidity: 75 + (Math.cos(i / 2) * 15), 
  risk: Math.max(5, 35 - (i * 2.5) + (Math.random() * 5)),
}));

export function SovereignPredictivePulse() {
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-sovereign-obsidian/95 border border-sovereign-gold/30 p-5 rounded-[24px] shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in duration-500">
          <p className="text-[10px] font-black text-sovereign-gold uppercase tracking-[0.3em] mb-4 opacity-70">{label} 2026</p>
          <div className="space-y-4">
             <div className="flex items-center justify-between gap-12">
                <span className="text-[11px] font-bold text-white/60">توقع القيمة:</span>
                <span className="font-mono text-sovereign-gold font-black">{Number(payload[0].value).toLocaleString()} <span className="text-[9px] opacity-40">DZD</span></span>
             </div>
             <div className="flex items-center justify-between gap-12">
                <span className="text-[11px] font-bold text-white/60">سيولة الثقة:</span>
                <span className="font-mono text-cyan-400 font-black">{payload[1].value.toFixed(1)}%</span>
             </div>
             <div className="flex items-center justify-between gap-12">
                <span className="text-[11px] font-bold text-white/60">معامل المخاطر:</span>
                <span className="font-mono text-red-500 font-black">{payload[2].value.toFixed(1)}%</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassPanel className="p-10 relative overflow-hidden group" variant="obsidian" gradientBorder>
      
      {/* McKinsey Style Top Badge */}
      <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-10">
          <BrainCircuit className="w-48 h-48 text-sovereign-gold" />
      </div>

      <div className="relative z-20 flex flex-col gap-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20 px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                Market Intel v11.0
              </Badge>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Sovereign Analytical Core</span>
            </div>
            <h3 className="text-4xl font-black italic tracking-tighter leading-tight">
              نبض التنبؤ <span className="text-sovereign-gold">السيادي</span>
            </h3>
            <p className="max-w-2xl text-sm text-white/50 leading-relaxed font-medium">
              محرك التحليل العصبى لـ ReadyRent يقدم رؤية استشرافية لعام 2026. التحليل يجمع بين سيولة الثقة واتجاهات العرض والطلب في السوق الجزائري.
            </p>
          </div>
          
          <div className="p-4 bg-sovereign-gold/5 border border-sovereign-gold/20 rounded-3xl backdrop-blur-xl flex flex-col gap-2 min-w-[200px]">
             <span className="text-[10px] font-black text-sovereign-gold uppercase tracking-widest">معدل الثقة العام</span>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-black italic">98.2%</span>
                <Sparkles className="w-4 h-4 text-sovereign-gold mb-2 animate-golden-spark" />
             </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Chart Column */}
          <div className="lg:col-span-3 space-y-8">
            <div className="h-[350px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={MOCK_DATA} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5A059" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.1)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={15} 
                    fontFamily="inherit"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(197, 160, 89, 0.2)', strokeWidth: 2 }} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="liquidity" 
                    stroke="#22D3EE" 
                    strokeWidth={1}
                    fill="url(#liquidityGradient)" 
                    animationDuration={2000}
                  />

                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#C5A059" 
                    strokeWidth={4}
                    fill="url(#priceGradient)" 
                    animationDuration={3000}
                  />

                  <Line 
                    type="stepAfter" 
                    dataKey="risk" 
                    stroke="#EF4444" 
                    strokeWidth={2} 
                    dot={false}
                    strokeDasharray="8 8"
                    opacity={0.4}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              {/* McKinsey Overlay Line */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 pointer-events-none" />
            </div>

            {/* Legend / Metrics Row */}
            <div className="flex flex-wrap gap-8 items-center pt-4 border-t border-white/5">
                {[
                  { label: "القيمة السوقية", color: "bg-sovereign-gold", key: "price" },
                  { label: "سيولة الثقة", color: "bg-cyan-400", key: "liquidity" },
                  { label: "معامل المخاطر", color: "bg-red-500 opacity-50", key: "risk" }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", item.color)} />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Right Insight Panel (Consulting Sidebar) */}
          <div className="space-y-6">
             <div className="p-6 rounded-[32px] bg-white/2 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-sovereign-gold">
                   <Quote className="w-4 h-4 fill-current" />
                   <span className="text-[10px] font-black uppercase tracking-widest">خلاصة استشارية</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-bold italic rtl">
                  "نتوقع استقراراً سعرياً ملحوظاً في الربع الثالث، مدعوماً بارتفاع سيولة الثقة الائتمانية بنسبة تتجاوز 12%."
                </p>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border border-sovereign-obsidian bg-sovereign-gold/20" />
                      ))}
                   </div>
                   <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">AI Audit: Passed</span>
                </div>
             </div>

             <div className="p-6 rounded-[32px] bg-sovereign-gold/5 border border-sovereign-gold/10 space-y-2">
                <div className="text-[10px] font-black text-sovereign-gold/60 uppercase tracking-widest">معامل الأمان</div>
                <div className="text-3xl font-black italic">A+ <span className="text-[10px] font-normal opacity-40 uppercase">Stable</span></div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                   <div className="w-[85%] h-full bg-sovereign-gold" />
                </div>
             </div>
          </div>

        </div>
      </div>

    </GlassPanel>
  );
}
