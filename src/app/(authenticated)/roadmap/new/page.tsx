import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { RoadmapForm } from '@/components/roadmap/roadmap-form';

export default async function NewRoadmapPage() {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check if user has permission (PM/PO/ADMIN)
  const hasPermission = ['PM', 'PO', 'ADMIN'].includes(session.user.role);

  if (!hasPermission) {
    redirect('/roadmap');
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Roadmap Item</h1>
        <p className="text-gray-600 mt-2">
          Add a new item to the product roadmap. This will be visible to users based
          on the visibility setting you choose.
        </p>
      </div>

      <RoadmapForm />
    </div>
  );
}
