
import React from 'react';
import { ShieldCheck, Clock, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TrustAssuranceChips() {
  return (
    <div className="flex flex-wrap gap-2 my-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">

      {/* 1. Protected Contract */}
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-sovereign-gold/5 border-sovereign-gold/20 text-sovereign-gold cursor-help hover:bg-sovereign-gold/10 transition-colors py-1.5 px-3">
              <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              عقد محمي (Protected)
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-background border-sovereign-gold/20 text-foreground">
            <p className="font-bold text-xs">STANDARD يضمن حقوق الطرفين</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 2. Grace Period */}
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-600 cursor-help hover:bg-emerald-500/10 transition-colors py-1.5 px-3">
              <Clock className="w-3.5 h-3.5 mr-2" />
              نافذة تراجع (10min)
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-background border-emerald-500/20 text-foreground">
            <p className="font-bold text-xs">يمكنك التراجع مجانًا خلال 10 دقائق من التوقيع</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 3. Governance */}
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 text-blue-500 cursor-help hover:bg-blue-500/10 transition-colors py-1.5 px-3">
              <Scale className="w-3.5 h-3.5 mr-2" />
              تحكيم عادل
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-background border-blue-500/20 text-foreground">
            <p className="font-bold text-xs">نظام نزاعات ذكي يحمي الحقوق</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

    </div>
  );
}
