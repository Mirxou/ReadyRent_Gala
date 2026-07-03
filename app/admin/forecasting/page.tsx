'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ForecastChart } from '@/components/forecast-chart';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';

interface Forecast {
  id: number;
  forecast_type: string;
  product?: { id: number; name_ar: string };
  category?: { id: number; name_ar: string };
  forecast_start: string;
  forecast_end: string;
  predicted_demand: number;
  predicted_revenue: number;
  confidence_level: number;
  seasonal_factor: number;
  trend_factor: number;
}

export default function ForecastingPage() {
  const { toast } = useToast();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    forecast_start: '',
    forecast_end: '',
    product_id: '',
    category_id: '',
  });

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    try {
      const response = await api.get('/analytics/forecasts/');
      setForecasts(response.data.results || response.data);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل تحميل التنبؤات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.forecast_start || !formData.forecast_end) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال تاريخ البداية والنهاية',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      await api.post('/analytics/forecasts/generate/', formData);
      toast({
        title: 'تم الإنشاء',
        description: 'تم إنشاء التنبؤ بنجاح',
      });
      loadForecasts();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل إنشاء التنبؤ',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const loadHighDemand = async () => {
    if (!formData.forecast_start || !formData.forecast_end) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال تاريخ البداية والنهاية',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.get(
        `/analytics/forecasts/high-demand/?forecast_start=${formData.forecast_start}&forecast_end=${formData.forecast_end}&limit=10`
      );
      setForecasts(response.data.results || response.data);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل تحميل المنتجات عالية الطلب',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">التنبؤ بالطلب</h1>
        <p className="text-muted-foreground">تحليل وتنبؤ بالطلب الموسمي</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إنشاء تنبؤ جديد</CardTitle>
          <CardDescription>قم بإنشاء تنبؤ بالطلب لفترة محددة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="forecast_start">تاريخ البداية</Label>
              <Input
                id="forecast_start"
                type="date"
                value={formData.forecast_start}
                onChange={(e) => setFormData({ ...formData, forecast_start: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="forecast_end">تاريخ النهاية</Label>
              <Input
                id="forecast_end"
                type="date"
                value={formData.forecast_end}
                onChange={(e) => setFormData({ ...formData, forecast_end: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="product_id">معرف المنتج (اختياري)</Label>
              <Input
                id="product_id"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                placeholder="اتركه فارغاً للتنبؤ بجميع المنتجات"
              />
            </div>
            <div>
              <Label htmlFor="category_id">معرف الفئة (اختياري)</Label>
              <Input
                id="category_id"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                placeholder="اتركه فارغاً للتنبؤ بجميع الفئات"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? 'جاري الإنشاء...' : 'إنشاء التنبؤ'}
            </Button>
            <Button onClick={loadHighDemand} variant="outline">
              عرض المنتجات عالية الطلب
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {forecasts.map((forecast) => (
          <Card key={forecast.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {forecast.product?.name_ar || forecast.category?.name_ar || 'تنبؤ عام'}
                  </CardTitle>
                  <CardDescription>
                    {forecast.forecast_start} إلى {forecast.forecast_end}
                  </CardDescription>
                </div>
                <Badge>{forecast.forecast_type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ForecastChart
                forecast={{
                  predicted_demand: forecast.predicted_demand,
                  predicted_revenue: forecast.predicted_revenue,
                  confidence_level: forecast.confidence_level,
                  seasonal_factor: forecast.seasonal_factor,
                  trend_factor: forecast.trend_factor,
                }}
                productName={forecast.product?.name_ar}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {forecasts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد تنبؤات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


