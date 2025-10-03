# TargetingConfig Integration Guide

## Quick Start

### 1. Import the Component

```tsx
import { TargetingConfig } from '@/components/research/TargetingConfig';
import type { TargetingConfigValues } from '@/components/research/TargetingConfig';
```

### 2. Fetch Required Data

```tsx
'use client';

import { useState, useEffect } from 'react';

function QuestionnaireTargeting() {
  const [panels, setPanels] = useState([]);
  const [villages, setVillages] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [panelsRes, villagesRes, featuresRes] = await Promise.all([
          fetch('/api/panels'),
          fetch('/api/villages'),
          fetch('/api/features'),
        ]);

        setPanels(await panelsRes.json());
        setVillages(await villagesRes.json());
        setFeatures(await featuresRes.json());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <TargetingConfig
      panels={panels}
      villages={villages}
      features={features}
      isLoading={loading}
    />
  );
}
```

### 3. Handle Form Submission

```tsx
const handleSubmit = async (values: TargetingConfigValues) => {
  try {
    const response = await fetch('/api/questionnaires/123/targeting', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targeting: {
          panelIds: values.panelIds,
          villageIds: values.villageIds,
          roles: values.roles,
          featureInteractions: values.featureInteractions,
        },
        delivery: {
          modes: values.deliveryModes,
          startAt: values.startAt?.toISOString(),
          endAt: values.endAt?.toISOString(),
          maxResponses: values.maxResponses,
        },
      }),
    });

    if (!response.ok) throw new Error('Failed to save');

    toast({
      title: 'Success',
      description: 'Targeting configuration saved',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }
};
```

## API Endpoints Required

### GET /api/panels

Returns available research panels:

```json
[
  {
    "id": "pan_01HQZXKJ9WMTGB2VQH5RRXA1B2",
    "name": "Front Office Staff Panel"
  }
]
```

### GET /api/villages

Returns available villages:

```json
[
  {
    "id": "vlg-001",
    "name": "Club Med Cancún"
  }
]
```

### GET /api/features

Returns available features:

```json
[
  {
    "id": "feat_01HQZXKJ9WMTGB2VQH5RRXA1C1",
    "name": "Reservations"
  }
]
```

### POST /api/questionnaires/preview-audience

Calculates estimated audience size:

**Request:**
```json
{
  "panelIds": ["pan_123"],
  "villageIds": ["vlg-001"],
  "roles": ["USER"],
  "featureInteractions": ["feat_456"]
}
```

**Response:**
```json
{
  "estimatedCount": 247,
  "breakdown": {
    "byPanel": {
      "pan_123": 150
    },
    "byVillage": {
      "vlg-001": 97
    },
    "byRole": {
      "USER": 247
    }
  }
}
```

### PATCH /api/questionnaires/:id/targeting

Saves targeting configuration:

**Request:**
```json
{
  "targeting": {
    "panelIds": ["pan_123"],
    "villageIds": ["vlg-001"],
    "roles": ["USER"],
    "featureInteractions": ["feat_456"]
  },
  "delivery": {
    "modes": ["in-app", "email"],
    "startAt": "2025-01-15T00:00:00.000Z",
    "endAt": "2025-02-15T23:59:59.999Z",
    "maxResponses": 500
  }
}
```

## Database Schema

### Questionnaire Table

Add targeting and delivery columns:

```sql
-- Add to existing questionnaire table
ALTER TABLE questionnaire ADD COLUMN targeting TEXT; -- JSON
ALTER TABLE questionnaire ADD COLUMN delivery_modes TEXT; -- JSON array
ALTER TABLE questionnaire ADD COLUMN start_at DATETIME;
ALTER TABLE questionnaire ADD COLUMN end_at DATETIME;
ALTER TABLE questionnaire ADD COLUMN max_responses INTEGER;
```

Example targeting JSON:

```json
{
  "panelIds": ["pan_123"],
  "villageIds": ["vlg-001"],
  "roles": ["USER"],
  "featureInteractions": ["feat_456"]
}
```

### Prisma Schema

```prisma
model Questionnaire {
  id              String   @id
  title           String
  targeting       Json?    // Targeting configuration
  deliveryModes   Json     // Array of 'in-app' | 'email'
  startAt         DateTime?
  endAt           DateTime?
  maxResponses    Int?
  // ... other fields
}
```

## Integration with Questionnaire Form

### Multi-Step Wizard

```tsx
import { useState } from 'react';
import { TargetingConfig } from '@/components/research/TargetingConfig';
import { QuestionBuilder } from '@/components/research/QuestionBuilder';

function QuestionnaireWizard() {
  const [step, setStep] = useState(1);
  const [questionnaireData, setQuestionnaireData] = useState({
    title: '',
    questions: [],
    targeting: null,
  });

  const handleTargetingSubmit = (values) => {
    setQuestionnaireData(prev => ({
      ...prev,
      targeting: values,
    }));
    // Move to next step or save
    if (step === 3) {
      saveQuestionnaire(questionnaireData);
    }
  };

  return (
    <div>
      {step === 1 && <BasicInfoStep />}
      {step === 2 && <QuestionBuilder />}
      {step === 3 && (
        <TargetingConfig
          onSubmit={handleTargetingSubmit}
          panels={panels}
          villages={villages}
          features={features}
        />
      )}
    </div>
  );
}
```

