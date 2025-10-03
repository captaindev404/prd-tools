'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Users, Calendar, CheckCircle2, Clock } from 'lucide-react';
import type { QuestionnaireListItem } from '@/types/questionnaire';

interface QuestionnaireCardProps {
  questionnaire: QuestionnaireListItem;
  isResearcher?: boolean;
}

export function QuestionnaireCard({ questionnaire, isResearcher = false }: QuestionnaireCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return null;
    }
  };

  const isExpired = questionnaire.endAt && new Date(questionnaire.endAt) < new Date();
  const canRespond = questionnaire.status === 'published' && !isExpired && !questionnaire.userHasResponded;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{questionnaire.title}</CardTitle>
            <CardDescription className="mt-1">
              Version {questionnaire.version} • by {questionnaire.creator?.displayName || questionnaire.creator?.email}
            </CardDescription>
          </div>
          {getStatusBadge(questionnaire.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{questionnaire.questions?.length || 0} questions</span>
          </div>

          {isResearcher && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{questionnaire.responseCount} responses</span>
            </div>
          )}

          {questionnaire.anonymous && (
            <Badge variant="secondary" className="text-xs">
              Anonymous
            </Badge>
          )}
        </div>

        {questionnaire.endAt && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {isExpired ? 'Expired' : 'Closes'} {new Date(questionnaire.endAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {!isResearcher && questionnaire.userHasResponded && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>You have submitted a response</span>
          </div>
        )}

        {!isResearcher && canRespond && (
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <Clock className="h-4 w-4" />
            <span>Awaiting your response</span>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Target: </span>
          {questionnaire.targeting.type === 'all_users' && 'All users'}
          {questionnaire.targeting.type === 'specific_panels' &&
            `Panel members (${questionnaire.targeting.panelIds?.length || 0} panels)`}
          {questionnaire.targeting.type === 'specific_villages' &&
            `Specific villages (${questionnaire.targeting.villageIds?.length || 0})`}
          {questionnaire.targeting.type === 'by_role' &&
            `By role (${questionnaire.targeting.roles?.join(', ')})`}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {isResearcher ? (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/research/questionnaires/${questionnaire.id}/edit`}>Edit</Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href={`/research/questionnaires/${questionnaire.id}/analytics`}>View Analytics</Link>
            </Button>
          </>
        ) : (
          <>
            {canRespond ? (
              <Button variant="default" size="sm" asChild>
                <Link href={`/questionnaires/${questionnaire.id}/respond`}>Respond Now</Link>
              </Button>
            ) : questionnaire.userHasResponded ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/questionnaires/${questionnaire.id}/respond`}>View Your Response</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                {isExpired ? 'Expired' : 'Not Available'}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
