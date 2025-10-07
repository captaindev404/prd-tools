import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Session utilities for Gentil Feedback platform
 *
 * Provides helper functions for working with user sessions in server components.
 * These utilities ensure type-safe access to session data and enforce authentication.
 */

/**
 * Custom session user type with all required fields
 * Extends the default NextAuth session with our domain-specific user data
 */
export type SessionUser = {
  id: string;
  email: string;
  displayName?: string | null;
  employeeId: string;
  role: Role;
  currentVillageId?: string | null;
  consents?: string;
};

/**
 * Extended session type with our custom user data
 */
export type AuthSession = {
  user: SessionUser;
  expires: string;
};

/**
 * Gets the current session from the server
 *
 * Use this in Server Components to access the current user's session.
 * Returns null if the user is not authenticated.
 *
 * @example
 * ```tsx
 * import { getSession } from "@/lib/session";
 *
 * export default async function ProfilePage() {
 *   const session = await getSession();
 *
 *   if (!session) {
 *     return <div>Not authenticated</div>;
 *   }
 *
 *   return <div>Welcome {session.user.displayName}!</div>;
 * }
 * ```
 *
 * @returns The current session or null if not authenticated
 */
export async function getSession(): Promise<AuthSession | null> {
  const session = await auth();
  return session as AuthSession | null;
}

/**
 * Requires authentication and returns the session
 *
 * Use this in Server Components that require authentication.
 * Automatically redirects to sign-in page if not authenticated.
 *
 * @example
 * ```tsx
 * import { requireAuth } from "@/lib/session";
 *
 * export default async function DashboardPage() {
 *   const session = await requireAuth();
 *
 *   return <div>Welcome {session.user.displayName}!</div>;
 * }
 * ```
 *
 * @param redirectTo - Optional URL to redirect to after sign-in (defaults to current URL)
 * @returns The current session (guaranteed to be non-null)
 * @throws Redirects to sign-in page if not authenticated
 */
export async function requireAuth(redirectTo?: string): Promise<AuthSession> {
  const session = await getSession();

  if (!session) {
    const callbackUrl = redirectTo || "/";
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

/**
 * Requires authentication with a specific role
 *
 * Use this in Server Components that require a specific role.
 * Automatically redirects to sign-in page if not authenticated,
 * or to an unauthorized page if the user doesn't have the required role.
 *
 * @example
 * ```tsx
 * import { requireRole } from "@/lib/session";
 * import { Role } from "@prisma/client";
 *
 * export default async function AdminPage() {
 *   const session = await requireRole(Role.ADMIN);
 *
 *   return <div>Admin Dashboard</div>;
 * }
 * ```
 *
 * @param role - The required role
 * @returns The current session (guaranteed to be non-null with required role)
 * @throws Redirects to sign-in page if not authenticated, or unauthorized page if role mismatch
 */
export async function requireRole(role: Role): Promise<AuthSession> {
  const session = await requireAuth();

  if (session.user.role !== role) {
    redirect("/unauthorized");
  }

  return session;
}

/**
 * Checks if the user has any of the specified roles
 *
 * @example
 * ```tsx
 * import { requireAnyRole } from "@/lib/session";
 * import { Role } from "@prisma/client";
 *
 * export default async function ModeratorPage() {
 *   const session = await requireAnyRole([Role.ADMIN, Role.MODERATOR]);
 *
 *   return <div>Moderation Dashboard</div>;
 * }
 * ```
 *
 * @param roles - Array of acceptable roles
 * @returns The current session (guaranteed to be non-null with one of the required roles)
 * @throws Redirects to sign-in page if not authenticated, or unauthorized page if no role match
 */
export async function requireAnyRole(roles: Role[]): Promise<AuthSession> {
  const session = await requireAuth();

  if (!roles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}

/**
 * Checks if the current user has a specific role
 *
 * Use this for conditional logic based on user role.
 * Returns false if not authenticated.
 *
 * @example
 * ```tsx
 * import { hasRole } from "@/lib/session";
 * import { Role } from "@prisma/client";
 *
 * export default async function FeedbackPage() {
 *   const canModerate = await hasRole(Role.MODERATOR);
 *
 *   return (
 *     <div>
 *       {canModerate && <ModerationTools />}
 *       <FeedbackList />
 *     </div>
 *   );
 * }
 * ```
 *
 * @param role - The role to check
 * @returns True if the user is authenticated and has the specified role
 */
export async function hasRole(role: Role): Promise<boolean> {
  const session = await getSession();
  return session?.user.role === role;
}

/**
 * Checks if the current user has any of the specified roles
 *
 * Use this for conditional logic based on multiple roles.
 * Returns false if not authenticated.
 *
 * @example
 * ```tsx
 * import { hasAnyRole } from "@/lib/session";
 * import { Role } from "@prisma/client";
 *
 * export default async function RoadmapPage() {
 *   const canEdit = await hasAnyRole([Role.PM, Role.PO, Role.ADMIN]);
 *
 *   return (
 *     <div>
 *       {canEdit && <EditRoadmapButton />}
 *       <RoadmapView />
 *     </div>
 *   );
 * }
 * ```
 *
 * @param roles - Array of roles to check
 * @returns True if the user is authenticated and has any of the specified roles
 */
export async function hasAnyRole(roles: Role[]): Promise<boolean> {
  const session = await getSession();
  return session ? roles.includes(session.user.role) : false;
}

/**
 * Gets the current user ID
 *
 * @returns The current user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
}

/**
 * Gets the current user's village ID
 *
 * @returns The current user's village ID or null if not set or not authenticated
 */
export async function getCurrentVillageId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.currentVillageId ?? null;
}
