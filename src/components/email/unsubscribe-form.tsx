'use client';

/**
 * Unsubscribe form component
 * Allows users to manage email preferences via unsubscribe token
 */

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

interface Preferences {
  feedbackUpdates: string;
  roadmapUpdates: string;
  researchInvites: string;
  weeklyDigest: boolean;
}

export function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid unsubscribe link. Please use the link from your email.');
      setLoading(false);
      return;
    }

    loadPreferences();
  }, [token]);

  async function loadPreferences() {
    try {
      const response = await fetch(`/api/email/unsubscribe?token=${token}`);

      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError('Failed to load your preferences. Please try again later.');
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!token || !preferences) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to save your preferences. Please try again.');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnsubscribeAll() {
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          preferences: {
            feedbackUpdates: 'never',
            roadmapUpdates: 'never',
            researchInvites: 'never',
            weeklyDigest: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      setPreferences({
        feedbackUpdates: 'never',
        roadmapUpdates: 'never',
        researchInvites: 'never',
        weeklyDigest: false,
      });
      setSuccess(true);
    } catch (err) {
      setError('Failed to unsubscribe. Please try again.');
      console.error('Error unsubscribing:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your preferences...</p>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">⚠️</div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 text-sm">Your preferences have been updated successfully.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Feedback Updates */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Feedback Updates</Label>
          <p className="text-sm text-gray-600">Notifications when your feedback receives updates or comments</p>
          <RadioGroup
            value={preferences.feedbackUpdates}
            onValueChange={(value) =>
              setPreferences({ ...preferences, feedbackUpdates: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="real_time" id="feedback-realtime" />
              <Label htmlFor="feedback-realtime" className="font-normal">Real-time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="feedback-daily" />
              <Label htmlFor="feedback-daily" className="font-normal">Daily digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="feedback-weekly" />
              <Label htmlFor="feedback-weekly" className="font-normal">Weekly digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="never" id="feedback-never" />
              <Label htmlFor="feedback-never" className="font-normal">Never</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Roadmap Updates */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Roadmap Updates</Label>
          <p className="text-sm text-gray-600">Notifications about new features and product updates</p>
          <RadioGroup
            value={preferences.roadmapUpdates}
            onValueChange={(value) =>
              setPreferences({ ...preferences, roadmapUpdates: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="real_time" id="roadmap-realtime" />
              <Label htmlFor="roadmap-realtime" className="font-normal">Real-time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="roadmap-daily" />
              <Label htmlFor="roadmap-daily" className="font-normal">Daily digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="roadmap-weekly" />
              <Label htmlFor="roadmap-weekly" className="font-normal">Weekly digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="never" id="roadmap-never" />
              <Label htmlFor="roadmap-never" className="font-normal">Never</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Research Invites */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Research Invitations</Label>
          <p className="text-sm text-gray-600">Invitations to participate in questionnaires and user testing</p>
          <RadioGroup
            value={preferences.researchInvites}
            onValueChange={(value) =>
              setPreferences({ ...preferences, researchInvites: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="real_time" id="research-realtime" />
              <Label htmlFor="research-realtime" className="font-normal">Real-time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="research-daily" />
              <Label htmlFor="research-daily" className="font-normal">Daily digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="research-weekly" />
              <Label htmlFor="research-weekly" className="font-normal">Weekly digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="never" id="research-never" />
              <Label htmlFor="research-never" className="font-normal">Never</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Weekly Digest */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="weekly-digest" className="text-base font-semibold">Weekly Digest</Label>
            <p className="text-sm text-gray-600">Weekly summary of platform activity</p>
          </div>
          <Switch
            id="weekly-digest"
            checked={preferences.weeklyDigest}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, weeklyDigest: checked })
            }
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        <Button onClick={handleUnsubscribeAll} disabled={saving} variant="outline">
          Unsubscribe All
        </Button>
      </div>
    </div>
  );
}
