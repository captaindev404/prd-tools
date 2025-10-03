"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SessionType } from '@prisma/client';
import { Loader2 } from 'lucide-react';

const sessionFormSchema = z.object({
  type: z.nativeEnum(SessionType),
  prototypeLink: z.string().url().optional().or(z.literal('')),
  scheduledAt: z.string().min(1, 'Scheduled date/time is required'),
  durationMinutes: z.number().min(15).max(480),
  panelId: z.string().optional(),
  participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
  facilitatorIds: z.array(z.string()).min(1, 'At least one facilitator is required'),
  minParticipants: z.number().min(1),
  maxParticipants: z.number().min(1),
  consentRequired: z.boolean(),
  recordingEnabled: z.boolean(),
  recordingStorageDays: z.number().min(1).max(1825),
  notesSecure: z.boolean(),
}).refine((data) => data.minParticipants <= data.maxParticipants, {
  message: 'Minimum participants cannot exceed maximum',
  path: ['minParticipants'],
}).refine((data) => data.participantIds.length <= data.maxParticipants, {
  message: 'Number of selected participants exceeds maximum',
  path: ['participantIds'],
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

interface SessionFormProps {
  initialData?: Partial<SessionFormValues>;
  panels: Array<{ id: string; name: string }>;
  panelMembers: Array<{ id: string; displayName?: string | null; email: string }>;
  facilitators: Array<{ id: string; displayName?: string | null; email: string }>;
  onSubmit: (data: SessionFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function SessionForm({
  initialData,
  panels,
  panelMembers,
  facilitators,
  onSubmit,
  onCancel,
  loading = false,
}: SessionFormProps) {
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      type: SessionType.usability,
      prototypeLink: '',
      scheduledAt: '',
      durationMinutes: 45,
      panelId: '',
      participantIds: [],
      facilitatorIds: [],
      minParticipants: 1,
      maxParticipants: 6,
      consentRequired: true,
      recordingEnabled: true,
      recordingStorageDays: 365,
      notesSecure: true,
      ...initialData,
    },
  });

  const recordingEnabled = form.watch('recordingEnabled');
  const selectedPanelId = form.watch('panelId');

  // Filter panel members based on selected panel
  const availableParticipants = selectedPanelId
    ? panelMembers
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SessionType.usability}>Usability Test</SelectItem>
                  <SelectItem value={SessionType.interview}>Interview</SelectItem>
                  <SelectItem value={SessionType.prototype_walkthrough}>
                    Prototype Walkthrough
                  </SelectItem>
                  <SelectItem value={SessionType.remote_test}>Remote Test</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="panelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Panel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a panel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {panels.map((panel) => (
                    <SelectItem key={panel.id} value={panel.id}>
                      {panel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Participants must be members of this panel
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prototypeLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prototype Link (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://figma.com/..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Date & Time</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={15}
                    max={480}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Participants</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Participants</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="participantIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Participants</FormLabel>
              <FormDescription>
                {selectedPanelId
                  ? 'Select participants from the panel'
                  : 'Please select a panel first'}
              </FormDescription>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                {availableParticipants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedPanelId
                      ? 'No members in this panel'
                      : 'Select a panel to see available participants'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableParticipants.map((participant) => (
                      <label
                        key={participant.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(participant.id)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...field.value, participant.id]
                              : field.value.filter((id) => id !== participant.id);
                            field.onChange(newValue);
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">
                          {participant.displayName || participant.email}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="facilitatorIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facilitators</FormLabel>
              <FormDescription>
                Select session facilitators (RESEARCHER role)
              </FormDescription>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                {facilitators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No facilitators available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {facilitators.map((facilitator) => (
                      <label
                        key={facilitator.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(facilitator.id)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...field.value, facilitator.id]
                              : field.value.filter((id) => id !== facilitator.id);
                            field.onChange(newValue);
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">
                          {facilitator.displayName || facilitator.email}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="consentRequired"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Consent Required</FormLabel>
                  <FormDescription>
                    Participants must provide consent before joining
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recordingEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Recording Enabled</FormLabel>
                  <FormDescription>
                    Allow session recording
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {recordingEnabled && (
            <FormField
              control={form.control}
              name="recordingStorageDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recording Storage Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={1825}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How long to retain recordings (1-1825 days)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="notesSecure"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Secure Notes</FormLabel>
                  <FormDescription>
                    Restrict note access to facilitators only
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update Session' : 'Create Session'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
