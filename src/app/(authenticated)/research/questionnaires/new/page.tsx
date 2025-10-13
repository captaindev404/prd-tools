import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuestionnaireCreateForm } from '@/components/questionnaires/questionnaire-create-form';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default async function NewQuestionnairePage() {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;

  // 2. Authorization check - user must have RESEARCHER, PM, or ADMIN role
  const isResearcher = ['RESEARCHER', 'PM', 'ADMIN'].includes(user.role || '');
  if (!isResearcher) {
    // Redirect to questionnaire list with 403 error indication
    redirect('/research/questionnaires?error=unauthorized');
  }

  // 3. Fetch available panels with member counts and villages
  let availablePanels;
  let availableVillages;
  try {
    [availablePanels, availableVillages] = await Promise.all([
      prisma.panel.findMany({
        where: {
          archived: false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: {
              memberships: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.village.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Show error page with retry option
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Breadcrumbs
          items={[
            { title: 'Research', href: '/research/questionnaires' },
            { title: 'Questionnaires', href: '/research/questionnaires' },
            { title: 'New' },
          ]}
        />

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load required data. Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button asChild>
            <Link href="/research/questionnaires/new">Try Again</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/research/questionnaires">Back to Questionnaires</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb navigation */}
      <Breadcrumbs
        items={[
          { title: 'Research', href: '/research/questionnaires' },
          { title: 'Questionnaires', href: '/research/questionnaires' },
          { title: 'New' },
        ]}
      />

      {/* Page header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/research/questionnaires">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Questionnaire</h1>
          <p className="text-muted-foreground mt-1">Build a new research questionnaire with targeted questions</p>
        </div>
      </div>

      {/* Questionnaire creation form */}
      <QuestionnaireCreateForm
        availablePanels={availablePanels}
      />
    </div>
  );
}