### Single Page Form

```tsx
import { useState } from 'react';
import { TargetingConfig } from '@/components/research/TargetingConfig';

function QuestionnaireForm() {
  const [formData, setFormData] = useState({
    title: '',
    questions: [],
    targeting: {},
  });

  const handleFinalSubmit = async () => {
    // Validate all data
    if (!formData.title || formData.questions.length === 0) {
      toast({ title: 'Error', description: 'Please complete all fields' });
      return;
    }

    // Submit complete questionnaire
    await fetch('/api/questionnaires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
  };

  return (
    <div className="space-y-8">
      <BasicInfoSection />
      <QuestionBuilderSection />

      <TargetingConfig
        onChange={(values) => setFormData(prev => ({
          ...prev,
          targeting: values,
        }))}
        showSubmitButton={false}
        panels={panels}
        villages={villages}
        features={features}
      />

      <Button onClick={handleFinalSubmit}>
        Create Questionnaire
      </Button>
    </div>
  );
}
```

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TargetingConfig } from './TargetingConfig';

describe('TargetingConfig', () => {
  const mockPanels = [
    { id: 'pan_1', name: 'Panel 1' },
    { id: 'pan_2', name: 'Panel 2' },
  ];

  it('renders all sections', () => {
    render(<TargetingConfig panels={mockPanels} />);

    expect(screen.getByText('Panel Targeting')).toBeInTheDocument();
    expect(screen.getByText('Ad-Hoc Filters')).toBeInTheDocument();
    expect(screen.getByText('Delivery Configuration')).toBeInTheDocument();
  });

  it('requires at least one targeting method', async () => {
    const onSubmit = jest.fn();
    render(<TargetingConfig onSubmit={onSubmit} />);

    const submitButton = screen.getByText('Save Targeting');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/at least one targeting method/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct values', async () => {
    const onSubmit = jest.fn();
    render(<TargetingConfig panels={mockPanels} onSubmit={onSubmit} />);

    // Select a panel
    const panelSelect = screen.getByRole('combobox');
    fireEvent.click(panelSelect);
    fireEvent.click(screen.getByText('Panel 1'));

    // Check delivery mode
    const inAppCheckbox = screen.getByLabelText('In-App');
    fireEvent.click(inAppCheckbox);

    // Submit
    const submitButton = screen.getByText('Save Targeting');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          panelIds: ['pan_1'],
          deliveryModes: ['in-app'],
        })
      );
    });
  });
});
```

### Integration Tests

```tsx
import { render, screen } from '@testing-library/react';
import { QuestionnaireForm } from './QuestionnaireForm';

describe('Questionnaire Form Integration', () => {
  it('completes full questionnaire creation', async () => {
    render(<QuestionnaireForm />);

    // Step 1: Basic Info
    await fillBasicInfo();

    // Step 2: Questions
    await addQuestions();

    // Step 3: Targeting
    await configureTargeting();

    // Submit
    await submitForm();

    // Verify API call
    expect(fetch).toHaveBeenCalledWith('/api/questionnaires', {
      method: 'POST',
      body: expect.stringContaining('targeting'),
    });
  });
});
```

## Troubleshooting

### Issue: Multi-select not working

**Problem:** Options don't appear or can't be selected

**Solution:** Ensure data format is correct:

```tsx
// ✅ Correct
panels={[{ id: 'pan_123', name: 'Panel Name' }]}

// ❌ Wrong
panels={[{ value: 'pan_123', label: 'Panel Name' }]}
```

### Issue: Dates not saving

**Problem:** Dates are null or incorrect in database

**Solution:** Convert to ISO strings before saving:

```tsx
const payload = {
  ...values,
  startAt: values.startAt?.toISOString(),
  endAt: values.endAt?.toISOString(),
};
```

### Issue: Validation not working

**Problem:** Form submits without required fields

**Solution:** Make sure you're using `onSubmit` prop:

```tsx
<TargetingConfig
  onSubmit={handleSubmit} // ✅ Correct
  onSubmit={handleSubmit()} // ❌ Wrong
/>
```

## Performance Optimization

### Lazy Loading

```tsx
import dynamic from 'next/dynamic';

const TargetingConfig = dynamic(
  () => import('@/components/research/TargetingConfig').then(mod => mod.TargetingConfig),
  { loading: () => <LoadingSkeleton /> }
);
```

### Memoization

```tsx
import { useMemo } from 'react';

function QuestionnaireForm() {
  const panelOptions = useMemo(
    () => panels.map(p => ({ id: p.id, name: p.name })),
    [panels]
  );

  return <TargetingConfig panels={panelOptions} />;
}
```

### Debounced Preview

```tsx
import { useDebouncedCallback } from 'use-debounce';

const handleChange = useDebouncedCallback((values) => {
  // Auto-preview audience on change
  previewAudience(values);
}, 1000);

<TargetingConfig onChange={handleChange} />
```

## Next Steps

1. Implement the required API endpoints
2. Add database migrations for targeting fields
3. Create audience calculation logic
4. Add analytics tracking for targeting configuration
5. Implement email delivery integration
6. Add tests for targeting validation logic

## Support

For questions or issues, refer to:
- Main README: `./README.md`
- Type definitions: `@/types/targeting.ts`
- Example usage: `./TargetingConfigExample.tsx`
