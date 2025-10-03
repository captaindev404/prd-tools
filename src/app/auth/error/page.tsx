"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Authentication Error Page
 *
 * Displays user-friendly error messages when authentication fails.
 * Provides guidance on how to resolve the issue and retry sign-in.
 */
export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {errorDetails.title}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {errorDetails.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-2">
              What happened?
            </h3>
            <p className="text-sm text-gray-700">{errorDetails.explanation}</p>
          </div>

          {errorDetails.suggestions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-blue-900 mb-2">
                How to fix this
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                {errorDetails.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Try Again</Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go to Home</Link>
            </Button>
          </div>

          {error && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Error code: <code className="font-mono">{error}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Get detailed error information based on error code
 */
function getErrorDetails(errorCode: string | null) {
  const errorMap: Record<
    string,
    {
      title: string;
      description: string;
      explanation: string;
      suggestions?: string[];
    }
  > = {
    Configuration: {
      title: "Configuration Error",
      description: "There's an issue with the authentication setup.",
      explanation:
        "The authentication service is not properly configured. This is likely a server-side issue.",
      suggestions: [
        "Contact your system administrator",
        "Report this issue to the support team",
      ],
    },
    AccessDenied: {
      title: "Access Denied",
      description: "You don't have permission to sign in.",
      explanation:
        "Your account exists but you don't have permission to access this application.",
      suggestions: [
        "Contact your manager to request access",
        "Verify you have the correct email domain",
        "Ensure your Club Med account is active",
      ],
    },
    Verification: {
      title: "Verification Failed",
      description: "We couldn't verify your identity.",
      explanation:
        "The verification link or code you used is invalid or has expired.",
      suggestions: [
        "Request a new verification link",
        "Check that you clicked the most recent link",
        "Try clearing your browser cache",
      ],
    },
    OAuthSignin: {
      title: "Sign-In Failed",
      description: "Unable to start the authentication process.",
      explanation:
        "There was a problem connecting to the authentication provider.",
      suggestions: [
        "Check your internet connection",
        "Try again in a few moments",
        "Use a different authentication method",
      ],
    },
    OAuthCallback: {
      title: "Authentication Failed",
      description: "Unable to complete the sign-in process.",
      explanation:
        "There was an error while processing your authentication response.",
      suggestions: [
        "Clear your browser cookies and try again",
        "Disable browser extensions that might block authentication",
        "Try using a different browser",
      ],
    },
    OAuthCreateAccount: {
      title: "Account Creation Failed",
      description: "We couldn't create your account.",
      explanation:
        "An error occurred while trying to create your user account.",
      suggestions: [
        "Verify your email is not already registered",
        "Contact support if the problem persists",
        "Try signing in instead of creating a new account",
      ],
    },
    EmailCreateAccount: {
      title: "Account Creation Failed",
      description: "We couldn't create your email-based account.",
      explanation: "There was an issue creating your account with this email.",
      suggestions: [
        "Verify your email address is correct",
        "Check if you already have an account",
        "Contact support for assistance",
      ],
    },
    Callback: {
      title: "Callback Error",
      description: "An error occurred during authentication.",
      explanation:
        "The authentication callback failed to process your request.",
      suggestions: [
        "Try signing in again",
        "Clear your browser data",
        "Contact support if this continues",
      ],
    },
    OAuthAccountNotLinked: {
      title: "Account Already Exists",
      description: "This email is linked to another provider.",
      explanation:
        "An account with your email already exists using a different sign-in method.",
      suggestions: [
        "Try signing in with your original method",
        "Use the same provider you used initially",
        "Contact support to merge accounts",
      ],
    },
    EmailSignin: {
      title: "Email Sign-In Failed",
      description: "We couldn't send a verification email.",
      explanation: "There was an error sending the sign-in email to your inbox.",
      suggestions: [
        "Check your email address is correct",
        "Look in your spam/junk folder",
        "Try again in a few minutes",
      ],
    },
    CredentialsSignin: {
      title: "Invalid Credentials",
      description: "The credentials you provided are incorrect.",
      explanation:
        "The email or employee ID you entered doesn't match our records.",
      suggestions: [
        "Double-check your email and employee ID",
        "Ensure caps lock is off",
        "Try using SSO authentication instead",
      ],
    },
    SessionRequired: {
      title: "Session Required",
      description: "You need to sign in to access this page.",
      explanation: "This page requires an active session to view.",
      suggestions: ["Sign in to continue", "Contact support if you need help"],
    },
    Default: {
      title: "Authentication Error",
      description: "Something went wrong during sign-in.",
      explanation:
        "An unexpected error occurred. This might be temporary or due to a server issue.",
      suggestions: [
        "Try signing in again",
        "Wait a few minutes and retry",
        "Contact support if the problem persists",
      ],
    },
  };

  return errorMap[errorCode || "Default"] || errorMap.Default;
}
