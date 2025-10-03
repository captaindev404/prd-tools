"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings, LogOut, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * User Navigation Component
 *
 * A dropdown menu for user navigation with avatar, profile info, and action items.
 *
 * Features:
 * - Avatar with fallback to user initials
 * - User info display (name, email, role)
 * - Navigation link: Settings
 * - Sign out action
 * - Mobile-optimized with 44px minimum touch targets
 * - Keyboard accessible
 * - Smooth transitions and animations
 *
 * Accessibility Features:
 * - Proper ARIA labels for screen readers
 * - Keyboard navigation support (Tab, Arrow keys, Enter, Escape)
 * - Focus management with visible focus indicators
 * - Semantic HTML structure
 * - Touch-friendly targets for mobile (min 44px)
 */

export interface UserNavProps {
  user: {
    id: string;
    email: string;
    displayName?: string | null;
    role: string;
    currentVillageId?: string | null;
    avatar?: string | null;
  };
}

/**
 * Generate user initials from name or email
 * Examples:
 * - "John Doe" -> "JD"
 * - "john.doe@example.com" -> "JD"
 * - "Jane" -> "JA"
 */
function getUserInitials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      // First and last name initials
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // Single name - first two letters
    return name.slice(0, 2).toUpperCase();
  }

  // Fallback to email
  if (email) {
    const emailName = email.split("@")[0];
    const parts = emailName.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return emailName.slice(0, 2).toUpperCase();
  }

  return "U";
}

export function UserNav({ user }: UserNavProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const initials = getUserInitials(user.displayName, user.email);
  const displayName = user.displayName || user.email;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-11 w-11 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`User menu for ${displayName}`}
        >
          <Avatar className="h-10 w-10">
            {user.avatar && (
              <AvatarImage
                src={user.avatar}
                alt={`${displayName}'s avatar`}
              />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64"
        align="end"
        sideOffset={8}
        aria-label="User menu"
      >
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1.5 py-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
            <Badge
              variant="secondary"
              className="mt-1.5 w-fit text-xs px-2 py-0.5"
            >
              {user.role}
            </Badge>
            {user.currentVillageId && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span>{user.currentVillageId}</span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation Items */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href="/settings"
              className="flex items-center cursor-pointer min-h-[44px] sm:min-h-0"
            >
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer min-h-[44px] sm:min-h-0"
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
