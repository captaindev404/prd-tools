'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/settings/profile-form';
import { ConsentManager } from '@/components/settings/consent-manager';
import { AccountInfo } from '@/components/settings/account-info';
import { VillageHistory } from '@/components/settings/village-history';
import { User, Shield, Building2 } from 'lucide-react';

interface UserData {
  id: string;
  employeeId: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  preferredLanguage: string;
  role: string;
  currentVillage?: {
    id: string;
    name: string;
  } | null;
  villageHistory: Array<{
    village_id: string;
    village_name?: string;
    from: string;
    to?: string;
  }>;
  consents: {
    research_contact: {
      granted: boolean;
      lastUpdated: string | null;
    };
    usage_analytics: {
      granted: boolean;
      lastUpdated: string | null;
    };
    email_updates: {
      granted: boolean;
      lastUpdated: string | null;
    };
  };
  createdAt: string;
}

interface SettingsClientProps {
  userData: UserData;
}

export function SettingsClient({ userData }: SettingsClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProfileUpdate = () => {
    // Force refresh by incrementing key
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-2">
          Manage your profile, consent preferences, and account information
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your profile information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                key={refreshKey}
                defaultValues={{
                  displayName: userData.displayName || '',
                  bio: userData.bio || '',
                  avatarUrl: userData.avatarUrl || '',
                  preferredLanguage: userData.preferredLanguage as 'en' | 'fr',
                }}
                onSuccess={handleProfileUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <ConsentManager initialData={userData.consents} />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <AccountInfo
            userId={userData.id}
            employeeId={userData.employeeId}
            email={userData.email}
            role={userData.role}
            createdAt={userData.createdAt}
            currentVillage={userData.currentVillage}
            villageHistory={userData.villageHistory}
          />

          <VillageHistory
            history={userData.villageHistory}
            currentVillageId={userData.currentVillage?.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
