'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesByStatus {
  status: string;
  count: number;
  revenue: number;
}

interface SalesByStatusChartProps {
  data: SalesByStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#ffc658',
  confirmed: '#0088fe',
  in_use: '#00c49f',
  completed: '#00ff00',
  cancelled: '#ff0000',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  in_use: 'قيد الاستخدام',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export function SalesByStatusChart({ data }: SalesByStatusChartProps) {
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    revenue: parseFloat(item.revenue.toString()),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>الحجوزات حسب الحالة</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const status = data[index]?.status || '';
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[status] || '#8884d8'} 
                  />
                );
              })}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined, props: any) => {
                const numValue = value || 0;
                const revenue = props.payload?.revenue || 0;
                return [
                  `${numValue} حجز (${revenue.toLocaleString()} دج)`,
                  'عدد الحجوزات',
                ];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

