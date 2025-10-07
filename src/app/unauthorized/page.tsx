import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/session";

/**
 * Unauthorized Page
 *
 * Displayed when a user tries to access a resource they don't have
 * permission for (e.g., wrong role, insufficient privileges).
 */
export default async function UnauthorizedPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-red-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-amber-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Denied
            </CardTitle>
            <CardDescription className="text-base mt-2">
              You don&apos;t have permission to view this page
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-2">
              Why am I seeing this?
            </h3>
            <p className="text-sm text-gray-700">
              The page you&apos;re trying to access requires specific permissions
              that your account doesn&apos;t currently have.
            </p>
          </div>

          {session && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-blue-900 mb-2">
                Your Account Details
              </h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-blue-800 font-medium">Email:</dt>
                  <dd className="text-blue-900">{session.user.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-blue-800 font-medium">Role:</dt>
                  <dd className="text-blue-900">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                      {session.user.role}
                    </span>
                  </dd>
                </div>
                {session.user.employeeId && (
                  <div className="flex justify-between">
                    <dt className="text-blue-800 font-medium">Employee ID:</dt>
                    <dd className="text-blue-900">{session.user.employeeId}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-amber-900 mb-2">
              What can I do?
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
              <li>Contact your manager to request elevated permissions</li>
              <li>Verify you&apos;re accessing the correct resource</li>
              <li>
                Reach out to the Gentil Feedback support team for assistance
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/">Go to Home</Link>
            </Button>

            {session ? (
              <Button asChild variant="outline" className="w-full">
                <Link href="/profile">View My Profile</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            )}
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Need help?{" "}
              <a href="mailto:support@clubmed.com" className="underline">
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
