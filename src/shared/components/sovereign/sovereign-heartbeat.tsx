"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Database, Zap, Globe } from 'lucide-react';
import { GlassPanel } from './glass-panel';

interface NodeStatus {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  latency: number;
  icon: React.ElementType;
}

export function SovereignHeartbeat() {
  const nodes: NodeStatus[] = useMemo(() => [
    { id: '1', name: 'Algiers North', status: 'healthy', latency: 42, icon: Globe },
    { id: '2', name: 'Oran West', status: 'healthy', latency: 38, icon: Zap },
    { id: '3', name: 'Judicial Vault', status: 'healthy', latency: 12, icon: Database },
    { id: '4', name: 'Escrow Engine', status: 'healthy', latency: 15, icon: ShieldCheck },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black italic flex items-center gap-3">
          <Activity className="w-5 h-5 text-sovereign-gold animate-pulse" />
          نبض الاستقرار المؤسسي
          <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20 font-black uppercase tracking-tighter">
            Live
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4" role="region" aria-label="Regional Uptime Monitor">
        {nodes.map((node) => (
          <GlassPanel 
            key={node.id} 
            className="p-4 flex flex-col justify-between h-32 relative overflow-hidden group"
            gradientBorder
            role="status"
            aria-live="polite"
          >
            {/* Background Pulse Effect */}
            <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${
              node.status === 'healthy' ? 'bg-green-500' : 'bg-sovereign-gold'
            }`} aria-hidden="true" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 rounded-xl bg-white/5 text-sovereign-gold">
                <node.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex gap-1 items-end" aria-label={`Latency: ${node.latency} milliseconds`}>
                <span className="text-lg font-black">{node.latency}</span>
                <span className="text-[8px] font-bold uppercase opacity-40 mb-1">ms</span>
              </div>
            </div>

            <div className="relative z-10 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">{node.name}</span>
                <span className="text-xs font-black tracking-tighter uppercase tracking-widest text-green-500">
                  Operational
                </span>
              </div>
              
              {/* Waveform Visualization */}
              <div className="flex items-end gap-0.5 h-6" aria-hidden="true">
                {[0.4, 0.7, 0.5, 0.9, 0.2].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-sovereign-gold/30 rounded-full"
                    animate={{ height: [`${h * 80}%`, `${(1 - h) * 100}%`, `${h * 80}%`] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1 + i * 0.2,
                      ease: "easeInOut" 
                    }}
                  />
                ))}
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>

    </div>
  );
}
