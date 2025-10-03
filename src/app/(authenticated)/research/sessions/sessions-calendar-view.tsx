"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCalendar } from '@/components/sessions/session-calendar';
import { Loader2 } from 'lucide-react';

interface SessionsCalendarViewProps {
  userId: string;
  canSeeAll: boolean;
}

export function SessionsCalendarView({ userId, canSeeAll }: SessionsCalendarViewProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions?limit=100');
      const data = await response.json();
      setSessions(data.items || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
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
    <SessionCalendar
      sessions={sessions}
      onSessionClick={handleSessionClick}
    />
  );
}
