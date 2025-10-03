# TargetingConfig Component

## Overview

The `TargetingConfig` component provides a comprehensive interface for configuring questionnaire targeting and delivery settings. It supports panel-based targeting, ad-hoc filters, delivery mode selection, scheduling, and response limits.

## Features

- **Panel Multi-Select**: Select multiple research panels to target
- **Ad-Hoc Filters**:
  - Village selector (multi-select)
  - Role selector (multi-select)
  - Feature interactions filter (multi-select)
- **Delivery Mode Checkboxes**: In-app and/or email delivery
- **Date Pickers**: Optional start and end dates with calendar UI
- **Max Responses**: Optional limit on total responses
- **Validation**:
  - At least one targeting method required (panels or ad-hoc filters)
  - At least one delivery mode required
  - Date validation (start must be before end)
- **Audience Preview**: Optional callback to preview estimated audience size

## Usage

### Basic Usage

```tsx
import { TargetingConfig } from '@/components/research/TargetingConfig';

function QuestionnaireForm() {
  const handleSubmit = (values) => {
    console.log('Targeting config:', values);
    // Save to API
  };

  return (
    <TargetingConfig
      panels={panels}
      villages={villages}
      features={features}
      onSubmit={handleSubmit}
    />
  );
}
```

### With All Features

```tsx
import { TargetingConfig } from '@/components/research/TargetingConfig';

function QuestionnaireForm() {
  const [audienceCount, setAudienceCount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      await fetch('/api/questionnaires', {
        method: 'POST',
        body: JSON.stringify({ targeting: values }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (values) => {
    // Real-time updates
    console.log('Current values:', values);
  };

  const handlePreviewAudience = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/questionnaires/preview-audience', {
        method: 'POST',
        body: JSON.stringify(form.getValues()),
      });
      const data = await response.json();
      setAudienceCount(data.count);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TargetingConfig
      panels={panels}
      villages={villages}
      features={features}
      initialValues={existingConfig}
      onSubmit={handleSubmit}
      onChange={handleChange}
      onPreviewAudience={handlePreviewAudience}
      isLoading={isLoading}
      audienceCount={audienceCount}
      showSubmitButton={true}
      submitButtonText="Save Configuration"
    />
  );
}
```

### As Part of Larger Form

```tsx
import { TargetingConfig } from '@/components/research/TargetingConfig';

function QuestionnaireWizard() {
  const [targetingValues, setTargetingValues] = useState({});

  return (
    <div>
      {/* Step 1: Basic Info */}
      <QuestionnaireBasicInfo />

      {/* Step 2: Questions */}
      <QuestionBuilder />

      {/* Step 3: Targeting */}
      <TargetingConfig
        panels={panels}
        villages={villages}
        features={features}
        onChange={setTargetingValues}
        showSubmitButton={false}
      />

      {/* Final Submit */}
      <Button onClick={() => submitAll(targetingValues)}>
        Create Questionnaire
      </Button>
    </div>
  );
}
```

## Props

### TargetingConfigProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `panels` | `Array<{id: string, name: string}>` | No | `[]` | Available research panels |
| `villages` | `Array<{id: string, name: string}>` | No | `[]` | Available villages |
| `features` | `Array<{id: string, name: string}>` | No | `[]` | Available features |
| `initialValues` | `Partial<TargetingConfigValues>` | No | - | Initial form values |
| `onSubmit` | `(values: TargetingConfigValues) => void` | No | - | Submit handler |
| `onChange` | `(values: Partial<TargetingConfigValues>) => void` | No | - | Real-time change handler |
| `onPreviewAudience` | `() => void` | No | - | Audience preview handler |
| `isLoading` | `boolean` | No | `false` | Loading state |
| `audienceCount` | `number \| null` | No | `null` | Estimated audience count |
| `showSubmitButton` | `boolean` | No | `true` | Show submit button |
| `submitButtonText` | `string` | No | `'Save Targeting'` | Submit button text |

### TargetingConfigValues

```typescript
interface TargetingConfigValues {
  // Panel targeting
  panelIds?: string[];

  // Ad-hoc filters
  villageIds?: string[];
  roles?: string[];
  featureInteractions?: string[];

  // Delivery configuration
  deliveryModes: Array<'in-app' | 'email'>;

  // Schedule
  startAt?: Date | null;
  endAt?: Date | null;

  // Response limits
  maxResponses?: number | null;
}
```

