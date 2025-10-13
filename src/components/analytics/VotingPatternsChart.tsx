/**
 * VotingPatternsChart Component
 *
 * Bar chart showing voting patterns by feature/product area
 * Uses Recharts for visualization
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryData } from '@/types/analytics';

interface VotingPatternsChartProps {
  data: CategoryData[];
  title?: string;
  description?: string;
  height?: number;
  dataKey?: string;
  categoryKey?: string;
  showPercentage?: boolean;
  className?: string;
}

export function VotingPatternsChart({
  data,
  title = 'Voting Patterns',
  description = 'Votes by product area or feature',
  height = 350,
  dataKey = 'value',
  categoryKey = 'category',
  showPercentage = true,
  className,
}: VotingPatternsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400">No voting data available</p>
        </CardContent>
      </Card>
    );
  }

  // Color palette for bars
  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{item[categoryKey]}</p>
          <p className="text-sm text-gray-600">
            Votes: <span className="font-semibold text-blue-600">{item[dataKey]}</span>
          </p>
          {showPercentage && item.percentage !== undefined && (
            <p className="text-sm text-gray-600">
              Percentage:{' '}
              <span className="font-semibold text-gray-900">{item.percentage.toFixed(1)}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Truncate long category names for axis
  const truncateLabel = (label: string, maxLength: number = 15) => {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength) + '...';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
            barSize={50}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={categoryKey}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
              tickFormatter={(value) => truncateLabel(value)}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} name="Votes">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
