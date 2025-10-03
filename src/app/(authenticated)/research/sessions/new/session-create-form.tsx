"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionForm } from '@/components/sessions/session-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionCreateFormProps {
  panels: Array<{ id: string; name: string }>;
  facilitators: Array<{ id: string; displayName?: string | null; email: string }>;
}

export function SessionCreateForm({ panels, facilitators }: SessionCreateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [panelMembers, setPanelMembers] = useState<any[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');

  useEffect(() => {
    if (selectedPanelId) {
      fetchPanelMembers(selectedPanelId);
    } else {
      setPanelMembers([]);
    }
  }, [selectedPanelId]);

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
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create session');
      }

      const result = await response.json();
      router.push(`/research/sessions/${result.data.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Details</CardTitle>
      </CardHeader>
      <CardContent>
        <SessionForm
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
