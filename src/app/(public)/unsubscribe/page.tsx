/**
 * Public unsubscribe page
 * Allows users to unsubscribe from email notifications using a token
 */

import { Suspense } from 'react';
import { UnsubscribeForm } from '@/components/email/unsubscribe-form';

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Preferences</h1>
            <p className="text-gray-600">Manage your email notification settings</p>
          </div>

          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <UnsubscribeForm />
          </Suspense>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            You can also manage your preferences from your{' '}
            <a href="/settings/notifications" className="text-blue-600 hover:underline">
              account settings
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
