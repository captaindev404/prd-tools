/**
 * NPSScoreCard Component
 *
 * Displays NPS score with gauge visualization and breakdown
 * Uses Recharts for gauge-style radial bar chart
 */

'use client';

import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NPSScoreCardProps {
  npsScore: number;
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  trend?: number;
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}

export function NPSScoreCard({
  npsScore,
  totalResponses,
  promoters,
  passives,
  detractors,
  trend,
  title = 'Net Promoter Score',
  description = 'Overall customer satisfaction metric',
  height = 300,
  className,
}: NPSScoreCardProps) {
  // Normalize NPS score from -100 to 100 range to 0-100 for gauge
  const normalizedScore = ((npsScore + 100) / 200) * 100;

  // Determine color based on NPS score
  const getScoreColor = (score: number): string => {
    if (score >= 50) return '#10b981'; // Excellent (green)
    if (score >= 30) return '#84cc16'; // Good (lime)
    if (score >= 0) return '#f59e0b'; // Fair (amber)
    if (score >= -30) return '#fb923c'; // Poor (orange)
    return '#ef4444'; // Very poor (red)
  };

  // Determine score category
  const getScoreCategory = (score: number): string => {
    if (score >= 50) return 'Excellent';
    if (score >= 30) return 'Good';
    if (score >= 0) return 'Fair';
    if (score >= -30) return 'Poor';
    return 'Needs Improvement';
  };

  const scoreColor = getScoreColor(npsScore);
  const scoreCategory = getScoreCategory(npsScore);

  // Data for radial bar chart
  const gaugeData = [
    {
      name: 'NPS',
      value: normalizedScore,
      fill: scoreColor,
    },
  ];

  // Calculate percentages
  const promoterPercentage =
    totalResponses > 0 ? Math.round((promoters / totalResponses) * 100) : 0;
  const passivePercentage =
    totalResponses > 0 ? Math.round((passives / totalResponses) * 100) : 0;
  const detractorPercentage =
    totalResponses > 0 ? Math.round((detractors / totalResponses) * 100) : 0;

  // Trend indicator
  const renderTrend = () => {
    if (trend === undefined || trend === 0) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Minus className="h-4 w-4" />
          <span className="text-sm">No change</span>
        </div>
      );
    }

    const isPositive = trend > 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}
          {trend.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Gauge Chart */}
          <div className="relative w-full" style={{ height: height * 0.6 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="70%"
                innerRadius="60%"
                outerRadius="100%"
                barSize={20}
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  fill={scoreColor}
                  label={{
                    position: 'center',
                    content: () => (
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-current"
                      >
                        <tspan
                          x="50%"
                          dy="-0.5em"
                          fontSize="48"
                          fontWeight="bold"
                          fill={scoreColor}
                        >
                          {npsScore}
                        </tspan>
                        <tspan x="50%" dy="1.5em" fontSize="16" fill="#6b7280">
                          {scoreCategory}
                        </tspan>
                      </text>
                    ),
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend */}
          {trend !== undefined && <div className="mt-4">{renderTrend()}</div>}

          {/* Breakdown */}
          <div className="w-full mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Promoters (9-10)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{promoters}</span>
                <span className="text-xs text-gray-500">({promoterPercentage}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-600">Passives (7-8)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{passives}</span>
                <span className="text-xs text-gray-500">({passivePercentage}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Detractors (0-6)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{detractors}</span>
                <span className="text-xs text-gray-500">({detractorPercentage}%)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Responses</span>
                <span className="text-sm font-bold text-gray-900">{totalResponses}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
