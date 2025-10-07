import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { QuestionnaireEditForm } from '@/components/questionnaires/questionnaire-edit-form';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';

export default async function EditQuestionnairePage({ params }: { params: Promise<{ id: string; }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;

  // Check if user is researcher/PM/ADMIN
  const isResearcher = ['RESEARCHER', 'PM', 'ADMIN'].includes(user.role || '');
  if (!isResearcher) {
    redirect('/research/questionnaires');
  }

  // Fetch questionnaire
  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
      panels: {
        select: {
          id: true,
          name: true,
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

  // Check if user owns this questionnaire or is ADMIN
  if (questionnaire.createdById !== user.id && user.role !== 'ADMIN') {
    redirect('/research/questionnaires');
  }

  // Parse JSON fields
  const questions = JSON.parse(questionnaire.questions || '[]');
  const panelIds = JSON.parse(questionnaire.panelIds || '[]');
  const adHocFilters = JSON.parse(questionnaire.adHocFilters || '{}');

  // Fetch all available panels for the dropdown
  const availablePanels = await prisma.panel.findMany({
    where: { archived: false },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: { memberships: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Determine targeting type
  let targetingType = 'all_users';
  if (panelIds.length > 0) {
    targetingType = 'specific_panels';
  } else if (adHocFilters.villages?.length > 0) {
    targetingType = 'specific_villages';
  } else if (adHocFilters.roles?.length > 0) {
    targetingType = 'by_role';
  }

  const initialData = {
    id: questionnaire.id,
    title: questionnaire.title,
    version: parseInt(questionnaire.version),
    status: questionnaire.status,
    questions,
    targeting: {
      type: targetingType,
      panelIds,
      villageIds: adHocFilters.villages || [],
      roles: adHocFilters.roles || [],
    },
    anonymous: questionnaire.anonymous,
    responseLimit: questionnaire.responseLimit === 0 ? null : questionnaire.responseLimit.toString(),
    startAt: questionnaire.startAt?.toISOString() || null,
    endAt: questionnaire.endAt?.toISOString() || null,
    maxResponses: questionnaire.maxResponses,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { title: 'Research', href: '/research' },
          { title: 'Questionnaires', href: '/research/questionnaires' },
          { title: questionnaire.title, href: `/research/questionnaires/${questionnaire.id}` },
          { title: 'Edit' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/research/questionnaires/${questionnaire.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Questionnaire</h1>
          <p className="text-muted-foreground mt-1">
            Update questions, targeting, and settings for your questionnaire
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <QuestionnaireEditForm
        questionnaire={initialData}
        availablePanels={availablePanels}
        canEdit={questionnaire.status === 'draft'}
      />
    </div>
  );
}
