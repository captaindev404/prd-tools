/**
 * AI Settings Admin Page
 *
 * Allows administrators to:
 * - View AI usage statistics
 * - Monitor AI performance metrics
 * - Review categorization accuracy
 * - Adjust confidence thresholds
 */

import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  DollarSign,
  Clock,
  Target
} from 'lucide-react';

async function getAIStats() {
  const [
    totalOperations,
    successfulOps,
    failedOps,
    categorizationOps,
    sentimentOps,
    duplicateOps,
    recentLogs,
  ] = await Promise.all([
    prisma.aIUsageLog.count(),
    prisma.aIUsageLog.count({ where: { success: true } }),
    prisma.aIUsageLog.count({ where: { success: false } }),
    prisma.aIUsageLog.count({ where: { operation: 'categorization' } }),
    prisma.aIUsageLog.count({ where: { operation: 'sentiment' } }),
    prisma.aIUsageLog.count({ where: { operation: 'duplicate_detection' } }),
    prisma.aIUsageLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  // Calculate average latency for successful operations
  const avgLatency = await prisma.aIUsageLog.aggregate({
    where: { success: true, latencyMs: { not: null } },
    _avg: { latencyMs: true },
  });

  // Calculate average confidence for categorization
  const avgConfidence = await prisma.aIUsageLog.aggregate({
    where: { operation: 'categorization', confidence: { not: null } },
    _avg: { confidence: true },
  });

  // Get feedback with AI metadata
  const aiEnhancedFeedback = await prisma.feedbackAIMetadata.count();

  return {
    totalOperations,
    successfulOps,
    failedOps,
    categorizationOps,
    sentimentOps,
    duplicateOps,
    avgLatencyMs: avgLatency._avg.latencyMs || 0,
    avgConfidence: avgConfidence._avg.confidence || 0,
    aiEnhancedFeedback,
    recentLogs,
    successRate: totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0,
  };
}

export default async function AISettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  const stats = await getAIStats();
  const isAIEnabled = process.env.AI_ENABLED === 'true';
  const aiModel = process.env.AI_MODEL || 'gpt-4o-mini';

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Settings & Analytics</h1>
          <p className="text-muted-foreground">
            Monitor AI performance and configure categorization settings
          </p>
        </div>
        {isAIEnabled ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            AI Enabled
          </Badge>
        ) : (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            AI Disabled
          </Badge>
        )}
      </div>

      {/* Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>Current AI model and feature settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Model</p>
              <p className="text-lg font-semibold">{aiModel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categorization</p>
              <Badge variant={process.env.AI_CATEGORIZATION_ENABLED === 'true' ? 'default' : 'secondary'}>
                {process.env.AI_CATEGORIZATION_ENABLED === 'true' ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sentiment Analysis</p>
              <Badge variant={process.env.AI_SENTIMENT_ENABLED === 'true' ? 'default' : 'secondary'}>
                {process.env.AI_SENTIMENT_ENABLED === 'true' ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duplicate Detection</p>
              <Badge variant={process.env.AI_DUPLICATE_DETECTION_ENABLED === 'true' ? 'default' : 'secondary'}>
                {process.env.AI_DUPLICATE_DETECTION_ENABLED === 'true' ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOperations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All AI requests processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulOps} successful, {stats.failedOps} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgLatencyMs.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Categorization accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Operation Breakdown</CardTitle>
          <CardDescription>Distribution of AI operations by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">Categorization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.categorizationOps}</span>
                <span className="text-xs text-muted-foreground">
                  ({stats.totalOperations > 0 ? ((stats.categorizationOps / stats.totalOperations) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Sentiment Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.sentimentOps}</span>
                <span className="text-xs text-muted-foreground">
                  ({stats.totalOperations > 0 ? ((stats.sentimentOps / stats.totalOperations) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm">Duplicate Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.duplicateOps}</span>
                <span className="text-xs text-muted-foreground">
                  ({stats.totalOperations > 0 ? ((stats.duplicateOps / stats.totalOperations) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Operations</CardTitle>
          <CardDescription>Last 10 AI requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No AI operations recorded yet
              </p>
            ) : (
              stats.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {log.operation.replace('_', ' ')}
                      </Badge>
                      {log.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {log.user?.displayName || log.user?.email || 'System'}
                      </span>
                    </div>
                    {log.confidence && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Confidence: {(log.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                    {log.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                    {log.latencyMs && (
                      <p className="text-xs text-muted-foreground">{log.latencyMs}ms</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {!isAIEnabled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              AI Features Not Enabled
            </CardTitle>
            <CardDescription>Follow these steps to enable AI-powered features</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Get an OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">platform.openai.com</a></li>
              <li>Add <code className="bg-yellow-100 px-1 py-0.5 rounded">OPENAI_API_KEY=your-key</code> to your .env file</li>
              <li>Set <code className="bg-yellow-100 px-1 py-0.5 rounded">AI_ENABLED=true</code> in your .env file</li>
              <li>Optionally enable specific features:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><code className="bg-yellow-100 px-1 py-0.5 rounded">AI_CATEGORIZATION_ENABLED=true</code></li>
                  <li><code className="bg-yellow-100 px-1 py-0.5 rounded">AI_SENTIMENT_ENABLED=true</code></li>
                  <li><code className="bg-yellow-100 px-1 py-0.5 rounded">AI_DUPLICATE_DETECTION_ENABLED=true</code></li>
                </ul>
              </li>
              <li>Restart the application</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