## Validation Rules

1. **At least one targeting method**: Either panels OR ad-hoc filters (villages, roles, or features) must be selected
2. **At least one delivery mode**: Either 'in-app' or 'email' (or both) must be selected
3. **Date validation**: If both start and end dates are provided, start must be before end
4. **Max responses**: If provided, must be a positive integer

## Styling

The component uses Shadcn UI components and Tailwind CSS. It's fully responsive and follows the design system conventions:

- Cards for logical grouping
- Consistent spacing and typography
- Accessible form controls with proper labels
- Error states and validation messages
- Loading states for async operations

## Accessibility

- All form controls have proper labels
- Keyboard navigation is fully supported
- ARIA attributes are correctly set
- Error messages are announced to screen readers
- Focus management in dropdowns and date pickers

## Integration Notes

### API Integration

The component doesn't make API calls directly. Instead, implement the callbacks:

```typescript
// Save targeting configuration
const handleSubmit = async (values: TargetingConfigValues) => {
  const response = await fetch('/api/questionnaires/123/targeting', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  return response.json();
};

// Preview audience size
const handlePreviewAudience = async () => {
  const formValues = form.getValues();
  const response = await fetch('/api/questionnaires/preview-audience', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formValues),
  });
  const data = await response.json();
  setAudienceCount(data.estimatedCount);
};
```

### Data Fetching

Fetch available options using your preferred data fetching method:

```typescript
// Using fetch
const [panels, setPanels] = useState([]);

useEffect(() => {
  fetch('/api/panels')
    .then(res => res.json())
    .then(data => setPanels(data.panels));
}, []);

// Using React Query
const { data: panels } = useQuery(['panels'], fetchPanels);

// Using SWR
const { data: panels } = useSWR('/api/panels', fetcher);
```

### Date Serialization

When sending to API, serialize dates to ISO strings:

```typescript
const handleSubmit = async (values: TargetingConfigValues) => {
  const payload = {
    ...values,
    startAt: values.startAt?.toISOString(),
    endAt: values.endAt?.toISOString(),
  };

  await fetch('/api/questionnaires', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
```

## Related Components

- `MultiSelect` - Multi-selection dropdown component
- `Calendar` - Date picker component
- `Form` - Form wrapper from react-hook-form

## Examples

See `TargetingConfigExample.tsx` for a complete working example with mock data.

## Dependencies

- `react-hook-form` - Form state management
- `zod` - Schema validation
- `date-fns` - Date formatting
- `lucide-react` - Icons
- `@radix-ui/*` - UI primitives (via Shadcn UI)

## Testing

Example test scenarios:

```typescript
// Test validation
test('requires at least one targeting method', () => {
  render(<TargetingConfig />);
  submitForm();
  expect(screen.getByText(/at least one targeting method/i)).toBeInTheDocument();
});

// Test date validation
test('validates start date before end date', () => {
  render(<TargetingConfig />);
  selectStartDate(new Date('2025-12-31'));
  selectEndDate(new Date('2025-01-01'));
  expect(screen.getByText(/start date must be before end date/i)).toBeInTheDocument();
});

// Test multi-select
test('allows selecting multiple panels', () => {
  render(<TargetingConfig panels={mockPanels} />);
  selectPanel('Panel 1');
  selectPanel('Panel 2');
  expect(screen.getByText('Panel 1')).toBeInTheDocument();
  expect(screen.getByText('Panel 2')).toBeInTheDocument();
});
```

## Troubleshooting

### Form not validating

Make sure you're using the `onSubmit` prop correctly:

```tsx
<TargetingConfig
  onSubmit={handleSubmit} // ✅ Correct
  onSubmit={handleSubmit()} // ❌ Wrong - don't call it immediately
/>
```

### Dates not working

Ensure you're passing Date objects, not strings:

```tsx
initialValues={{
  startAt: new Date('2025-01-01'), // ✅ Correct
  startAt: '2025-01-01', // ❌ Wrong - needs to be Date object
}}
```

### Multi-select not showing options

Make sure you're passing the correct data structure:

```tsx
panels={[
  { id: 'pan_123', name: 'Panel Name' } // ✅ Correct
]}

panels={[
  { value: 'pan_123', label: 'Panel Name' } // ❌ Wrong - use id/name
]}
```
