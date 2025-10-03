import { requireAuth } from '@/lib/session';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { NotificationBell } from '@/components/notifications/notification-bell';

/**
 * Dashboard Page
 *
 * This is a protected page that requires authentication.
 * Demonstrates how to use requireAuth() to protect server components.
 */
export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Odyssey Feedback
            </h1>
            <p className="text-sm text-gray-600">Welcome back, {session.user.displayName || session.user.email}!</p>
          </div>
          <div className="flex gap-4 items-center">
            <Badge variant="secondary">{session.user.role}</Badge>
            <NotificationBell />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="text-sm text-gray-900 font-mono">{session.user.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{session.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                  <dd className="text-sm text-gray-900">{session.user.displayName || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
                  <dd className="text-sm text-gray-900">{session.user.employeeId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="text-sm">
                    <Badge>{session.user.role}</Badge>
                  </dd>
                </div>
                {session.user.currentVillageId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Current Village</dt>
                    <dd className="text-sm text-gray-900">{session.user.currentVillageId}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>Your session details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-900">Authenticated</span>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Session Expires</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(session.expires).toLocaleString()}
                  </dd>
                </div>
                <div className="pt-4">
                  <p className="text-xs text-gray-600">
                    Your session is managed securely with NextAuth.js. You&apos;ll be
                    automatically redirected to sign in if your session expires.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>Submit and vote on ideas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Share your product feedback and help prioritize features.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roadmap</CardTitle>
              <CardDescription>View product plans</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                See what&apos;s being built and when to expect new features.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Research</CardTitle>
              <CardDescription>Participate in studies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Join research panels and help shape the product.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Testing Authentication</CardTitle>
            <CardDescription>Verify that authentication is working correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2">
                  Authentication Working!
                </h3>
                <p className="text-sm text-green-800">
                  You successfully authenticated and this protected page is displaying
                  your session data. The middleware is correctly protecting this route.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Test Features
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li>Session data is loaded and displayed correctly</li>
                  <li>Middleware redirects unauthenticated users to /auth/signin</li>
                  <li>Sign out button will clear your session</li>
                  <li>Protected routes are only accessible when authenticated</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button asChild variant="outline">
                  <Link href="/">Go to Home (Public)</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/unauthorized">Test Unauthorized Page</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
