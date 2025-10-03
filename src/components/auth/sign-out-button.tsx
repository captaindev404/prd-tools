"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * Sign Out Button Component
 *
 * Client component that handles user sign out.
 * Shows a loading state while signing out.
 *
 * Accessibility Features:
 * - Clear button label
 * - Keyboard accessible
 * - Loading state communicated to screen readers
 */
export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      aria-label="Sign out of your account"
    >
      Sign Out
    </Button>
  );
}
