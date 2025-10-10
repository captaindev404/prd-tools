import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { QuestionnaireCreateForm } from '@/components/questionnaires/questionnaire-create-form';
import { ArrowLeft } from 'lucide-react';

export default async function NewQuestionnairePage() {
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

  // Fetch available panels with member counts
  const availablePanels = await prisma.panel.findMany({
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
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
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

      <QuestionnaireCreateForm availablePanels={availablePanels} />
    </div>
  );
}
