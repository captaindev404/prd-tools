/**
 * AnalyticsChart Component
 *
 * Wrapper for Recharts components with consistent styling
 * Supports line, bar, pie, and area charts
 */

'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getChartColor } from '@/lib/analytics-helpers';
import type { TimeSeriesData, CategoryData } from '@/types/analytics';

interface AnalyticsChartProps {
  title?: string;
  description?: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: TimeSeriesData[] | CategoryData[];
  height?: number;
  xKey?: string;
  yKey?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
}

export function AnalyticsChart({
  title,
  description,
  type,
  data,
  height = 300,
  xKey = 'date',
  yKey = 'value',
  colors,
  showLegend = true,
  showGrid = true,
  className,
}: AnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    const defaultColors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#84cc16', // lime
    ];

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data as TimeSeriesData[]}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xKey}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={colors?.[0] || defaultColors[0]}
                strokeWidth={2}
                dot={{ fill: colors?.[0] || defaultColors[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xKey === 'date' ? 'category' : xKey}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              {showLegend && <Legend />}
              <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
                {(data as CategoryData[]).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      colors?.[index] ||
                      getChartColor(entry.category || '', index) ||
                      defaultColors[index % defaultColors.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data as any}
                dataKey={yKey}
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={height / 3}
                label={(entry) => `${entry.category}: ${entry.value}`}
              >
                {(data as CategoryData[]).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      colors?.[index] ||
                      getChartColor(entry.category || '', index) ||
                      defaultColors[index % defaultColors.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data as TimeSeriesData[]}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis
                dataKey={xKey}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey={yKey}
                stroke={colors?.[0] || defaultColors[0]}
                fill={colors?.[0] || defaultColors[0]}
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}
