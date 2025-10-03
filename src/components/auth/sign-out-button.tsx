"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * Sign Out Button Component
 *
 * Client component that handles user sign out.
 * Shows a loading state while signing out.
 */
export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
