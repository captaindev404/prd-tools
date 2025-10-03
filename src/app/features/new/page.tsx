'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureForm } from '@/components/features/feature-form';
import { ArrowLeft } from 'lucide-react';

export default function NewFeaturePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const canCreate =
      session.user?.role === 'PM' ||
      session.user?.role === 'PO' ||
      session.user?.role === 'ADMIN';

    if (!canCreate) {
      router.push('/unauthorized');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  if (
    !session ||
    (session.user?.role !== 'PM' &&
      session.user?.role !== 'PO' &&
      session.user?.role !== 'ADMIN')
  ) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/features">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Features
        </Link>
      </Button>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Feature</h1>
        <p className="text-muted-foreground mt-1">
          Add a new feature to the catalog
        </p>
      </div>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Details</CardTitle>
          <CardDescription>
            Provide information about the feature you want to add
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureForm />
        </CardContent>
      </Card>
    </div>
  );
}
