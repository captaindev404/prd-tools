'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Questionnaire {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  startAt?: string;
  endAt?: string;
  responseCount?: number;
}

export function QuestionnaireList() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchQuestionnaires = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/questionnaires?${params.toString()}`);
      const data = await response.json();
      setQuestionnaires(data.questionnaires || []);
    } catch (error) {
      console.error('Failed to fetch questionnaires:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-yellow-600 bg-yellow-50';
      case 'published':
        return 'text-green-600 bg-green-50';
      case 'closed':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Questionnaires</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Link href="/research/questionnaires/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Questionnaire
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && questionnaires.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No questionnaires found</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter === 'all'
                ? 'Get started by creating your first questionnaire'
                : `No ${statusFilter} questionnaires`}
            </p>
            <Link href="/research/questionnaires/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Questionnaire
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Questionnaires Grid */}
      {!loading && questionnaires.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {questionnaires.map((questionnaire) => (
            <Link key={questionnaire.id} href={`/research/questionnaires/${questionnaire.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{questionnaire.title}</CardTitle>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        questionnaire.status
                      )}`}
                    >
                      {questionnaire.status}
                    </span>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    Created {new Date(questionnaire.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questionnaire.responseCount !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {questionnaire.responseCount} responses
                    </div>
                  )}
                  {questionnaire.startAt && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Active: {new Date(questionnaire.startAt).toLocaleDateString()} -{' '}
                      {questionnaire.endAt
                        ? new Date(questionnaire.endAt).toLocaleDateString()
                        : 'No end date'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
