/**
 * Analytics Dashboard Page
 *
 * Main analytics dashboard for PM/PO/RESEARCHER/ADMIN roles
 * Displays comprehensive metrics across feedback, research, and product domains
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedbackAnalyticsComponent } from '@/components/analytics/feedback-analytics';
import { ResearchAnalyticsComponent } from '@/components/analytics/research-analytics';
import { ProductAnalyticsComponent } from '@/components/analytics/product-analytics';
import { BarChart3, AlertCircle } from 'lucide-react';
import type {
  FeedbackAnalytics,
  ResearchAnalytics,
  ProductAnalytics,
  TimeRange,
} from '@/types/analytics';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('feedback');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [feedbackData, setFeedbackData] = useState<FeedbackAnalytics | null>(null);
  const [researchData, setResearchData] = useState<ResearchAnalytics | null>(null);
  const [productData, setProductData] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch feedback analytics
  const fetchFeedbackAnalytics = async () => {
    try {
      const response = await fetch(`/api/metrics/feedback?timeRange=${timeRange}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view feedback analytics');
        }
        throw new Error('Failed to fetch feedback analytics');
      }
      const data = await response.json();
      setFeedbackData(data);
    } catch (err) {
      console.error('Error fetching feedback analytics:', err);
      throw err;
    }
  };

  // Fetch research analytics
  const fetchResearchAnalytics = async () => {
    try {
      const response = await fetch(`/api/metrics/research?timeRange=${timeRange}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view research analytics');
        }
        throw new Error('Failed to fetch research analytics');
      }
      const data = await response.json();
      setResearchData(data);
    } catch (err) {
      console.error('Error fetching research analytics:', err);
      throw err;
    }
  };

  // Fetch product analytics
  const fetchProductAnalytics = async () => {
    try {
      const response = await fetch(`/api/metrics/product?timeRange=${timeRange}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view product analytics');
        }
        throw new Error('Failed to fetch product analytics');
      }
      const data = await response.json();
      setProductData(data);
    } catch (err) {
      console.error('Error fetching product analytics:', err);
      throw err;
    }
  };

  // Fetch all analytics data
  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchFeedbackAnalytics(),
        fetchResearchAnalytics(),
        fetchProductAnalytics(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when time range changes
  useEffect(() => {
    fetchAllAnalytics();
  }, [timeRange]);

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Comprehensive insights into feedback, research, and product metrics
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Time Range Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Time Range:</label>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="product">Product</TabsTrigger>
        </TabsList>

        {/* Feedback Analytics Tab */}
        <TabsContent value="feedback" className="space-y-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : feedbackData ? (
            <FeedbackAnalyticsComponent data={feedbackData} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No feedback analytics data available</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Research Analytics Tab */}
        <TabsContent value="research" className="space-y-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : researchData ? (
            <ResearchAnalyticsComponent data={researchData} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No research analytics data available</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Product Analytics Tab */}
        <TabsContent value="product" className="space-y-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : productData ? (
            <ProductAnalyticsComponent data={productData} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No product analytics data available</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
