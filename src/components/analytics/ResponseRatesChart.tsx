/**
 * ResponseRatesChart Component
 *
 * Funnel chart showing questionnaire response rates
 * Uses Recharts for visualization
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResponseRatesChartProps {
  data: {
    sent: number;
    opened?: number;
    started?: number;
    completed: number;
  };
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}

export function ResponseRatesChart({
  data,
  title = 'Questionnaire Response Funnel',
  description = 'Response journey from sent to completed',
  height = 350,
  className,
}: ResponseRatesChartProps) {
  // Build funnel data
  const funnelData = [
    {
      stage: 'Sent',
      count: data.sent,
      percentage: 100,
      color: '#3b82f6',
    },
  ];

  if (data.opened !== undefined && data.opened > 0) {
    funnelData.push({
      stage: 'Opened',
      count: data.opened,
      percentage: data.sent > 0 ? (data.opened / data.sent) * 100 : 0,
      color: '#06b6d4',
    });
  }

  if (data.started !== undefined && data.started > 0) {
    funnelData.push({
      stage: 'Started',
      count: data.started,
      percentage: data.sent > 0 ? (data.started / data.sent) * 100 : 0,
      color: '#8b5cf6',
    });
  }

  funnelData.push({
    stage: 'Completed',
    count: data.completed,
    percentage: data.sent > 0 ? (data.completed / data.sent) * 100 : 0,
    color: '#10b981',
  });

  // Calculate completion rate
  const completionRate = data.sent > 0 ? ((data.completed / data.sent) * 100).toFixed(1) : '0.0';

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{item.stage}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-semibold text-blue-600">{item.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Rate:{' '}
            <span className="font-semibold text-gray-900">{item.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    return (
      <g>
        <text
          x={x + width / 2}
          y={y + height / 2}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fontWeight="bold"
        >
          {payload.count}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 18}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
        >
          ({payload.percentage.toFixed(0)}%)
        </text>
      </g>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {funnelData.length === 0 || data.sent === 0 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-gray-400">No response data available</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={height}>
              <BarChart
                data={funnelData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="stage"
                  type="category"
                  stroke="#6b7280"
                  fontSize={13}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  label={renderCustomLabel}
                  maxBarSize={60}
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Drop-off indicators */}
            <div className="mt-4 space-y-2">
              {funnelData.map((stage, index) => {
                if (index === 0) return null;
                const previousStage = funnelData[index - 1];
                const dropOff = previousStage.count - stage.count;
                const dropOffPercentage =
                  previousStage.count > 0 ? (dropOff / previousStage.count) * 100 : 0;

                return (
                  <div key={stage.stage} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {previousStage.stage} → {stage.stage}
                    </span>
                    <span className="text-red-600 font-medium">
                      -{dropOff} ({dropOffPercentage.toFixed(1)}% drop-off)
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
