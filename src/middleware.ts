import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Authentication Middleware for Gentil Feedback Platform
 *
 * This middleware protects routes that require authentication.
 * It runs on every request and checks if the user has a valid session.
 *
 * Public routes (no authentication required):
 * - / (landing page)
 * - /auth/* (authentication pages)
 * - /api/auth/* (NextAuth API routes)
 * - /unauthorized (access denied page)
 *
 * All other routes require authentication and will redirect to /auth/signin
 * if the user is not authenticated.
 *
 * @see https://next-auth.js.org/configuration/nextjs#middleware
 */

/**
 * List of public routes that don't require authentication
 */
const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/signout",
  "/auth/error",
  "/unauthorized",
];

/**
 * List of route prefixes that don't require authentication
 */
const publicPrefixes = [
  "/api/auth", // NextAuth API routes
  "/_next", // Next.js internal routes
  "/favicon.ico",
  "/images",
  "/fonts",
];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Check prefixes
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for valid session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token, redirect to sign-in page with callback URL
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

/**
 * Matcher configuration
 *
 * Specifies which routes the middleware should run on.
 * We exclude static files and API routes that don't need protection.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
