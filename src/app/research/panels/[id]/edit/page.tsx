import { redirect, notFound } from 'next/navigation';
import { PanelForm } from '@/components/panels/panel-form';
import { getCurrentUser, canEditPanel } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Edit Panel | Odyssey Feedback',
};

interface EditPanelPageProps {
  params: { id: string };
}

export default async function EditPanelPage({ params }: EditPanelPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/signin');
  }

  const panelId = params.id;

  // Fetch panel
  const panel = await prisma.panel.findUnique({
    where: { id: panelId },
  });

  if (!panel) {
    notFound();
  }

  // Check permission - ADMIN, PM, PO, RESEARCHER can edit panels
  if (!['ADMIN', 'PM', 'PO', 'RESEARCHER'].includes(user.role)) {
    redirect(`/research/panels/${panelId}`);
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Panel</h1>
        <p className="text-muted-foreground mt-2">
          Update panel settings and eligibility criteria
        </p>
      </div>

      <PanelForm
        mode="edit"
        initialData={{
          id: panel.id,
          name: panel.name,
          sizeTarget: panel.sizeTarget,
          eligibilityRules: panel.eligibilityRules,
        } as any}
      />
    </div>
  );
}
