'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VisualAssets } from '@/types/sovereign';

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

    // System status check removed — sovereign-client was deprecated
    // The system halt feature will be reimplemented in a future phase

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
