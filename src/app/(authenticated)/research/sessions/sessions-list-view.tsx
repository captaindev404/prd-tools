"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCard } from '@/components/sessions/session-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface SessionsListViewProps {
  userId: string;
  canSeeAll: boolean;
}

export function SessionsListView({ userId, canSeeAll }: SessionsListViewProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [panelFilter, setPanelFilter] = useState<string>('all');
  const [panels, setPanels] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
    fetchPanels();
  }, [statusFilter, panelFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (panelFilter !== 'all') {
        params.append('panelId', panelFilter);
      }

      const response = await fetch(`/api/sessions?${params.toString()}`);
      const data = await response.json();
      setSessions(data.items || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPanels = async () => {
    try {
      const response = await fetch('/api/panels');
      const data = await response.json();
      setPanels(data.items || []);
    } catch (error) {
      console.error('Error fetching panels:', error);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/research/sessions/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label htmlFor="panel-filter">Panel</Label>
          <Select value={panelFilter} onValueChange={setPanelFilter}>
            <SelectTrigger id="panel-filter">
              <SelectValue placeholder="Filter by panel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Panels</SelectItem>
              {panels.map((panel) => (
                <SelectItem key={panel.id} value={panel.id}>
                  {panel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No sessions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              {...session}
              onClick={() => handleSessionClick(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
