import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionnaireCard } from '@/components/questionnaires/questionnaire-card';
import type { QuestionnaireListItem } from '@/types/questionnaire';

export default async function MyQuestionnairesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;
  const userId = user.id;

  // Fetch all published questionnaires (simplified targeting for now)
  const allPublishedQuestionnaires = await prisma.questionnaire.findMany({
    where: {
      status: 'published',
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
      _count: {
        select: {
          responses: true,
        },
      },
    },
  });

  // Check which questionnaires the user has responded to
  const userResponses = await prisma.questionnaireResponse.findMany({
    where: {
      respondentId: userId,
    },
    select: {
      questionnaireId: true,
    },
  });

  const respondedQuestionnaireIds = new Set(userResponses.map((r) => r.questionnaireId));

  // Format questionnaires
  const formatQuestionnaire = (q: any): QuestionnaireListItem => {
    const questions = JSON.parse(q.questions || '[]');
    const panelIds = JSON.parse(q.panelIds || '[]');
    const adHocFilters = JSON.parse(q.adHocFilters || '{}');

    let targetingType = 'all_users';
    if (panelIds.length > 0) {
      targetingType = 'specific_panels';
    } else if (adHocFilters.villages?.length > 0) {
      targetingType = 'specific_villages';
    } else if (adHocFilters.roles?.length > 0) {
      targetingType = 'by_role';
    }

    const userHasResponded = respondedQuestionnaireIds.has(q.id);

    return {
      id: q.id,
      title: q.title,
      version: q.version,
      status: q.status as any,
      questions,
      targeting: {
        type: targetingType as any,
        panelIds,
        villageIds: adHocFilters.villages || [],
        roles: adHocFilters.roles || [],
      },
      anonymous: q.anonymous,
      responseLimit: q.responseLimit,
      startAt: q.startAt,
      endAt: q.endAt,
      maxResponses: q.maxResponses,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      userHasResponded,
    } as any; // Type assertion for extra computed fields
  };

  const allQuestionnaires = allPublishedQuestionnaires.map(formatQuestionnaire);

  // Split into pending and completed
  const pendingQuestionnaires = allQuestionnaires.filter((q) => {
    const isExpired = q.endAt && new Date(q.endAt) < new Date();
    return !q.userHasResponded && !isExpired;
  });

  const completedQuestionnaires = allQuestionnaires.filter((q) => q.userHasResponded);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Questionnaires</h1>
        <p className="text-muted-foreground mt-1">
          View and respond to questionnaires targeted to you
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingQuestionnaires.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedQuestionnaires.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingQuestionnaires.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No pending questionnaires</p>
              <p className="text-sm text-muted-foreground mt-2">
                You will see new questionnaires here when they are published
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingQuestionnaires.map((questionnaire) => (
                <QuestionnaireCard
                  key={questionnaire.id}
                  questionnaire={questionnaire}
                  isResearcher={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedQuestionnaires.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No completed questionnaires</p>
              <p className="text-sm text-muted-foreground mt-2">
                Questionnaires you complete will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedQuestionnaires.map((questionnaire) => (
                <QuestionnaireCard
                  key={questionnaire.id}
                  questionnaire={questionnaire}
                  isResearcher={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
