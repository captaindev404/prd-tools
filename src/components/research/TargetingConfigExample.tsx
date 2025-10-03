'use client';

import * as React from 'react';
import { TargetingConfig, type TargetingConfigValues } from './TargetingConfig';
import { useToast } from '@/components/ui/use-toast';

/**
 * Example usage of the TargetingConfig component
 *
 * This demonstrates how to integrate the TargetingConfig component
 * into a questionnaire creation or editing form.
 */
export function TargetingConfigExample() {
  const { toast } = useToast();
  const [audienceCount, setAudienceCount] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Mock data - in a real app, fetch this from your API
  const mockPanels = [
    { id: 'pan_01HQZXKJ9WMTGB2VQH5RRXA1B2', name: 'Front Office Staff Panel' },
    { id: 'pan_01HQZXKJ9WMTGB2VQH5RRXA1B3', name: 'Power Users Panel' },
    { id: 'pan_01HQZXKJ9WMTGB2VQH5RRXA1B4', name: 'New Employees Panel' },
  ];

  const mockVillages = [
    { id: 'vlg-001', name: 'Club Med Cancún' },
    { id: 'vlg-002', name: 'Club Med Punta Cana' },
    { id: 'vlg-003', name: 'Club Med Martinique' },
  ];

  const mockFeatures = [
    { id: 'feat_01HQZXKJ9WMTGB2VQH5RRXA1C1', name: 'Reservations' },
    { id: 'feat_01HQZXKJ9WMTGB2VQH5RRXA1C2', name: 'Check-in' },
    { id: 'feat_01HQZXKJ9WMTGB2VQH5RRXA1C3', name: 'Payments' },
  ];

  const handleSubmit = async (values: TargetingConfigValues) => {
    setIsLoading(true);
    try {
      // In a real app, save to your API
      console.log('Targeting configuration:', values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        description: 'Targeting configuration saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save targeting configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (values: Partial<TargetingConfigValues>) => {
    // Optional: handle real-time changes
    console.log('Targeting configuration changed:', values);
  };

  const handlePreviewAudience = async () => {
    setIsLoading(true);
    try {
      // In a real app, call your API to calculate audience size
      // Example: const response = await fetch('/api/questionnaires/preview-audience', { method: 'POST', body: JSON.stringify(form.getValues()) });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock result
      const mockCount = Math.floor(Math.random() * 500) + 50;
      setAudienceCount(mockCount);

      toast({
        title: 'Audience Preview',
        description: `Estimated ${mockCount} users will receive this questionnaire`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to preview audience',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Questionnaire Targeting</h1>
        <p className="text-muted-foreground">
          Configure who will receive this questionnaire and how it will be delivered.
        </p>
      </div>

      <TargetingConfig
        panels={mockPanels}
        villages={mockVillages}
        features={mockFeatures}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onPreviewAudience={handlePreviewAudience}
        isLoading={isLoading}
        audienceCount={audienceCount}
        showSubmitButton={true}
        submitButtonText="Save Targeting Configuration"
      />
    </div>
  );
}
