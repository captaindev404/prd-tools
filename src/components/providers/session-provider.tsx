"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Session Provider Wrapper
 *
 * Wraps the NextAuth SessionProvider for use in the app layout.
 * This makes the session available to all client components via useSession().
 *
 * @example
 * ```tsx
 * import { useSession } from "next-auth/react";
 *
 * export default function ClientComponent() {
 *   const { data: session, status } = useSession();
 *
 *   if (status === "loading") return <div>Loading...</div>;
 *   if (!session) return <div>Not authenticated</div>;
 *
 *   return <div>Welcome {session.user.displayName}!</div>;
 * }
 * ```
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
