'use client';

/**
 * Notification preferences form for authenticated users
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Preferences {
  feedbackUpdates: string;
  roadmapUpdates: string;
  researchInvites: string;
  weeklyDigest: boolean;
}

export function NotificationPreferencesForm() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const response = await fetch('/api/email/preferences');

      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your preferences. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preferences) return;

    setSaving(true);

    try {
      const response = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load preferences. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Feedback Updates */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Feedback Updates</Label>
          <p className="text-sm text-gray-600 mt-1">
            Receive notifications when your feedback receives updates, comments, or status changes
          </p>
        </div>
        <RadioGroup
          value={preferences.feedbackUpdates}
          onValueChange={(value) => setPreferences({ ...preferences, feedbackUpdates: value })}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="real_time" id="feedback-realtime" />
            <Label htmlFor="feedback-realtime" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Real-time</div>
              <div className="text-sm text-gray-500">Get notified immediately when updates occur</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="daily" id="feedback-daily" />
            <Label htmlFor="feedback-daily" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Daily digest</div>
              <div className="text-sm text-gray-500">Receive one email per day with all updates</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="weekly" id="feedback-weekly" />
            <Label htmlFor="feedback-weekly" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Weekly digest</div>
              <div className="text-sm text-gray-500">Receive one email per week with all updates</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="never" id="feedback-never" />
            <Label htmlFor="feedback-never" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Never</div>
              <div className="text-sm text-gray-500">Don't send me feedback update emails</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Roadmap Updates */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Roadmap Updates</Label>
          <p className="text-sm text-gray-600 mt-1">
            Stay informed about new features, product releases, and roadmap changes
          </p>
        </div>
        <RadioGroup
          value={preferences.roadmapUpdates}
          onValueChange={(value) => setPreferences({ ...preferences, roadmapUpdates: value })}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="real_time" id="roadmap-realtime" />
            <Label htmlFor="roadmap-realtime" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Real-time</div>
              <div className="text-sm text-gray-500">Get notified immediately about roadmap updates</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="daily" id="roadmap-daily" />
            <Label htmlFor="roadmap-daily" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Daily digest</div>
              <div className="text-sm text-gray-500">Receive one email per day with all updates</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="weekly" id="roadmap-weekly" />
            <Label htmlFor="roadmap-weekly" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Weekly digest</div>
              <div className="text-sm text-gray-500">Receive one email per week with all updates</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="never" id="roadmap-never" />
            <Label htmlFor="roadmap-never" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Never</div>
              <div className="text-sm text-gray-500">Don't send me roadmap update emails</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Research Invites */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Research Invitations</Label>
          <p className="text-sm text-gray-600 mt-1">
            Receive invitations to participate in questionnaires and user testing sessions
          </p>
        </div>
        <RadioGroup
          value={preferences.researchInvites}
          onValueChange={(value) => setPreferences({ ...preferences, researchInvites: value })}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="real_time" id="research-realtime" />
            <Label htmlFor="research-realtime" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Real-time</div>
              <div className="text-sm text-gray-500">Get notified immediately about research opportunities</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="daily" id="research-daily" />
            <Label htmlFor="research-daily" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Daily digest</div>
              <div className="text-sm text-gray-500">Receive one email per day with all invitations</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="weekly" id="research-weekly" />
            <Label htmlFor="research-weekly" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Weekly digest</div>
              <div className="text-sm text-gray-500">Receive one email per week with all invitations</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="never" id="research-never" />
            <Label htmlFor="research-never" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Never</div>
              <div className="text-sm text-gray-500">Don't send me research invitation emails</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Weekly Digest Toggle */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <Label htmlFor="weekly-digest" className="text-lg font-semibold cursor-pointer">
              Weekly Activity Digest
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Receive a weekly summary of platform activity, top feedback, and your contributions
            </p>
          </div>
          <Switch
            id="weekly-digest"
            checked={preferences.weeklyDigest}
            onCheckedChange={(checked) => setPreferences({ ...preferences, weeklyDigest: checked })}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
