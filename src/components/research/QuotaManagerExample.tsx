'use client';

import * as React from 'react';
import { QuotaManager } from './QuotaManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import type { Quota, QuotaWithProgress } from '@/types/panel';

/**
 * Example component demonstrating QuotaManager usage
 */
export function QuotaManagerExample() {
  const [quotas, setQuotas] = React.useState<Quota[]>([]);

  // Sample quotas with progress for demonstration
  const sampleQuotasWithProgress: QuotaWithProgress[] = [
    {
      id: 'quota_1',
      key: 'department',
      targetPercentage: 40,
      currentCount: 38,
      currentPercentage: 38,
      targetCount: 40,
    },
    {
      id: 'quota_2',
      key: 'role',
      targetPercentage: 30,
      currentCount: 35,
      currentPercentage: 35,
      targetCount: 30,
    },
    {
      id: 'quota_3',
      key: 'village_id',
      targetPercentage: 30,
      currentCount: 27,
      currentPercentage: 27,
      targetCount: 30,
    },
  ];

  const handleQuotasChange = (newQuotas: Quota[]) => {
    setQuotas(newQuotas);
    console.log('Quotas updated:', newQuotas);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Quota Manager Examples</h1>
        <p className="text-muted-foreground">
          Demonstration of the QuotaManager component for research panels
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>About Quota Management</AlertTitle>
        <AlertDescription>
          Quotas ensure representative sampling across demographics. The system validates that
          percentages sum to approximately 100% and provides visual feedback on compliance.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="interactive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
          <TabsTrigger value="progress">With Progress</TabsTrigger>
          <TabsTrigger value="readonly">Read-Only</TabsTrigger>
        </TabsList>

        {/* Interactive Example */}
        <TabsContent value="interactive">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Quota Manager</CardTitle>
              <CardDescription>
                Add and remove quotas, see real-time validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuotaManager
                quotas={quotas}
                onChange={handleQuotasChange}
                totalMembers={100}
              />

              {quotas.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Configuration (JSON)</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(quotas, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* With Progress Example */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Quota Manager with Progress</CardTitle>
              <CardDescription>
                Shows current vs target percentages with visual indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuotaManager
                quotas={sampleQuotasWithProgress}
                quotasWithProgress={sampleQuotasWithProgress}
                totalMembers={100}
                readOnly
              />

              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Compliance Status Colors:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span className="text-green-600 font-medium">Green:</span>
                    <span className="text-muted-foreground">Within 5% of target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-600" />
                    <span className="text-yellow-600 font-medium">Yellow:</span>
                    <span className="text-muted-foreground">5-10% away from target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600" />
                    <span className="text-red-600 font-medium">Red:</span>
                    <span className="text-muted-foreground">More than 10% away from target</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Read-Only Example */}
        <TabsContent value="readonly">
          <Card>
            <CardHeader>
              <CardTitle>Read-Only Quota Manager</CardTitle>
              <CardDescription>
                View-only mode for displaying quota configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuotaManager
                quotas={[
                  {
                    id: 'quota_1',
                    key: 'department',
                    targetPercentage: 35,
                  },
                  {
                    id: 'quota_2',
                    key: 'role',
                    targetPercentage: 35,
                  },
                  {
                    id: 'quota_3',
                    key: 'village_id',
                    targetPercentage: 30,
                  },
                ]}
                readOnly
                totalMembers={150}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>Code examples for common scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Usage</h4>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
{`import { QuotaManager } from '@/components/research/QuotaManager';
import type { Quota } from '@/types/panel';

function MyComponent() {
  const [quotas, setQuotas] = useState<Quota[]>([]);

  return (
    <QuotaManager
      quotas={quotas}
      onChange={setQuotas}
      totalMembers={200}
    />
  );
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">With Progress Tracking</h4>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
{`import { QuotaManager } from '@/components/research/QuotaManager';
import type { QuotaWithProgress } from '@/types/panel';

function PanelDashboard({ panelId }: { panelId: string }) {
  const { data } = useQuery(['panel-quotas', panelId]);

  return (
    <QuotaManager
      quotas={data.quotas}
      quotasWithProgress={data.quotasWithProgress}
      totalMembers={data.memberCount}
      readOnly
    />
  );
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Custom Quota Keys</h4>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
{`import { QuotaManager } from '@/components/research/QuotaManager';

function CustomQuotaManager() {
  const customKeys = [
    { value: 'experience_level', label: 'Experience Level' },
    { value: 'shift_type', label: 'Shift Type' },
    { value: 'contract_type', label: 'Contract Type' },
  ];

  return (
    <QuotaManager
      quotas={quotas}
      onChange={setQuotas}
      customKeyOptions={customKeys}
    />
  );
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
