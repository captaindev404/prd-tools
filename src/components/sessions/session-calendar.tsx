"use client";

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { SessionType } from '@prisma/client';

interface SessionEvent {
  id: string;
  type: SessionType;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  participantCount: number;
}

interface SessionCalendarProps {
  sessions: SessionEvent[];
  onSessionClick: (sessionId: string) => void;
  onDateSelect?: (date: Date) => void;
}

export function SessionCalendar({
  sessions,
  onSessionClick,
  onDateSelect,
}: SessionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleDateSelect = (date: Date | Date[] | { from: Date; to: Date } | undefined) => {
    if (date instanceof Date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  const sessionsOnSelectedDate = selectedDate
    ? sessions.filter((session) =>
        isSameDay(new Date(session.scheduledAt), selectedDate)
      )
    : [];

  const datesWithSessions = new Set(
    sessions.map((session) =>
      format(new Date(session.scheduledAt), 'yyyy-MM-dd')
    )
  );

  const modifiers = {
    hasSession: (date: Date) =>
      datesWithSessions.has(format(date, 'yyyy-MM-dd')),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Session Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, 'MMMM d, yyyy')
                : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsOnSelectedDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions scheduled for this date.
              </p>
            ) : (
              <div className="space-y-3">
                {sessionsOnSelectedDate.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-accent"
                    onClick={() => onSessionClick(session.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{session.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduledAt), 'p')}
                      </span>
                    </div>
                    <p className="text-sm">
                      {session.durationMinutes} min • {session.participantCount}{' '}
                      participant{session.participantCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
