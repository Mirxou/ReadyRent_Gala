'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
// @ts-expect-error - hijri-date-converter has incorrect TypeScript definitions
import HijriDate from 'hijri-date-converter';

interface HijriCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  disabled?: (date: Date) => boolean;
}

export function HijriCalendar({ onDateSelect, selectedDate, disabled }: HijriCalendarProps) {
  const [showHijri, setShowHijri] = useState(false);

  const convertToHijri = (date: Date): string => {
    try {
      const hijri = new HijriDate(date);
      return `${hijri.getDay()} ${hijri.getMonthName()} ${hijri.getYear()} هـ`;
    } catch {
      return '';
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            التقويم
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="hijri-mode"
              checked={showHijri}
              onCheckedChange={setShowHijri}
            />
            <Label htmlFor="hijri-mode" className="cursor-pointer">
              هجري
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={disabled}
        />
        {showHijri && selectedDate && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">التاريخ الهجري</p>
            <p className="font-semibold">{convertToHijri(selectedDate)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

