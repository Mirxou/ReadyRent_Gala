'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, api, locationsApi } from '@/lib/api';
import { CalendarIcon, Clock, Zap } from 'lucide-react';
// @ts-expect-error - hijri-date-converter has incorrect TypeScript definitions
import HijriDate from 'hijri-date-converter';

interface BookingCalendarProps {
  productId: number;
  pricePerDay: number;
  onDateSelect?: (startDate: Date | null, endDate: Date | null) => void;
  deliveryZoneId?: number;
  onSameDayChange?: (enabled: boolean, fee: number) => void;
}

export function BookingCalendar({
  productId,
  pricePerDay,
  onDateSelect,
  deliveryZoneId,
  onSameDayChange
}: BookingCalendarProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showHijri, setShowHijri] = useState(false);
  const [sameDayEnabled, setSameDayEnabled] = useState(false);

  // Fetch bookings for this product to get unavailable dates
  const { data: bookings } = useQuery({
    queryKey: ['product-bookings', productId],
    queryFn: async () => {
      const response = await bookingsApi.getAll();
      return response.data.filter((b: { product?: number | { id: number } }) => b.product === productId || (typeof b.product === 'object' && b.product?.id === productId));
    },
    enabled: !!productId,
  });

  // Fetch maintenance periods for this product
  const { data: maintenancePeriods } = useQuery({
    queryKey: ['maintenance-periods', productId],
    queryFn: async () => {
      const response = await api.get('/maintenance/periods/', {
        params: { product: productId, blocks_bookings: true }
      });
      return response.data;
    },
    enabled: !!productId,
  });

  // Check same-day delivery availability
  const { data: sameDayInfo } = useQuery({
    queryKey: ['same-day-delivery', deliveryZoneId],
    queryFn: () => deliveryZoneId ? locationsApi.checkSameDayDelivery(deliveryZoneId).then((res) => res.data) : null,
    enabled: !!deliveryZoneId,
  });

  // Get unavailable dates from bookings
  const bookingDates = bookings?.reduce((dates: Date[], booking: { start_date: string; end_date: string }) => {
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, []) || [];

  // Get unavailable dates from maintenance periods
  const maintenanceDates = maintenancePeriods?.results?.reduce((dates: Date[], period: { start_datetime: string; end_datetime: string }) => {
    const start = new Date(period.start_datetime);
    const end = new Date(period.end_datetime);
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, []) || [];

  // Combine all unavailable dates
  const unavailableDates = [...bookingDates, ...maintenanceDates];

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates
    if (date < today) return true;

    // Disable unavailable dates
    return unavailableDates.some((unavailable: Date) => {
      const unavailableDate = new Date(unavailable);
      unavailableDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return unavailableDate.getTime() === checkDate.getTime();
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      onDateSelect?.(date, null);
    } else if (startDate && !endDate) {
      // Select end date
      if (date < startDate) {
        // If selected date is before start date, make it the new start date
        setStartDate(date);
        setEndDate(null);
        onDateSelect?.(date, null);
      } else {
        // Check if range is valid (no unavailable dates in between)
        const tempEnd = date;
        const tempStart = startDate;
        const days = Math.ceil((tempEnd.getTime() - tempStart.getTime()) / (1000 * 60 * 60 * 24));
        const datesInRange: Date[] = [];

        for (let i = 0; i <= days; i++) {
          const checkDate = new Date(tempStart);
          checkDate.setDate(checkDate.getDate() + i);
          datesInRange.push(checkDate);
        }

        const hasUnavailable = datesInRange.some(d => isDateDisabled(d));

        if (!hasUnavailable) {
          setEndDate(tempEnd);
          onDateSelect?.(tempStart, tempEnd);
        }
      }
    }
  };

  const totalDays = startDate && endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  const totalPrice = totalDays * pricePerDay;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatHijriDate = (date: Date | null) => {
    if (!date) return '';
    try {
      const hijri = new HijriDate(date);
      return `${hijri.getDay()} ${hijri.getMonthName()} ${hijri.getYear()} هـ`;
    } catch {
      return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            اختر تواريخ الحجز
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="hijri-toggle"
              checked={showHijri}
              onCheckedChange={setShowHijri}
            />
            <Label htmlFor="hijri-toggle" className="cursor-pointer text-sm">
              هجري
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={startDate || undefined}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            className="rounded-md border"
          />
        </div>

        {startDate && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">تاريخ البداية:</span>
              <div className="text-right">
                <span className="font-semibold">{formatDate(startDate)}</span>
                {showHijri && (
                  <p className="text-xs text-muted-foreground">{formatHijriDate(startDate)}</p>
                )}
              </div>
            </div>

            {endDate ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">تاريخ النهاية:</span>
                  <div className="text-right">
                    <span className="font-semibold">{formatDate(endDate)}</span>
                    {showHijri && (
                      <p className="text-xs text-muted-foreground">{formatHijriDate(endDate)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">عدد الأيام:</span>
                  <Badge variant="secondary">{totalDays} يوم</Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-lg font-semibold">المجموع:</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalPrice.toFixed(0)} دج
                  </span>
                </div>

                {/* Same-day Delivery Option */}
                {sameDayInfo?.available && startDate && endDate && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="same-day-delivery"
                          checked={sameDayEnabled}
                          onCheckedChange={(checked) => {
                            setSameDayEnabled(checked);
                            if (onSameDayChange) {
                              onSameDayChange(checked, sameDayInfo.fee || 0);
                            }
                          }}
                        />
                        <Label htmlFor="same-day-delivery" className="cursor-pointer flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          تسليم في اليوم نفسه
                        </Label>
                      </div>
                      {sameDayInfo.fee > 0 && (
                        <span className="text-sm font-semibold text-primary">
                          +{sameDayInfo.fee.toFixed(0)} دج
                        </span>
                      )}
                    </div>
                    {sameDayInfo.cutoff_time && (
                      <p className="text-xs text-muted-foreground">
                        آخر موعد للطلب: {sameDayInfo.cutoff_time}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                اختر تاريخ النهاية
              </div>
            )}
          </div>
        )}

        {unavailableDates.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold mb-1">ملاحظة:</p>
            <p>التواريخ المظللة غير متاحة للحجز</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

