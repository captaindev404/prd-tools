import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './settings-client';

export const metadata = {
  title: 'Settings - Gentil Feedback',
  description: 'Manage your profile, consent preferences, and account settings',
};

export default async function SettingsPage() {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/settings');
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      employeeId: true,
      email: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      preferredLanguage: true,
      role: true,
      currentVillageId: true,
      currentVillage: {
        select: {
          id: true,
          name: true,
        },
      },
      villageHistory: true,
      consents: true,
      consentHistory: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    redirect('/auth/signin?callbackUrl=/settings');
  }

  // Parse JSON fields
  const villageHistory = JSON.parse(user.villageHistory);
  const consents = JSON.parse(user.consents);
  const consentHistory = JSON.parse(user.consentHistory);

  // Build consent object
  const consentFlags = {
    research_contact: {
      granted: consents.includes('research_contact'),
      lastUpdated: consentHistory
        .filter((h: any) => h.consent_type === 'research_contact')
        .pop()?.timestamp || null,
    },
    usage_analytics: {
      granted: consents.includes('usage_analytics'),
      lastUpdated: consentHistory
        .filter((h: any) => h.consent_type === 'usage_analytics')
        .pop()?.timestamp || null,
    },
    email_updates: {
      granted: consents.includes('email_updates'),
      lastUpdated: consentHistory
        .filter((h: any) => h.consent_type === 'email_updates')
        .pop()?.timestamp || null,
    },
  };

  // Enrich village history with names (if available)
  const enrichedVillageHistory = await Promise.all(
    villageHistory.map(async (entry: any) => {
      if (entry.village_id) {
        const village = await prisma.village.findUnique({
          where: { id: entry.village_id },
          select: { name: true },
        });
        return {
          ...entry,
          village_name: village?.name,
        };
      }
      return entry;
    })
  );

  const userData = {
    id: user.id,
    employeeId: user.employeeId,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    preferredLanguage: user.preferredLanguage,
    role: user.role,
    currentVillage: user.currentVillage,
    villageHistory: enrichedVillageHistory,
    consents: consentFlags,
    createdAt: user.createdAt.toISOString(),
  };

  return <SettingsClient userData={userData} />;
}
