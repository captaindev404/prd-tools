'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConsentData {
  research_contact: {
    granted: boolean;
    lastUpdated: string | null;
  };
  usage_analytics: {
    granted: boolean;
    lastUpdated: string | null;
  };
  email_updates: {
    granted: boolean;
    lastUpdated: string | null;
  };
}

interface ConsentManagerProps {
  initialData?: ConsentData;
}

export function ConsentManager({ initialData }: ConsentManagerProps) {
  const [consents, setConsents] = useState<ConsentData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [updatingConsent, setUpdatingConsent] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialData) {
      fetchConsents();
    }
  }, [initialData]);

  const fetchConsents = async () => {
    try {
      const response = await fetch('/api/user/consent');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch consent preferences');
      }

      setConsents(result.data);
    } catch (error) {
      console.error('Error fetching consents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load consent preferences. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsent = async (consentType: string, granted: boolean) => {
    setUpdatingConsent(consentType);

    try {
      const response = await fetch('/api/user/consent', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [`consent_${consentType}`]: granted,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update consent');
      }

      // Update local state
      setConsents((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [consentType]: {
            granted,
            lastUpdated: result.data.lastUpdated || new Date().toISOString(),
          },
        };
      });

      toast({
        title: 'Consent updated',
        description: `Your ${consentType.replace('_', ' ')} preference has been updated.`,
      });
    } catch (error) {
      console.error('Error updating consent:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update consent. Please try again.',
        variant: 'destructive',
      });

      // Revert UI state on error
      fetchConsents();
    } finally {
      setUpdatingConsent(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!consents) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load consent preferences. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          We respect your privacy. You can change these settings at any time. Learn more about how
          we use your data in our Privacy Policy.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Research Contact</CardTitle>
          <CardDescription>
            Allow us to contact you for user research opportunities (panels, interviews, usability
            tests)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="consent-research" className="text-sm font-medium">
                I want to participate in user research
              </Label>
              <p className="text-xs text-gray-500">
                Last updated: {formatDate(consents.research_contact.lastUpdated)}
              </p>
            </div>
            <Switch
              id="consent-research"
              checked={consents.research_contact.granted}
              onCheckedChange={(checked) => updateConsent('research_contact', checked)}
              disabled={updatingConsent === 'research_contact'}
            />
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
            <p className="font-medium mb-2">What this means:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>We may invite you to join research panels</li>
              <li>You may receive invitations for interviews and usability tests</li>
              <li>Participation is always voluntary</li>
              <li>You can withdraw consent at any time by toggling this switch</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
          <CardDescription>
            Allow us to collect anonymous usage data to improve the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="consent-analytics" className="text-sm font-medium">
                Share anonymous usage data
              </Label>
              <p className="text-xs text-gray-500">
                Last updated: {formatDate(consents.usage_analytics.lastUpdated)}
              </p>
            </div>
            <Switch
              id="consent-analytics"
              checked={consents.usage_analytics.granted}
              onCheckedChange={(checked) => updateConsent('usage_analytics', checked)}
              disabled={updatingConsent === 'usage_analytics'}
            />
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
            <p className="font-medium mb-2">What this means:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>We collect data about how you use the platform (page views, clicks, etc.)</li>
              <li>Data is anonymized and aggregated</li>
              <li>Used to improve features and user experience</li>
              <li>No personally identifiable information is shared with third parties</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Updates</CardTitle>
          <CardDescription>
            Send me updates about roadmap changes and new features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="consent-email" className="text-sm font-medium">
                Receive email updates
              </Label>
              <p className="text-xs text-gray-500">
                Last updated: {formatDate(consents.email_updates.lastUpdated)}
              </p>
            </div>
            <Switch
              id="consent-email"
              checked={consents.email_updates.granted}
              onCheckedChange={(checked) => updateConsent('email_updates', checked)}
              disabled={updatingConsent === 'email_updates'}
            />
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
            <p className="font-medium mb-2">What this means:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Receive notifications about roadmap updates</li>
              <li>Get updates about new features and improvements</li>
              <li>Learn about feedback you submitted that has been implemented</li>
              <li>You can unsubscribe at any time by toggling this switch</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
