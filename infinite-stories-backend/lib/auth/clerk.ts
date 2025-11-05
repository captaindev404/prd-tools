import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

/**
 * Get the authenticated user's ID from Clerk
 * Throws an error if the user is not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}

/**
 * Get the authenticated user's Clerk user object
 * Throws an error if the user is not authenticated
 */
export async function requireUser() {
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Get or create a user in the database from Clerk
 * This ensures the user exists in our database
 */
export async function getOrCreateUser() {
  const clerkUser = await requireUser();

  // Check if user exists in database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // Create user if doesn't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
  }

  return user;
}

/**
 * Check if a resource belongs to the authenticated user
 */
export async function verifyResourceOwnership(userId: string) {
  const clerkUserId = await requireAuth();

  // Get the database user
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!user || user.id !== userId) {
    throw new Error('Forbidden: You do not have access to this resource');
  }

  return user;
}
