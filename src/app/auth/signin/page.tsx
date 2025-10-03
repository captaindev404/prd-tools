"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

/**
 * Sign In Page for Odyssey Feedback Platform
 *
 * Provides multiple authentication options:
 * - Azure AD for Club Med employees
 * - Keycloak for alternative SSO
 * - Credentials for development/testing (dev only)
 *
 * Features Club Med branding and user-friendly error handling.
 */
export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState("");
  const [devEmployeeId, setDevEmployeeId] = useState("");

  /**
   * Handle SSO provider sign-in
   */
  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error("Sign-in error:", error);
      setIsLoading(null);
    }
  };

  /**
   * Handle development credentials sign-in
   */
  const handleDevSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading("credentials");

    try {
      await signIn("credentials", {
        email: devEmail,
        employeeId: devEmployeeId,
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Dev sign-in error:", error);
      setIsLoading(null);
    }
  };

  /**
   * Handle quick dev login with predefined credentials
   */
  const handleQuickDevLogin = async (email: string, employeeId: string, role: string) => {
    setIsLoading(`quick-${role}`);

    try {
      await signIn("credentials", {
        email,
        employeeId,
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Quick dev sign-in error:", error);
      setIsLoading(null);
    }
  };

  /**
   * Get error message based on error code
   */
  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode) return null;

    const errorMessages: Record<string, string> = {
      Signin: "Failed to sign in. Please try again.",
      OAuthSignin: "Failed to start the sign-in process.",
      OAuthCallback: "Failed to complete the sign-in process.",
      OAuthCreateAccount: "Failed to create your account.",
      EmailCreateAccount: "Failed to create your account.",
      Callback: "Sign-in callback failed.",
      OAuthAccountNotLinked:
        "This email is already associated with another account.",
      EmailSignin: "Failed to send verification email.",
      CredentialsSignin: "Invalid credentials. Please check your details.",
      SessionRequired: "Please sign in to access this page.",
      Default: "An error occurred during sign-in. Please try again.",
    };

    return errorMessages[errorCode] || errorMessages.Default;
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
              CM
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Odyssey Feedback
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Club Med Product Feedback Platform
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="default"
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
              onClick={() => handleProviderSignIn("azure-ad")}
              disabled={isLoading !== null}
            >
              {isLoading === "azure-ad" ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 23 23"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.5 0L0 11.5L11.5 23L23 11.5L11.5 0Z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign in with Azure AD
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 text-base border-2"
              onClick={() => handleProviderSignIn("keycloak")}
              disabled={isLoading !== null}
            >
              {isLoading === "keycloak" ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                "Sign in with Keycloak"
              )}
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Development Mode
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Quick Login (password: dev123)</p>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => handleQuickDevLogin("admin@dev.local", "E123456", "admin")}
                    disabled={isLoading !== null}
                  >
                    {isLoading === "quick-admin" ? (
                      "Loading..."
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Admin
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => handleQuickDevLogin("moderator@dev.local", "E123457", "moderator")}
                    disabled={isLoading !== null}
                  >
                    {isLoading === "quick-moderator" ? (
                      "Loading..."
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Moderator
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => handleQuickDevLogin("pm@dev.local", "E234567", "pm")}
                    disabled={isLoading !== null}
                  >
                    {isLoading === "quick-pm" ? (
                      "Loading..."
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        PM
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => handleQuickDevLogin("researcher@dev.local", "E345678", "researcher")}
                    disabled={isLoading !== null}
                  >
                    {isLoading === "quick-researcher" ? (
                      "Loading..."
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Researcher
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => handleQuickDevLogin("user@dev.local", "E456789", "user")}
                    disabled={isLoading !== null}
                  >
                    {isLoading === "quick-user" ? (
                      "Loading..."
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        User
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => handleQuickDevLogin("user2@dev.local", "E567890", "user2")}
                    disabled={isLoading !== null}
                  >
                    {isLoading === "quick-user2" ? (
                      "Loading..."
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        User 2
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                  <span>Advanced: Manual Login</span>
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>

                <form onSubmit={handleDevSignIn} className="space-y-4 mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@dev.local"
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                      required
                      disabled={isLoading !== null}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      type="text"
                      placeholder="E123456"
                      value={devEmployeeId}
                      onChange={(e) => setDevEmployeeId(e.target.value)}
                      required
                      disabled={isLoading !== null}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full h-10"
                    disabled={isLoading !== null}
                  >
                    {isLoading === "credentials"
                      ? "Signing in..."
                      : "Manual Dev Sign In"}
                  </Button>
                </form>
              </details>

              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-xs space-y-1">
                <p className="font-semibold">Dev Accounts (password: dev123):</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• <code className="bg-blue-100 px-1 rounded">admin@dev.local</code> - Full access</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">moderator@dev.local</code> - Moderation queue</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">pm@dev.local</code> - Features & roadmap</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">researcher@dev.local</code> - Research tools</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">user@dev.local</code> - Regular user</li>
                </ul>
              </div>
            </>
          )}

          <div className="text-center text-xs text-muted-foreground pt-4">
            <p>
              By signing in, you agree to our{" "}
              <a href="#" className="underline hover:text-gray-900">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-gray-900">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
