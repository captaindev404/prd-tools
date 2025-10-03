# ExportDialog Component

## Overview

The `ExportDialog` component provides a user-friendly interface for exporting questionnaire responses with configurable options for format, data privacy, and segmentation.

## Features

- ✅ Dialog component using Shadcn Dialog
- ✅ Format selection: CSV or JSON
- ✅ PII checkbox (conditional on user role)
- ✅ Segment selector: All, By Village, By Role, By Panel
- ✅ Export button triggers download from API
- ✅ Loading state with spinner during export
- ✅ Success toast notification
- ✅ Error handling with toast notifications
- ✅ Fully accessible keyboard navigation
- ✅ Type-safe with TypeScript

## Props

```typescript
interface ExportDialogProps {
  questionnaireId: string;  // ULID of questionnaire
  userRole: Role;           // User's role (determines PII access)
  trigger?: React.ReactNode; // Optional custom trigger button
}
```

## Usage

### Basic Usage

```tsx
import { ExportDialog } from '@/components/questionnaires/ExportDialog';

function QuestionnaireAnalytics() {
  const questionnaireId = 'qnn_01HXYZ123456789ABCDEFGHIJK';
  const userRole = session.user.role; // From session

  return (
    <ExportDialog
      questionnaireId={questionnaireId}
      userRole={userRole}
    />
  );
}
```

### Custom Trigger

```tsx
<ExportDialog
  questionnaireId={questionnaireId}
  userRole={userRole}
  trigger={
    <Button variant="default">
      <Download className="mr-2 h-4 w-4" />
      Download All Responses
    </Button>
  }
/>
```

## Export Options

### 1. Format Selection

- **CSV**: Spreadsheet-compatible format, ideal for Excel/Google Sheets
- **JSON**: Raw data format, ideal for programmatic processing

### 2. PII Options (RESEARCHER/PM/ADMIN only)

When `includePII` is enabled, exports include:
- User ID
- Employee ID
- Email address
- Display name

Without PII, exports include only:
- Response ID
- Role (anonymized)
- Village (anonymized)
- Answers

### 3. Segment Selection

- **All Responses**: Export everything
- **By Village**: Group responses by village affiliation
- **By Role**: Group responses by user role
- **By Panel Membership**: Export only panel member responses

## Role-Based Access

### RESEARCHER, PM, ADMIN
- ✅ Can export with PII
- ✅ Can select all segments
- ✅ Full export capabilities

### USER, MODERATOR, PO
- ❌ Cannot include PII
- ✅ Can export anonymized data
- ✅ Can select all segments

## API Integration

The component calls the export API endpoint:

```
GET /api/questionnaires/:id/export?format={csv|json}&segment={all|village|role|panel}&includePII={true|false}
```

Expected response:
- Content-Type: `text/csv` or `application/json`
- Content-Disposition: `attachment; filename="export.csv"`

## Error Handling

Errors are displayed via toast notifications:

```typescript
toast({
  title: 'Export failed',
  description: error.message,
  variant: 'destructive',
});
```

## Accessibility

- ✅ Fully keyboard navigable
- ✅ ARIA labels on all interactive elements
- ✅ Focus management in dialog
- ✅ Screen reader friendly descriptions

## States

### Default State
- Format: CSV (pre-selected)
- PII: Unchecked
- Segment: All Responses
- Export button: Enabled

### Loading State
- Export button: Disabled with spinner
- Cancel button: Disabled
- Dialog: Cannot close

### Success State
- File downloads automatically
- Success toast displays
- Dialog closes
- State resets

### Error State
- Error toast displays
- Dialog remains open
- User can retry
- State preserved

## Implementation Notes

### CSV Export
Uses the `csv-export.ts` utility:
```typescript
import { exportResponsesToCSV } from '@/lib/csv-export';
```

### JSON Export
Returns raw response data with optional PII filtering.

### File Naming Convention
```
questionnaire-{id}-export-{timestamp}.{format}
```

Example: `questionnaire-qnn_01HXYZ-export-1709123456789.csv`

## Testing Checklist

- [ ] Dialog opens/closes correctly
- [ ] Format selection works (CSV/JSON)
- [ ] PII checkbox visible only for RESEARCHER/PM/ADMIN
- [ ] Segment selector displays all options
- [ ] Export triggers API call with correct params
- [ ] Loading spinner shows during export
- [ ] File downloads automatically
- [ ] Success toast displays
- [ ] Error toast displays on failure
- [ ] Dialog closes on success
- [ ] Keyboard navigation works
- [ ] Custom trigger button works

## Example Scenarios

### Scenario 1: Research Export with PII
```tsx
// Researcher exports all responses with PII for analysis
<ExportDialog
  questionnaireId="qnn_01HX..."
  userRole="RESEARCHER"
/>
// User selects: CSV + PII checked + All Responses
```

### Scenario 2: PM Exports by Village
```tsx
// PM exports responses grouped by village (no PII)
<ExportDialog
  questionnaireId="qnn_01HX..."
  userRole="PM"
/>
// User selects: CSV + By Village
```

### Scenario 3: User Exports JSON Data
```tsx
// Regular user exports anonymized JSON data
<ExportDialog
  questionnaireId="qnn_01HX..."
  userRole="USER"
/>
// User selects: JSON + All Responses (PII option not visible)
```

## Dependencies

```json
{
  "shadcn/ui": [
    "dialog",
    "button",
    "label",
    "radio-group",
    "checkbox",
    "select"
  ],
  "lucide-react": ["Download", "Loader2"],
  "@/hooks/use-toast": "toast notification",
  "@prisma/client": "Role type"
}
```

## Related Components

- `AnalyticsDashboard` - Uses ExportDialog for data export
- `QuestionnaireList` - Shows export option per questionnaire
- `ResponsesTable` - Integrates export functionality

## Future Enhancements

- [ ] Email export (send link via email)
- [ ] Scheduled exports (recurring)
- [ ] Custom column selection
- [ ] Date range filtering
- [ ] Multi-questionnaire export
- [ ] Export templates/presets
