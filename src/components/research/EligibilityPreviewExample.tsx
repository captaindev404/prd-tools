'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EligibilityPreview } from './EligibilityPreview';
import { Eye } from 'lucide-react';

/**
 * Example component demonstrating usage of EligibilityPreview modal
 *
 * Usage:
 * 1. Import the EligibilityPreview component
 * 2. Manage the dialog open state with useState
 * 3. Pass the panelId and open/onOpenChange props
 * 4. Optionally pass quota for projection display
 */
export function EligibilityPreviewExample() {
  const [previewOpen, setPreviewOpen] = useState(false);

  // Example panel ID - replace with actual panel ID from your data
  const examplePanelId = 'pan_01ARZ3NDEKTSV4RRFFQ69G5FAV';

  // Example quota - optional, can be null
  const exampleQuota = 50;

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>EligibilityPreview Component Example</CardTitle>
          <CardDescription>
            Click the button below to preview eligible users for a research panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setPreviewOpen(true)} className="gap-2">
            <Eye className="h-4 w-4" />
            Preview Eligible Users
          </Button>

          {/* The EligibilityPreview modal */}
          <EligibilityPreview
            panelId={examplePanelId}
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            quota={exampleQuota}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Basic Usage</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`import { EligibilityPreview } from '@/components/research/EligibilityPreview';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Preview Eligibility
      </Button>

      <EligibilityPreview
        panelId="pan_01ARZ3NDEKTSV4RRFFQ69G5FAV"
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">With Quota Projection</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<EligibilityPreview
  panelId={panelId}
  open={open}
  onOpenChange={setOpen}
  quota={50} // Shows quota projections
/>`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">In Panel Management Form</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`function PanelForm({ panelId, quota }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panel Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form fields here */}

        <Button
          type="button"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
        >
          Preview Eligible Users
        </Button>

        <EligibilityPreview
          panelId={panelId}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          quota={quota}
        />
      </CardContent>
    </Card>
  );
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Fetches eligibility data from <code className="bg-muted px-1 py-0.5 rounded">GET /api/panels/[id]/eligibility-preview</code></li>
            <li>Displays total count of eligible users</li>
            <li>Shows sample list of first 10 users with name, email, role, and village</li>
            <li>Optional quota projections showing coverage percentage</li>
            <li>Loading state with skeleton loaders</li>
            <li>Error handling with clear error messages</li>
            <li>Responsive table layout</li>
            <li>Accessible dialog with keyboard navigation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
