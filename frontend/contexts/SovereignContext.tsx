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
    useEffect(() => {
        async function checkSystemStatus() {
            try {
                const res = await sovereignClient.getSystemStatus();
                if (res.status === 'sovereign_halt' || (res as any).code === 'SYSTEM_HALT') {
                    setSystemHalted(true);
                }
            } catch (error) {
                console.error('Failed to check system status:', error);
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
