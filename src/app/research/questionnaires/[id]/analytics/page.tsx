import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsChart } from '@/components/questionnaires/analytics-chart';
import { ArrowLeft, Download, Users, Calendar } from 'lucide-react';
import type { QuestionnaireAnalytics, Question } from '@/types/questionnaire';

export default async function QuestionnaireAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;

  // Check if user is researcher/PM/ADMIN
  const isResearcher = ['RESEARCHER', 'PM', 'ADMIN'].includes(user.role || '');
  if (!isResearcher) {
    redirect('/research/my-questionnaires');
  }

  // Fetch questionnaire
  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: params.id },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
  });

  if (!questionnaire) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Questionnaire Not Found</h1>
          <Button asChild className="mt-4">
            <Link href="/research/questionnaires">Back to Questionnaires</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch analytics
  const responses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireId: params.id },
    include: {
      respondent: {
        select: {
          id: true,
          role: true,
          currentVillageId: true,
        },
      },
    },
  });

  const questions: Question[] = JSON.parse(questionnaire.questions || '[]');

  // Calculate analytics (simplified version for server component)
  const totalResponses = responses.length;
  const responsesByDate: Record<string, number> = {};
  responses.forEach((r) => {
    const date = r.completedAt.toISOString().split('T')[0];
    responsesByDate[date] = (responsesByDate[date] || 0) + 1;
  });

  const lastResponseAt = responses.length > 0
    ? responses.reduce((latest, r) => (r.completedAt > latest ? r.completedAt : latest), responses[0].completedAt)
    : null;

  // Demographics
  const byRole: Record<string, number> = {};
  const byVillage: Record<string, number> = {};
  responses.forEach((r) => {
    byRole[r.respondent.role] = (byRole[r.respondent.role] || 0) + 1;
    const village = r.respondent.currentVillageId || 'unassigned';
    byVillage[village] = (byVillage[village] || 0) + 1;
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/research/questionnaires">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{questionnaire.title}</h1>
            <p className="text-muted-foreground mt-1">Analytics & Insights</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              {questionnaire.maxResponses
                ? `${((totalResponses / questionnaire.maxResponses) * 100).toFixed(1)}% of target`
                : 'No limit set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <p className="text-xs text-muted-foreground">Total questions in survey</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Response</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastResponseAt ? new Date(lastResponseAt).toLocaleDateString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastResponseAt ? new Date(lastResponseAt).toLocaleTimeString() : 'No responses yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {totalResponses === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Responses Yet</CardTitle>
            <CardDescription>
              This questionnaire has not received any responses yet. Analytics will be available once users start responding.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Tabs defaultValue="questions" className="w-full">
          <TabsList>
            <TabsTrigger value="questions">Question Analytics</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="responses">Individual Responses</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6 mt-6">
            <p className="text-sm text-muted-foreground">
              Note: For full analytics with charts, please use the API endpoint at{' '}
              <code className="bg-muted px-1 py-0.5 rounded">/api/questionnaires/{params.id}/analytics</code>
            </p>
            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Question {index + 1}: {question.text}
                  </CardTitle>
                  <CardDescription>Type: {question.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {totalResponses} responses recorded
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Responses by Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(byRole).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm">{role}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(count / totalResponses) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Responses by Village</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(byVillage).map(([village, count]) => (
                      <div key={village} className="flex items-center justify-between">
                        <span className="text-sm">{village}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(count / totalResponses) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Individual Responses</CardTitle>
                <CardDescription>
                  {totalResponses} total responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {responses.slice(0, 10).map((response) => (
                    <div
                      key={response.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {questionnaire.anonymous ? 'Anonymous' : response.respondent.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(response.completedAt).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
                {responses.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Showing 10 of {totalResponses} responses
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
