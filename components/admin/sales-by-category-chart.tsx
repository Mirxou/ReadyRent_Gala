'use client'
import { formatNumber } from '@/lib/utils';;

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesByCategory {
  name: string;
  count: number;
  revenue: number;
  product__category__name_ar?: string;
  product__category__name?: string;
  avg_price?: number;
}

interface SalesByCategoryChartProps {
  data: SalesByCategory[];
}

export function SalesByCategoryChart({ data }: SalesByCategoryChartProps) {
  const chartData = data.map((item) => ({
    category: item.name || item.product__category__name_ar || item.product__category__name || 'بدون فئة',
    revenue: parseFloat(item.revenue.toString()),
    bookings: item.count,
    avgPrice: item.avg_price ? parseFloat(item.avg_price.toString()) : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>المبيعات حسب الفئة</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" style={{ fontSize: '12px' }} />
            <YAxis 
              dataKey="category" 
              type="category" 
              width={120}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value: any, name: any) => {
                const numValue = value || 0;
                const nameStr = name || '';
                if (nameStr === 'revenue') return [`${formatNumber(numValue)} دج`, 'الإيرادات'];
                if (nameStr === 'bookings') return [numValue, 'عدد الحجوزات'];
                return [numValue, nameStr];
              }}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#8884d8" name="الإيرادات" />
            <Bar dataKey="bookings" fill="#82ca9d" name="عدد الحجوزات" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

