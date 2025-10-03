'use client';

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { QuestionAnalytics, LikertAnalytics, NPSAnalytics, MCQAnalytics, RatingAnalytics } from '@/types/questionnaire';

interface AnalyticsChartProps {
  analytics: QuestionAnalytics;
  options?: Array<{ id: string; text: string }>; // For MCQ questions
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AnalyticsChart({ analytics, options = [] }: AnalyticsChartProps) {
  switch (analytics.questionType) {
    case 'likert_5':
    case 'likert_7':
      return <LikertChart data={analytics.data as LikertAnalytics} />;

    case 'nps':
      return <NPSChart data={analytics.data as NPSAnalytics} />;

    case 'mcq_single':
    case 'mcq_multiple':
      return <MCQChart data={analytics.data as MCQAnalytics} options={options} />;

    case 'rating':
      return <RatingChart data={analytics.data as RatingAnalytics} />;

    case 'text':
      return <div className="text-sm text-muted-foreground">Text responses are shown in the list below</div>;

    default:
      return <div>Unknown question type</div>;
  }
}

function LikertChart({ data }: { data: LikertAnalytics }) {
  const chartData = Object.entries(data.distribution).map(([key, value]) => ({
    score: key,
    count: value,
  }));

  return (
    <div className="space-y-4">
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Mean:</span>{' '}
          <span className="font-semibold">{data.mean}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Median:</span>{' '}
          <span className="font-semibold">{data.median}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Mode:</span>{' '}
          <span className="font-semibold">{data.mode}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="score" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" name="Responses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function NPSChart({ data }: { data: NPSAnalytics }) {
  const chartData = [
    { name: 'Promoters (9-10)', value: data.promoters, percent: data.promotersPercent },
    { name: 'Passives (7-8)', value: data.passives, percent: data.passivesPercent },
    { name: 'Detractors (0-6)', value: data.detractors, percent: data.detractorsPercent },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-blue-600">{data.score}</div>
          <div className="text-sm text-muted-foreground">NPS Score</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${percent}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function MCQChart({ data, options }: { data: MCQAnalytics; options: Array<{ id: string; text: string }> }) {
  const chartData = Object.entries(data.distribution).map(([optionId, count]) => {
    const option = options.find((o) => o.id === optionId);
    return {
      name: option?.text || optionId,
      count,
      percentage: data.percentages[optionId] || 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#10b981" name="Responses" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RatingChart({ data }: { data: RatingAnalytics }) {
  const chartData = Object.entries(data.distribution).map(([key, value]) => ({
    rating: `${key} stars`,
    count: value,
  }));

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-yellow-500">{data.average}</div>
        <div className="text-sm text-muted-foreground">Average Rating</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rating" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#f59e0b" name="Responses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
