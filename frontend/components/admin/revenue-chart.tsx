'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyRevenue {
  day: string;
  revenue: number;
  count: number;
}

interface RevenueChartProps {
  data: DailyRevenue[];
  period?: {
    start_date: string;
    end_date: string;
    days: number;
  };
}

export function RevenueChart({ data, period }: RevenueChartProps) {
  // Format data for display
  const chartData = data.map((item) => ({
    date: new Date(item.day).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(item.revenue.toString()),
    bookings: item.count,
  }));

  return (
    <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8">
        <CardTitle className="text-2xl font-bold">الإيرادات اليومية</CardTitle>
        {period && (
          <p className="text-sm text-muted-foreground/60 font-medium mt-1">
            من {new Date(period.start_date).toLocaleDateString('ar-DZ')} إلى{' '}
            {new Date(period.end_date).toLocaleDateString('ar-DZ')}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
              tickFormatter={(value) => `${value.toLocaleString()} دج`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()} دج`, 'الإيرادات']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="url(#lineGradient)"
              strokeWidth={4}
              name="الإيرادات"
              dot={{ r: 6, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, fill: '#EC4899', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

