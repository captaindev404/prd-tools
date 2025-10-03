import { handlers } from "@/auth";

/**
 * NextAuth v5 API Route Handler
 *
 * This route handles all authentication requests for the Odyssey Feedback platform.
 *
 * Endpoints provided by NextAuth:
 * - GET  /api/auth/signin - Sign in page
 * - POST /api/auth/signin/:provider - Initiate sign in with provider
 * - GET  /api/auth/callback/:provider - OAuth callback
 * - GET  /api/auth/signout - Sign out page
 * - POST /api/auth/signout - Sign out
 * - GET  /api/auth/session - Get current session
 * - GET  /api/auth/csrf - Get CSRF token
 * - GET  /api/auth/providers - Get configured providers
 *
 * @see https://authjs.dev/getting-started/installation
 */
export const { GET, POST } = handlers;
