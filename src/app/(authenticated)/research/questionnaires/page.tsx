import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionnaireCard } from '@/components/questionnaires/questionnaire-card';
import { Plus } from 'lucide-react';
import type { QuestionnaireListItem } from '@/types/questionnaire';

export default async function QuestionnairesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status: statusParam, search: searchParam } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;

  // Check if user is researcher/PM/ADMIN
  const isResearcher = ['RESEARCHER', 'PM', 'ADMIN'].includes(user.role || '');

  // If regular user, redirect to their questionnaire inbox
  if (!isResearcher) {
    redirect('/research/my-questionnaires');
  }

  const status = statusParam || 'all';
  const search = searchParam || '';

  // Build where clause
  const where: any = {};
  if (status !== 'all') {
    where.status = status;
  }
  if (search) {
    where.title = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Fetch questionnaires
  const questionnaires = await prisma.questionnaire.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          responses: true,
        },
      },
    },
  });

  // Format for display
  const formattedQuestionnaires: QuestionnaireListItem[] = questionnaires.map((q) => {
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
      questionCount: questions.length,
      responseCount: q._count.responses,
      creator: q.createdBy,
    };
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Questionnaires</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage user research questionnaires
          </p>
        </div>
        <Button asChild>
          <Link href="/research/questionnaires/new">
            <Plus className="h-4 w-4 mr-2" />
            New Questionnaire
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={status} className="w-full">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <Link href="/research/questionnaires?status=all">All</Link>
          </TabsTrigger>
          <TabsTrigger value="draft" asChild>
            <Link href="/research/questionnaires?status=draft">Draft</Link>
          </TabsTrigger>
          <TabsTrigger value="published" asChild>
            <Link href="/research/questionnaires?status=published">Published</Link>
          </TabsTrigger>
          <TabsTrigger value="closed" asChild>
            <Link href="/research/questionnaires?status=closed">Closed</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="space-y-4 mt-6">
          {formattedQuestionnaires.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No questionnaires found</p>
              <Button asChild className="mt-4">
                <Link href="/research/questionnaires/new">Create Your First Questionnaire</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {formattedQuestionnaires.map((questionnaire) => (
                <QuestionnaireCard
                  key={questionnaire.id}
                  questionnaire={questionnaire}
                  isResearcher={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
