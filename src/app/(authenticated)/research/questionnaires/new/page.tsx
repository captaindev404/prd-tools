import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Construction } from 'lucide-react';

export default async function NewQuestionnairePage() {
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
          <p className="text-muted-foreground mt-1">Build a new research questionnaire</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-yellow-600" />
            <CardTitle>Questionnaire Builder</CardTitle>
          </div>
          <CardDescription>
            The full questionnaire builder UI is under development. You can create questionnaires using the API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">API Endpoint:</h3>
            <code className="text-sm">POST /api/questionnaires</code>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Example Request Body:</h3>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  title: 'Customer Satisfaction Survey',
                  questions: [
                    {
                      id: 'q1',
                      type: 'nps',
                      text: 'How likely are you to recommend us?',
                      required: true,
                      order: 0,
                    },
                    {
                      id: 'q2',
                      type: 'text',
                      text: 'What could we improve?',
                      required: false,
                      order: 1,
                      multiline: true,
                    },
                  ],
                  targeting: {
                    type: 'all_users',
                  },
                  anonymous: false,
                  responseLimit: 1,
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <Link href="/research/questionnaires">Back to List</Link>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://github.com/your-repo/docs/questionnaire-api"
                target="_blank"
                rel="noopener noreferrer"
              >
                View API Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
