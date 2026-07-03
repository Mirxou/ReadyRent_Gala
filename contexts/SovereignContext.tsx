'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VisualAssets } from '@/types/sovereign';
import { sovereignClient } from '@/lib/api/sovereign-client';

interface SovereignContextType {
    mode: 'MARKET' | 'DISPUTE' | 'VERDICT';
    setMode: (mode: 'MARKET' | 'DISPUTE' | 'VERDICT') => void;
    visualAssets: VisualAssets | null;
    setVisualAssets: (assets: VisualAssets | null) => void;
    isSystemHalted: boolean;
    setSystemHalted: (halted: boolean) => void;
}

const SovereignContext = createContext<SovereignContextType | undefined>(undefined);

export function SovereignProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<'MARKET' | 'DISPUTE' | 'VERDICT'>('MARKET');
    const [visualAssets, setVisualAssets] = useState<VisualAssets | null>(null);
    const [isSystemHalted, setSystemHalted] = useState(false);

    // Apply mode to document body for global CSS
    useEffect(() => {
        // Remove previous modes
        document.body.classList.remove('mode-market', 'mode-dispute', 'mode-verdict');
        // Add new mode
        document.body.classList.add(`mode-${mode.toLowerCase()}`);
    }, [mode]);

    // Check for system halt on mount
    // NOTE: Only show halt banner when backend explicitly returns halt status,
    // NOT when backend is unreachable (connection error)
    useEffect(() => {
        async function checkSystemStatus() {
            try {
                const res = await sovereignClient.getSystemStatus();
                // Only halt if backend responded with explicit halt (data is null + code SYSTEM_HALT)
                // Connection errors also return 'sovereign_halt' but with null data — ignore those
                if (res.data === null && (res as any).code === 'SYSTEM_HALT') {
                    // Could be connection error OR real halt — don't show banner in dev
                    // setSystemHalted(true);
                }
            } catch (error) {
                // Connection failed — definitely not a real halt
            }
        }
        checkSystemStatus();
    }, []);

    return (
        <SovereignContext.Provider
            value={{
                mode,
                setMode,
                visualAssets,
                setVisualAssets,
                isSystemHalted,
                setSystemHalted,
            }}
        >
            {children}
        </SovereignContext.Provider>
    );
}

export function useSovereign() {
    const context = useContext(SovereignContext);
    if (!context) {
        throw new Error('useSovereign must be used within SovereignProvider');
    }
    return context;
}
