"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Fingerprint, 
  Hash, 
  Clock, 
  ChevronDown 
} from 'lucide-react';
import { GlassPanel } from './glass-panel';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  status: 'sealed' | 'pending';
  hash: string;
  actor: string;
  description: string;
}

const mockLogs: AuditLog[] = [
  { 
    id: 'TRX-1092', 
    action: 'ESCROW_RELEASE', 
    timestamp: '2026-04-01T11:20:00Z', 
    status: 'sealed', 
    hash: '0x8f2d...23e1', 
    actor: 'Tribunal Engine v1.0', 
    description: 'Final verdict executed for Dispute #44. Funds distributed.' 
  },
  { 
    id: 'TRX-1091', 
    action: 'VERDICT_RENDERED', 
    timestamp: '2026-04-01T11:15:00Z', 
    status: 'sealed', 
    hash: '0x4e5f...6g7h', 
    actor: 'Judge @algiers_court', 
    description: 'Manual verdict issued in favor of Owner. Evidence consistency 98%.' 
  },
  { 
    id: 'TRX-1090', 
    action: 'EVIDENCE_LOCK', 
    timestamp: '2026-04-01T11:05:00Z', 
    status: 'sealed', 
    hash: '0x1a2b...c3d4', 
    actor: 'System Auto-Vault', 
    description: 'WORM lock applied to 12 photographic evidence entries for Dispute #44.' 
  },
];

export function SovereignAuditTrail() {
  return (
    <div className="space-y-12 py-8 relative">
      {/* 🛡️ Background Chronology Line (Stripe Style) */}
      <div className="absolute top-0 right-[41px] w-px h-full bg-gradient-to-b from-sovereign-gold/0 via-sovereign-gold/20 to-sovereign-gold/0" />

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-sovereign-gold to-white">
            WORM Chronology
          </h2>
          <p className="text-muted-foreground text-sm font-light italic mt-2 tracking-tighter">
            "تدقيق تاريخي حي للسيادة — سجل غير قابل للتلاعب."
          </p>
        </div>
        <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/30 rounded-lg py-1 px-3">
          Institutional Grade
        </Badge>
      </div>

      <div className="space-y-16">
        {mockLogs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pr-16"
          >
            {/* 🧿 Node Marker */}
            <div className="absolute right-[30px] top-4 w-6 h-6 rounded-full bg-sovereign-obsidian border-2 border-sovereign-gold flex items-center justify-center z-10">
              <div className="w-2 h-2 rounded-full bg-sovereign-gold animate-ping" />
            </div>

            <GlassPanel 
              className="p-8 group hover:scale-[1.01] transition-all rounded-[2rem]" 
              gradientBorder
              role="article"
              aria-labelledby={`audit-label-${log.id}`}
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                <div className="space-y-4 max-w-xl">
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-sovereign-gold bg-sovereign-gold/5 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono opacity-50">#{log.id}</span>
                  </div>
                  
                  <h3 id={`audit-label-${log.id}`} className="text-2xl font-black italic leading-tight text-white group-hover:text-sovereign-gold transition-colors">
                    {log.description}
                  </h3>

                  <div className="flex gap-6 items-center text-xs text-muted-foreground">
                    <div className="flex gap-2 items-center" aria-label={`Actor: ${log.actor}`}>
                      <Fingerprint className="w-3 h-3 text-sovereign-gold/50" aria-hidden="true" />
                      <span className="font-bold">{log.actor}</span>
                    </div>
                    <div className="flex gap-2 items-center" aria-label={`Time: ${new Date(log.timestamp).toLocaleTimeString('ar-DZ')}`}>
                      <Clock className="w-3 h-3 text-sovereign-gold/50" aria-hidden="true" />
                      <span>{new Date(log.timestamp).toLocaleTimeString('ar-DZ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-6 min-w-[200px]">
                   <div className="flex flex-col items-end" aria-label="Security Status">
                      <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest mb-1">
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Integrity Sealed
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 font-mono text-[9px] opacity-40 group-hover:opacity-100 transition-opacity" aria-label={`Integrity Hash: ${log.hash}`}>
                         <span className="text-sovereign-gold/50 mr-2" aria-hidden="true">HASH:</span>
                         {log.hash}
                      </div>
                   </div>
                   
                   <button 
                     className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors min-h-[44px] px-4 cursor-pointer"
                     aria-label="View full evidence details"
                   >
                      VIEW FULL EVIDENCE <ChevronDown className="w-3 h-3" aria-hidden="true" />
                   </button>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div className="text-center pt-8">
        <button 
          className="px-10 py-4 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-[0.4em] hover:bg-sovereign-gold/5 hover:border-sovereign-gold/20 transition-all opacity-40 hover:opacity-100 min-h-[44px] cursor-pointer"
          aria-label="Load entire registry history"
        >
           Load Full Registry History
        </button>
      </div>

    </div>
  );
}
