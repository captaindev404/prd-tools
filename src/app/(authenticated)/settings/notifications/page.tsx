/**
 * Notification preferences page for authenticated users
 * Allows users to manage their email notification settings
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { NotificationPreferencesForm } from '@/components/email/notification-preferences-form';

export default async function NotificationSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Preferences</h1>
        <p className="text-gray-600">Manage how and when you receive email notifications from Gentil Feedback.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <NotificationPreferencesForm />
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About Email Notifications</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Real-time:</strong> Receive emails immediately when events occur</li>
          <li>• <strong>Daily digest:</strong> Receive a summary of all updates once per day</li>
          <li>• <strong>Weekly digest:</strong> Receive a summary of all updates once per week</li>
          <li>• <strong>Never:</strong> Don't receive emails for this type of notification</li>
        </ul>
      </div>
    </div>
  );
}
