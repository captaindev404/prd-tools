'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureForm, type FeatureFormValues } from '@/components/features/feature-form';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';

export default function EditFeaturePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [feature, setFeature] = useState<FeatureFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const canEdit =
      session.user?.role === 'PM' ||
      session.user?.role === 'PO' ||
      session.user?.role === 'ADMIN';

    if (!canEdit) {
      router.push('/unauthorized');
    }
  }, [session, status, router]);

  // Fetch feature data
  useEffect(() => {
    if (status === 'loading' || !session) return;

    fetchFeature();
  }, [params.id, session, status]);

  const fetchFeature = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/features/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Feature not found');
        }
        throw new Error('Failed to fetch feature');
      }

      const data = await response.json();
      setFeature({
        title: data.title,
        description: data.description || '',
        area: data.area,
        status: data.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/features/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feature
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Feature not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Truncate title for breadcrumbs (max 50 chars)
  const truncatedTitle = feature.title.length > 50
    ? feature.title.substring(0, 50) + '...'
    : feature.title;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { title: 'Features', href: '/features' },
            { title: truncatedTitle, href: `/features/${params.id}` },
            { title: 'Edit' }
          ]}
        />
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Feature</h1>
        <p className="text-muted-foreground mt-1">
          Update feature information
        </p>
      </div>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Details</CardTitle>
          <CardDescription>
            Modify the feature information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureForm
            initialData={feature}
            featureId={params.id}
            onSuccess={(featureId) => router.push(`/features/${featureId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
