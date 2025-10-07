'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Download,
  Loader2,
  Shield,
  Clock,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AccountInfoProps {
  userId: string;
  employeeId: string;
  email: string;
  role: string;
  createdAt: string;
  currentVillage?: {
    id: string;
    name: string;
  } | null;
  villageHistory: Array<{
    village_id: string;
    from: string;
    to?: string;
  }>;
}

export function AccountInfo({
  userId,
  employeeId,
  email,
  role,
  createdAt,
  currentVillage,
  villageHistory,
}: AccountInfoProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportInfo, setExportInfo] = useState<{
    estimated_size_kb: number;
    counts: any;
  } | null>(null);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAccountAge = () => {
    const accountDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - accountDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    }
  };

  const fetchExportInfo = async () => {
    try {
      const response = await fetch('/api/user/data-export');
      const result = await response.json();

      if (response.ok) {
        setExportInfo(result.data);
      }
    } catch (error) {
      console.error('Error fetching export info:', error);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/user/data-export', {
        method: 'POST',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to export data');
      }

      // Get the blob and create a download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gentil-feedback-data-export-${userId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export failed',
        description:
          error instanceof Error ? error.message : 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Load export info on mount
  useState(() => {
    fetchExportInfo();
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500 hover:bg-red-600';
      case 'PM':
      case 'PO':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'MODERATOR':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'RESEARCHER':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Read-only information about your Gentil Feedback account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <User className="h-4 w-4" />
                User ID
              </p>
              <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                {userId}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Employee ID
              </p>
              <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                {employeeId}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </p>
              <p className="text-sm bg-gray-50 px-2 py-1 rounded break-all">
                {email}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </p>
              <div>
                <Badge className={getRoleBadgeColor(role)}>{role}</Badge>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Created
              </p>
              <p className="text-sm bg-gray-50 px-2 py-1 rounded">
                {formatDate(createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Account Age
              </p>
              <p className="text-sm bg-gray-50 px-2 py-1 rounded">
                {calculateAccountAge()}
              </p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Current Village
              </p>
              <p className="text-sm bg-gray-50 px-2 py-1 rounded">
                {currentVillage
                  ? `${currentVillage.name} (${currentVillage.id})`
                  : 'Not assigned to any village'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            GDPR Data Export
          </CardTitle>
          <CardDescription>
            Download all your data in JSON format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Your data export includes your profile, feedback submissions, votes, village history,
              consent preferences, panel memberships, and questionnaire responses.
            </AlertDescription>
          </Alert>

          {exportInfo && (
            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <p className="text-sm font-medium">Export Contents:</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>Feedback submitted: {exportInfo.counts.feedback}</div>
                <div>Votes cast: {exportInfo.counts.votes}</div>
                <div>Panel memberships: {exportInfo.counts.panel_memberships}</div>
                <div>Survey responses: {exportInfo.counts.questionnaire_responses}</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Estimated size: ~{exportInfo.estimated_size_kb} KB
              </p>
            </div>
          )}

          <Button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full"
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Download...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download My Data
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500">
            This is a GDPR-compliant data export containing all personal data we have stored about
            you. The file will be downloaded as a JSON file that you can open in any text editor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
