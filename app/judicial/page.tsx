'use client';
import { JudicialLedger } from '@/features/judicial/components/judicial-ledger';

export default function JudicialLedgerPage() {
  return (
    <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <JudicialLedger />
      </div>
    </div>
  );
}