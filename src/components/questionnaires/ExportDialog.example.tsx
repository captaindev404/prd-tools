'use client';

import { ExportDialog } from './ExportDialog';
import { Button } from '@/components/ui/button';
import { Download, FileDown } from 'lucide-react';
import type { Role } from '@prisma/client';

/**
 * Example 1: Basic usage with default trigger
 */
export function BasicExportExample() {
  const questionnaireId = 'qnn_01HXYZ123456789ABCDEFGHIJK';
  const userRole: Role = 'RESEARCHER';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Export Dialog</h3>
      <ExportDialog questionnaireId={questionnaireId} userRole={userRole} />
    </div>
  );
}

/**
 * Example 2: Custom trigger button
 */
export function CustomTriggerExample() {
  const questionnaireId = 'qnn_01HXYZ123456789ABCDEFGHIJK';
  const userRole: Role = 'RESEARCHER';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Custom Trigger Button</h3>
      <ExportDialog
        questionnaireId={questionnaireId}
        userRole={userRole}
        trigger={
          <Button variant="default" size="lg">
            <FileDown className="mr-2 h-5 w-5" />
            Download Responses
          </Button>
        }
      />
    </div>
  );
}

/**
 * Example 3: Non-researcher user (PII option hidden)
 */
export function NonResearcherExample() {
  const questionnaireId = 'qnn_01HXYZ123456789ABCDEFGHIJK';
  const userRole: Role = 'PM'; // PM role doesn't show PII checkbox

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">PM User (PII Option Visible)</h3>
      <p className="text-sm text-muted-foreground">
        PM users can see and select PII option
      </p>
      <ExportDialog questionnaireId={questionnaireId} userRole={userRole} />
    </div>
  );
}

/**
 * Example 4: Regular user (no PII option)
 */
export function RegularUserExample() {
  const questionnaireId = 'qnn_01HXYZ123456789ABCDEFGHIJK';
  const userRole: Role = 'USER';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Regular User (No PII Option)</h3>
      <p className="text-sm text-muted-foreground">
        Regular users cannot include PII in exports
      </p>
      <ExportDialog questionnaireId={questionnaireId} userRole={userRole} />
    </div>
  );
}

/**
 * Example 5: In analytics dashboard
 */
export function AnalyticsDashboardExample() {
  const questionnaireId = 'qnn_01HXYZ123456789ABCDEFGHIJK';
  const userRole: Role = 'RESEARCHER';

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Questionnaire Responses</h3>
          <p className="text-sm text-muted-foreground">
            145 responses collected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            View Analytics
          </Button>
          <ExportDialog
            questionnaireId={questionnaireId}
            userRole={userRole}
            trigger={
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 6: Multiple export dialogs on same page
 */
export function MultipleQuestionnairesExample() {
  const userRole: Role = 'RESEARCHER';

  const questionnaires = [
    {
      id: 'qnn_01HXYZ123456789ABCDEFGHIJK',
      title: 'Product Satisfaction Survey Q1 2024',
      responses: 234,
    },
    {
      id: 'qnn_01HXYZ987654321ZYXWVUTSRQP',
      title: 'User Experience Feedback',
      responses: 156,
    },
    {
      id: 'qnn_01HXYZAABBCCDDEE112233445',
      title: 'Feature Request Analysis',
      responses: 89,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Questionnaire List</h3>
      <div className="space-y-2">
        {questionnaires.map((q) => (
          <div
            key={q.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h4 className="font-medium">{q.title}</h4>
              <p className="text-sm text-muted-foreground">
                {q.responses} responses
              </p>
            </div>
            <ExportDialog questionnaireId={q.id} userRole={userRole} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full demo component with all examples
 */
export function ExportDialogDemo() {
  return (
    <div className="container mx-auto py-10 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">ExportDialog Component Examples</h1>
        <p className="text-muted-foreground">
          Demonstrating various use cases for the questionnaire export dialog
        </p>
      </div>

      <BasicExportExample />
      <CustomTriggerExample />
      <NonResearcherExample />
      <RegularUserExample />
      <AnalyticsDashboardExample />
      <MultipleQuestionnairesExample />
    </div>
  );
}
