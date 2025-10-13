'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, Mail, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface StakeholderNotificationsProps {
  roadmapIds: string[];
  roadmapTitles: string[];
}

export function StakeholderNotifications({
  roadmapIds,
  roadmapTitles,
}: StakeholderNotificationsProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  // Channels
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(false);

  // Audience
  const [allUsers, setAllUsers] = useState(true);
  const [villages, setVillages] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const handlePublish = async () => {
    try {
      setSending(true);
      setSuccess(false);

      const channels: ('in-app' | 'email')[] = [];
      if (inApp) channels.push('in-app');
      if (email) channels.push('email');

      if (channels.length === 0) {
        toast({
          title: 'No channels selected',
          description: 'Please select at least one notification channel',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/roadmap/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roadmapIds,
          message: message || undefined,
          channels,
          audience: {
            allUsers,
            villages: villages.length > 0 ? villages : undefined,
            roles: roles.length > 0 ? roles : undefined,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish updates');
      }

      const result = await response.json();

      setSuccess(true);
      toast({
        title: 'Updates published successfully',
        description: `Sent ${result.summary.notificationsSent} in-app notifications and ${result.summary.emailsSent} emails`,
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        setMessage('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      toast({
        title: 'Error publishing updates',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Publish to Stakeholders
        </CardTitle>
        <CardDescription>
          Notify users about roadmap updates via in-app notifications and email
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selected Roadmap Items */}
        <div>
          <Label className="mb-2 block text-sm font-medium">Selected Roadmap Items</Label>
          <div className="flex flex-wrap gap-2">
            {roadmapTitles.map((title, index) => (
              <Badge key={index} variant="secondary">
                {title}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Custom Message (Optional)</Label>
          <Textarea
            id="message"
            placeholder="Add a custom message to include in the notification..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={sending || success}
          />
          <p className="text-xs text-muted-foreground">
            If left empty, a default message will be generated
          </p>
        </div>

        {/* Notification Channels */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Notification Channels</Label>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-app"
              checked={inApp}
              onCheckedChange={(checked) => setInApp(checked as boolean)}
              disabled={sending || success}
            />
            <Label htmlFor="in-app" className="flex cursor-pointer items-center gap-2 font-normal">
              <Bell className="h-4 w-4" />
              In-app notifications
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="email"
              checked={email}
              onCheckedChange={(checked) => setEmail(checked as boolean)}
              disabled={sending || success}
            />
            <Label htmlFor="email" className="flex cursor-pointer items-center gap-2 font-normal">
              <Mail className="h-4 w-4" />
              Email notifications
            </Label>
          </div>
        </div>

        {/* Audience Targeting */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Audience</Label>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-users"
              checked={allUsers}
              onCheckedChange={(checked) => setAllUsers(checked as boolean)}
              disabled={sending || success}
            />
            <Label htmlFor="all-users" className="cursor-pointer font-normal">
              All users
            </Label>
          </div>

          {!allUsers && (
            <div className="ml-6 space-y-2 text-sm text-muted-foreground">
              <p>Custom audience targeting coming soon...</p>
              <p className="text-xs">
                Future options: filter by villages, roles, panels, or user segments
              </p>
            </div>
          )}
        </div>

        {/* Publish Button */}
        <div className="flex justify-end gap-2 pt-4">
          {success ? (
            <Button disabled className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Published Successfully
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={sending || roadmapIds.length === 0}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Publish Updates
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
