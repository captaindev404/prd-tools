'use client';

import * as React from 'react';
import { QuotaProgressVisualization } from './QuotaProgressVisualization';
import type { QuotaWithProgress } from '@/types/panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';

/**
 * Example usage of QuotaProgressVisualization component
 */
export function QuotaProgressVisualizationExample() {
  const [mode, setMode] = React.useState<'bars' | 'pie'>('bars');

  // Sample quota data with various compliance statuses
  const sampleQuotas: QuotaWithProgress[] = [
    {
      id: 'quota_1',
      key: 'department',
      targetPercentage: 40,
      currentCount: 38,
      currentPercentage: 38.0,
      targetCount: 40,
    },
    {
      id: 'quota_2',
      key: 'role',
      targetPercentage: 30,
      currentCount: 25,
      currentPercentage: 25.0,
      targetCount: 30,
    },
    {
      id: 'quota_3',
      key: 'village_id',
      targetPercentage: 20,
      currentCount: 22,
      currentPercentage: 22.0,
      targetCount: 20,
    },
    {
      id: 'quota_4',
      key: 'seniority',
      targetPercentage: 10,
      currentCount: 15,
      currentPercentage: 15.0,
      targetCount: 10,
    },
  ];

  // Different compliance scenarios
  const goodComplianceQuotas: QuotaWithProgress[] = [
    {
      id: 'quota_1',
      key: 'department',
      targetPercentage: 50,
      currentCount: 51,
      currentPercentage: 51.0,
      targetCount: 50,
    },
    {
      id: 'quota_2',
      key: 'role',
      targetPercentage: 50,
      currentCount: 49,
      currentPercentage: 49.0,
      targetCount: 50,
    },
  ];

  const mixedComplianceQuotas: QuotaWithProgress[] = [
    {
      id: 'quota_1',
      key: 'department',
      targetPercentage: 40,
      currentCount: 42,
      currentPercentage: 42.0,
      targetCount: 40,
    },
    {
      id: 'quota_2',
      key: 'role',
      targetPercentage: 30,
      currentCount: 22,
      currentPercentage: 22.0,
      targetCount: 30,
    },
    {
      id: 'quota_3',
      key: 'village_id',
      targetPercentage: 20,
      currentCount: 35,
      currentPercentage: 35.0,
      targetCount: 20,
    },
    {
      id: 'quota_4',
      key: 'seniority',
      targetPercentage: 10,
      currentCount: 1,
      currentPercentage: 1.0,
      targetCount: 10,
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Quota Progress Visualization Examples</h1>
        <p className="text-muted-foreground">
          Visual representations of quota progress with color-coded compliance indicators
        </p>
      </div>

      {/* Visualization Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Visualization Mode</CardTitle>
          <CardDescription>
            Switch between progress bars and pie chart visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={mode === 'bars' ? 'default' : 'outline'}
              onClick={() => setMode('bars')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Progress Bars
            </Button>
            <Button
              variant={mode === 'pie' ? 'default' : 'outline'}
              onClick={() => setMode('pie')}
              className="gap-2"
            >
              <PieChart className="h-4 w-4" />
              Pie Chart
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Example 1: Mixed Compliance */}
      <QuotaProgressVisualization
        quotas={sampleQuotas}
        totalMembers={100}
        mode={mode}
        title="Panel Quota Progress"
        description="Current distribution across demographic segments"
      />

      {/* Example 2: Good Compliance */}
      <QuotaProgressVisualization
        quotas={goodComplianceQuotas}
        totalMembers={100}
        mode={mode}
        title="Well-Balanced Panel"
        description="All quotas are within target range (green status)"
      />

      {/* Example 3: Critical Compliance Issues */}
      <QuotaProgressVisualization
        quotas={mixedComplianceQuotas}
        totalMembers={100}
        mode={mode}
        title="Panel Requiring Attention"
        description="Multiple quotas are off target and need adjustment"
      />

      {/* Example 4: Compact View */}
      <Card>
        <CardHeader>
          <CardTitle>Compact View Example</CardTitle>
          <CardDescription>
            Without card wrapper for inline usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuotaProgressVisualization
            quotas={sampleQuotas}
            totalMembers={100}
            mode={mode}
            compact
          />
        </CardContent>
      </Card>

      {/* Example 5: Empty State */}
      <QuotaProgressVisualization
        quotas={[]}
        totalMembers={100}
        mode={mode}
        title="No Quotas Configured"
        description="This panel has no quotas set up yet"
      />

      {/* Color Coding Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Color Coding Legend</CardTitle>
          <CardDescription>
            Understanding the compliance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
              <div className="h-8 w-8 rounded bg-green-600" />
              <div>
                <p className="font-medium text-green-900">Green - On Target</p>
                <p className="text-sm text-green-700">
                  Current percentage is within ±5% of target
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50">
              <div className="h-8 w-8 rounded bg-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Yellow - Close to Target</p>
                <p className="text-sm text-yellow-700">
                  Current percentage is within ±5-15% of target
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
              <div className="h-8 w-8 rounded bg-red-600" />
              <div>
                <p className="font-medium text-red-900">Red - Off Target</p>
                <p className="text-sm text-red-700">
                  Current percentage is more than ±15% from target
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Notes</CardTitle>
          <CardDescription>
            How to use this component in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Props:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">quotas</code>: Array of
                  QuotaWithProgress objects
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">totalMembers</code>:
                  Optional total member count for calculating target counts
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">mode</code>: 'bars' or
                  'pie' for visualization style
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">compact</code>: Boolean to
                  remove card wrapper
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">keyLabels</code>: Custom
                  labels for quota keys
                </li>
              </ul>
            </div>

            <div>
              <p className="font-medium mb-1">Features:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Color-coded progress bars (green, yellow, red)</li>
                <li>Tooltips with detailed information on hover</li>
                <li>Trend indicators (up/down arrows) showing deviation</li>
                <li>Overall compliance summary</li>
                <li>Alternative pie chart visualization</li>
                <li>Responsive design for mobile and desktop</li>
              </ul>
            </div>

            <div>
              <p className="font-medium mb-1">Integration Example:</p>
              <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
                {`import { QuotaProgressVisualization } from '@/components/research/QuotaProgressVisualization';

// In your panel detail page
<QuotaProgressVisualization
  quotas={panel.quotaProgress}
  totalMembers={panel.memberCount}
  mode="bars"
  title="Panel Quota Progress"
/>
`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
