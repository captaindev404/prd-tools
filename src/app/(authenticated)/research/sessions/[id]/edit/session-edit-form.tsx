"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionForm } from '@/components/sessions/session-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionEditFormProps {
  sessionId: string;
  initialData: any;
  panels: Array<{ id: string; name: string }>;
  panelMembers: Array<{ id: string; displayName?: string | null; email: string }>;
  facilitators: Array<{ id: string; displayName?: string | null; email: string }>;
}

export function SessionEditForm({
  sessionId,
  initialData,
  panels,
  panelMembers: initialPanelMembers,
  facilitators,
}: SessionEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [panelMembers, setPanelMembers] = useState(initialPanelMembers);

  const fetchPanelMembers = async (panelId: string) => {
    try {
      const response = await fetch(`/api/panels/${panelId}/members`);
      const data = await response.json();
      setPanelMembers(
        data.members?.map((m: any) => ({
          id: m.user.id,
          displayName: m.user.displayName,
          email: m.user.email,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching panel members:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update session');
      }

      router.push(`/research/sessions/${sessionId}`);
    } catch (error) {
      console.error('Error updating session:', error);
      alert(error instanceof Error ? error.message : 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/research/sessions/${sessionId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Details</CardTitle>
      </CardHeader>
      <CardContent>
        <SessionForm
          initialData={initialData}
          panels={panels}
          panelMembers={panelMembers}
          facilitators={facilitators}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}
