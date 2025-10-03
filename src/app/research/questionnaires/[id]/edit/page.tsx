import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Construction } from 'lucide-react';

export default async function EditQuestionnairePage({ params }: { params: { id: string } }) {
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/research/questionnaires">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Questionnaire</h1>
          <p className="text-muted-foreground mt-1">{questionnaire.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-yellow-600" />
            <CardTitle>Questionnaire Editor</CardTitle>
          </div>
          <CardDescription>
            The full questionnaire editor UI is under development. You can update questionnaires using the API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Current Data:</h3>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  id: questionnaire.id,
                  title: questionnaire.title,
                  version: questionnaire.version,
                  status: questionnaire.status,
                  questions: JSON.parse(questionnaire.questions || '[]'),
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">API Endpoint:</h3>
            <code className="text-sm">PATCH /api/questionnaires/{questionnaire.id}</code>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <Link href="/research/questionnaires">Back to List</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/research/questionnaires/${questionnaire.id}/analytics`}>
                View Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
