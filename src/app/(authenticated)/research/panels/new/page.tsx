import { redirect } from 'next/navigation';
import { PanelWizard } from '@/components/panels/panel-wizard';
import { getCurrentUser, canCreatePanel } from '@/lib/auth-helpers';

export const metadata = {
  title: 'Create Research Panel | Gentil Feedback',
  description: 'Create a new research panel for user testing',
};

export default async function NewPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/signin');
  }

  if (!canCreatePanel(user)) {
    redirect('/research/panels');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Research Panel</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new panel for user research, testing, and feedback collection
        </p>
      </div>

      <PanelWizard />
    </div>
  );
}
