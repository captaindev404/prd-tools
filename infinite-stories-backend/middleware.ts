import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware for Next.js API routes
 *
 * Note: Authentication is handled in individual route handlers, not here.
 * This is because middleware runs in Edge Runtime which doesn't support
 * Prisma Client (required by Better Auth for session validation).
 *
 * See lib/auth/session.ts for authentication helpers.
 */
export async function middleware(request: NextRequest) {
  // Add CORS headers for mobile apps
  const response = NextResponse.next();

  // Allow requests from mobile apps
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Expose-Headers', 'set-auth-token');

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
