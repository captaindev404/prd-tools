'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Users, TrendingUp, Target } from 'lucide-react';
import {
  PieChart,
  Pie,
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

interface AnalyticsDashboardProps {
  questionnaireId: string;
}

export function AnalyticsDashboard({ questionnaireId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<string>('none');

  useEffect(() => {
    fetchAnalytics();
  }, [questionnaireId, segment]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (segment !== 'none') {
        params.set('segment', segment);
      }

      const response = await fetch(
        `/api/questionnaires/${questionnaireId}/analytics?${params.toString()}`
      );
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const url = `/api/questionnaires/${questionnaireId}/export?format=${format}&includePII=false`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  const avgNPS =
    analytics.questions
      .filter((q: any) => q.nps)
      .reduce((sum: number, q: any) => sum + q.nps.score, 0) /
      analytics.questions.filter((q: any) => q.nps).length || 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">All Responses</SelectItem>
            <SelectItem value="village">By Village</SelectItem>
            <SelectItem value="role">By Role</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average NPS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgNPS)}</div>
            <p className="text-xs text-muted-foreground">
              {avgNPS >= 50 ? 'Excellent' : avgNPS >= 0 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.questions.length}</div>
            <p className="text-xs text-muted-foreground">In this questionnaire</p>
          </CardContent>
        </Card>
      </div>

      {/* Question Analytics */}
      {analytics.questions.map((question: any, index: number) => (
        <Card key={question.questionId}>
          <CardHeader>
            <CardTitle>
              Question {index + 1}: {question.questionText}
            </CardTitle>
            <CardDescription>
              {question.questionType.toUpperCase()} • {question.responseCount} responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* NPS Chart */}
            {question.nps && (
              <div>
                <div className="mb-4">
                  <p className="text-2xl font-bold">NPS Score: {question.nps.score}</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Promoters', value: question.nps.promoters, fill: '#22c55e' },
                        { name: 'Passives', value: question.nps.passives, fill: '#eab308' },
                        { name: 'Detractors', value: question.nps.detractors, fill: '#ef4444' },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    />
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Likert Distribution */}
            {question.likertDistribution && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(question.likertDistribution).map(([key, value]: any) => ({
                    scale: key,
                    count: value.count,
                    percentage: value.percentage,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scale" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* MCQ Distribution */}
            {question.mcqDistribution && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(question.mcqDistribution).map(([key, value]: any) => ({
                    option: key,
                    count: value.count,
                    percentage: value.percentage,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="option" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Numeric Stats */}
            {question.numericStats && (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mean</p>
                  <p className="text-2xl font-bold">{question.numericStats.mean}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Median</p>
                  <p className="text-2xl font-bold">{question.numericStats.median}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Min</p>
                  <p className="text-2xl font-bold">{question.numericStats.min}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max</p>
                  <p className="text-2xl font-bold">{question.numericStats.max}</p>
                </div>
              </div>
            )}

            {/* Text Responses */}
            {question.textResponses && (
              <div className="space-y-2">
                <p className="font-medium">{question.textResponses.length} text responses</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {question.textResponses.slice(0, 10).map((text: string, i: number) => (
                    <p key={i} className="text-sm p-2 bg-muted rounded">
                      "{text}"
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
