'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface ForecastData {
  predicted_demand: number;
  predicted_revenue: number;
  confidence_level: number;
  seasonal_factor: number;
  trend_factor: number;
}

interface ForecastChartProps {
  forecast: ForecastData;
  productName?: string;
}

export function ForecastChart({ forecast, productName }: ForecastChartProps) {
  const getConfidenceColor = (level: number) => {
    if (level >= 70) return 'text-green-600';
    if (level >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (factor: number) => {
    if (factor > 1.1) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (factor < 0.9) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>التنبؤ بالطلب</CardTitle>
        {productName && <CardDescription>{productName}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">الطلب المتوقع</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{forecast.predicted_demand}</p>
            <p className="text-xs text-muted-foreground">حجز متوقع</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">الإيرادات المتوقعة</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {forecast.predicted_revenue.toFixed(2)} دج
            </p>
            <p className="text-xs text-muted-foreground">إيرادات متوقعة</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">مستوى الثقة</span>
            <Badge className={getConfidenceColor(forecast.confidence_level)}>
              {forecast.confidence_level.toFixed(1)}%
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">العامل الموسمي</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{forecast.seasonal_factor.toFixed(2)}x</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">عامل الاتجاه</span>
            <div className="flex items-center gap-1">
              {getTrendIcon(forecast.trend_factor)}
              <span className="font-medium">{forecast.trend_factor.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


