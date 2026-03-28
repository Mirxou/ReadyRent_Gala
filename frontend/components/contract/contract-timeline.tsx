'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Contract } from '@/lib/api/contracts';
import {
  FileText,
  PenLine,
  Lock,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Gavel,
  Unlock,
  AlertTriangle,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Phase definition ─────────────────────────────────────────────────────────
interface Phase {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  dotColor: string;
}

const CONTRACT_PHASES: Phase[] = [
  {
    id: 'created',
    label: 'إنشاء العقد',
    sublabel: 'توليد النسخة المشفرة',
    icon: FileText,
    color: 'text-slate-500',
    dotColor: 'bg-slate-400',
  },
  {
    id: 'renter_signed',
    label: 'توقيع المستأجر',
    sublabel: 'التحقق من الهوية الرقمية',
    icon: PenLine,
    color: 'text-blue-600',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'owner_signed',
    label: 'توقيع المالك',
    sublabel: 'إغلاق دورة التوقيع',
    icon: PenLine,
    color: 'text-indigo-600',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'escrow_locked',
    label: 'قفل الضمان المالي',
    sublabel: 'الأموال محجوزة في Escrow',
    icon: Lock,
    color: 'text-amber-600',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'active',
    label: 'العقد ساري',
    sublabel: 'فترة الإيجار النشطة',
    icon: CheckCircle2,
    color: 'text-green-600',
    dotColor: 'bg-green-500',
  },
  {
    id: 'completed',
    label: 'اكتمال العقد',
    sublabel: 'تحرير الضمان وإغلاق الملف',
    icon: Unlock,
    color: 'text-emerald-600',
    dotColor: 'bg-emerald-500',
  },
];

// Dispute/void branch phases
const BRANCH_PHASES: Record<string, Phase> = {
  disputed: {
    id: 'disputed',
    label: 'نزاع مفتوح',
    sublabel: 'قيد النظر القضائي',
    icon: ShieldAlert,
    color: 'text-orange-600',
    dotColor: 'bg-orange-500',
  },
  judged: {
    id: 'judged',
    label: 'صدر الحكم',
    sublabel: 'تطبيق حكم المحكمة',
    icon: Gavel,
    color: 'text-red-600',
    dotColor: 'bg-red-600',
  },
  void: {
    id: 'void',
    label: 'عقد ملغى',
    sublabel: 'تم الإلغاء قبل الاكتمال',
    icon: AlertTriangle,
    color: 'text-red-500',
    dotColor: 'bg-red-400',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function deriveActivePhaseIndex(contract: Contract & { [k: string]: any }): number {
  const status = contract.status as string;
  const snap = contract.snapshot || {};

  if (status === 'void') return -2;           // special: cancelled
  if (snap.has_dispute) return -3;            // special: disputed

  if (status === 'finalized' || status === 'completed') return 5;
  if (snap.escrow_locked || snap.escrow_status === 'HELD') return 4; // active
  if (snap.escrow_status === 'PENDING' || (contract.renter_signature && contract.owner_signature)) return 3;
  if (contract.owner_signature) return 2;     // owner signed
  if (contract.renter_signature) return 1;    // renter signed
  return 0;                                   // created
}

// ── Node component ────────────────────────────────────────────────────────────
function TimelineNode({
  phase,
  index,
  activeIndex,
  timestamp,
  hash,
}: {
  phase: Phase;
  index: number;
  activeIndex: number;
  timestamp?: string;
  hash?: string;
}) {
  const isDone = index < activeIndex;
  const isActive = index === activeIndex;
  const isPending = index > activeIndex;
  const Icon = phase.icon;

  const statusLabel = isDone ? 'مكتملة' : isActive ? 'جارية الآن' : 'قادمة';

  return (
    <div className="flex gap-4 group" role="listitem" aria-label={`${phase.label} - ${statusLabel}`}>
      {/* Left: dot + connecting line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          initial={false}
          animate={{
            scale: isActive ? [1, 1.15, 1] : 1,
          }}
          transition={{ duration: 1.6, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative',
            isDone
              ? 'bg-green-500 border-green-400 text-white shadow-md shadow-green-200'
              : isActive
              ? `${phase.dotColor} border-white text-white shadow-lg ring-4 ring-offset-2 ring-current/20`
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          )}
        >
          {isActive && phase.id === 'escrow_locked' && (
            <motion.div
              layoutId="escrow-glow"
              className="absolute inset-0 rounded-full bg-amber-400/40 blur-md"
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          {isDone ? (
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Icon className="w-4 h-4 relative z-10" aria-hidden="true" />
          )}
        </motion.div>
        {index < CONTRACT_PHASES.length - 1 && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-[32px] mt-1 transition-all duration-700',
              isDone ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'
            )}
          />
        )}
      </div>

      {/* Right: content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={cn(
                'text-sm font-bold transition-colors',
                isDone
                  ? 'text-green-700 dark:text-green-400'
                  : isActive
                  ? `${phase.color} dark:text-current`
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              {phase.label}
            </p>
            <p
              className={cn(
                'text-xs mt-0.5',
                isPending ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'
              )}
            >
              {phase.sublabel}
            </p>
          </div>

          {/* Timestamp badge */}
          {timestamp && !isPending && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex-shrink-0">
              {new Date(timestamp).toLocaleDateString('ar-DZ')}
            </span>
          )}
          {isPending && (
            <span className="text-[10px] text-slate-300 dark:text-slate-600 flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" /> قادم
            </span>
          )}
        </div>

        {/* Blockchain hash */}
        {hash && !isPending && (
          <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono text-blue-400 truncate">
            <Link2 className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{hash.slice(0, 24)}…</span>
          </div>
        )}

        {/* Active glow badge */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
              المرحلة الحالية
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface ContractTimelineProps {
  contract: Contract & { [k: string]: any };
  className?: string;
}

export function ContractTimeline({ contract, className }: ContractTimelineProps) {
  const activeIndex = useMemo(() => deriveActivePhaseIndex(contract), [contract]);
  const snap = (contract.snapshot || {}) as Record<string, any>;

  const isVoid = contract.status === 'void';
  const isDisputed = snap.has_dispute;

  // Timestamps from snapshot
  const timestamps: Record<string, string | undefined> = {
    created:       contract.created_at,
    renter_signed: snap.renter_signed_at || (contract.renter_signature ? contract.created_at : undefined),
    owner_signed:  snap.owner_signed_at  || (contract.owner_signature  ? contract.signed_at  : undefined),
    escrow_locked: snap.escrow_locked_at,
    active:        snap.active_since,
    completed:     snap.completed_at || contract.signed_at,
  };

  // Hashes — contract_hash for the creation step, others from snapshot
  const hashes: Record<string, string | undefined> = {
    created:       contract.contract_hash,
    renter_signed: snap.renter_signature_hash,
    owner_signed:  snap.owner_signature_hash,
    escrow_locked: snap.escrow_hash,
    completed:     snap.completion_hash,
  };

  return (
    <div className={cn('bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6', className)}>
      <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-500" />
        مسار العقد الزمني
      </h3>

      {/* Main phases */}
      <div className="relative" role="list" aria-label="مراحل العقد">
        {CONTRACT_PHASES.map((phase, i) => (
          <TimelineNode
            key={phase.id}
            phase={phase}
            index={i}
            activeIndex={activeIndex >= 0 ? activeIndex : 0}
            timestamp={timestamps[phase.id]}
            hash={hashes[phase.id]}
          />
        ))}
      </div>

      {/* Branch: Disputed or Void */}
      {(isDisputed || isVoid) && (
        <div className="mt-2 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-bold">مسار استثنائي</p>
          <div className="flex gap-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 text-white',
                  isVoid ? 'bg-red-400 border-red-300' : 'bg-orange-500 border-orange-400'
                )}
              >
                {isVoid
                  ? <AlertTriangle className="w-4 h-4" />
                  : <ShieldAlert className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <p className={cn('text-sm font-bold', isVoid ? 'text-red-500' : 'text-orange-600')}>
                {isVoid ? BRANCH_PHASES.void.label : BRANCH_PHASES.disputed.label}
              </p>
              <p className="text-xs text-slate-400">
                {isVoid ? BRANCH_PHASES.void.sublabel : BRANCH_PHASES.disputed.sublabel}
              </p>
              {isDisputed && snap.dispute_id && (
                <a
                  href={`/disputes/${snap.dispute_id}`}
                  className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center gap-1"
                >
                  عرض ملف النزاع #{snap.dispute_id}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hash footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[9px] font-mono text-slate-300 dark:text-slate-600 text-center uppercase tracking-widest">
          Contract Hash: {contract.contract_hash?.slice(0, 32) ?? 'N/A'}…
        </p>
      </div>
    </div>
  );
}
