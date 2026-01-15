'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopProduct {
  product__id: number;
  product__name_ar: string | null;
  product__name: string | null;
  count: number;
  revenue: number;
  avg_price: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
  limit?: number;
}

export function TopProductsChart({ data, limit = 10 }: TopProductsChartProps) {
  const chartData = data
    .slice(0, limit)
    .map((item) => ({
      name: item.product__name_ar || item.product__name || 'منتج',
      revenue: parseFloat(item.revenue.toString()),
      bookings: item.count,
      avgPrice: parseFloat(item.avg_price.toString()),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>أفضل {limit} منتج</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" style={{ fontSize: '12px' }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={150}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => {
                const numValue = value || 0;
                const nameStr = name || '';
                if (nameStr === 'revenue') return [`${numValue.toLocaleString()} دج`, 'الإيرادات'];
                if (nameStr === 'bookings') return [numValue, 'عدد الحجوزات'];
                if (nameStr === 'avgPrice') return [`${numValue.toLocaleString()} دج`, 'متوسط السعر'];
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

