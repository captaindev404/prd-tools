'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Users,
} from 'lucide-react';

interface HRISSyncStatus {
  latestSync: any;
  conflictStats: any;
  pendingConflictsCount: number;
  hrisConfigured: boolean;
  syncEnabled: boolean;
}

interface SyncHistory {
  syncs: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Conflict {
  id: string;
  conflictType: string;
  hrisEmployeeId: string;
  hrisEmail: string | null;
  hrisData: any;
  systemData: any;
  status: string;
  createdAt: string;
}

export default function HRISManagementPage() {
  const [status, setStatus] = useState<HRISSyncStatus | null>(null);
  const [history, setHistory] = useState<SyncHistory | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'conflicts'>('overview');

  useEffect(() => {
    loadStatus();
    loadHistory();
    loadConflicts();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/hris/status?view=summary');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load HRIS status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/hris/status?view=history&limit=10');
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load sync history:', error);
    }
  };

  const loadConflicts = async () => {
    try {
      const res = await fetch('/api/hris/conflicts');
      const data = await res.json();
      setConflicts(data.conflicts || []);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const triggerSync = async (dryRun = false) => {
    setSyncing(true);
    try {
      const res = await fetch('/api/hris/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'manual', dryRun }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Sync ${dryRun ? '(dry run) ' : ''}completed!\n\n` +
            `Processed: ${data.result.recordsProcessed}\n` +
            `Created: ${data.result.recordsCreated}\n` +
            `Updated: ${data.result.recordsUpdated}\n` +
            `Conflicts: ${data.result.conflictsDetected}\n` +
            `Errors: ${data.result.recordsFailed}`
        );
        loadStatus();
        loadHistory();
        loadConflicts();
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      alert('Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  const resolveConflict = async (conflictId: string, resolution: string) => {
    try {
      const res = await fetch('/api/hris/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflictId, resolution }),
      });

      if (res.ok) {
        alert('Conflict resolved successfully');
        loadConflicts();
        loadStatus();
      } else {
        const data = await res.json();
        alert(`Failed to resolve conflict: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Failed to resolve conflict');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HRIS Integration</h1>
          <p className="text-muted-foreground">
            Manage employee data synchronization with the HRIS system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => triggerSync(true)} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Dry Run
          </Button>
          <Button onClick={() => triggerSync(false)} disabled={syncing || !status?.syncEnabled}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Trigger Sync
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {status && !status.syncEnabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            HRIS sync is currently disabled. Set HRIS_SYNC_ENABLED=true to enable automatic syncing.
          </AlertDescription>
        </Alert>
      )}

      {status && !status.hrisConfigured && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            HRIS is not configured. Please set HRIS_API_URL and HRIS_API_KEY environment variables.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Sync History
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'conflicts'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('conflicts')}
        >
          Conflicts
          {conflicts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {conflicts.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && status && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {status.latestSync ? (
                <>
                  <div className="text-2xl font-bold">
                    {new Date(status.latestSync.createdAt).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {status.latestSync.recordsProcessed} records processed
                  </p>
                  <Badge
                    variant={
                      status.latestSync.status === 'completed'
                        ? 'default'
                        : status.latestSync.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="mt-2"
                  >
                    {status.latestSync.status}
                  </Badge>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No syncs yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records Created</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status.latestSync?.recordsCreated || 0}
              </div>
              <p className="text-xs text-muted-foreground">New employees added</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records Updated</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status.latestSync?.recordsUpdated || 0}
              </div>
              <p className="text-xs text-muted-foreground">Employee data synced</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Conflicts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.pendingConflictsCount}</div>
              <p className="text-xs text-muted-foreground">Require manual resolution</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && history && (
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Recent HRIS synchronization attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.syncs.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-4">
                    {sync.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : sync.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">{sync.syncType} sync</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sync.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {sync.recordsProcessed} processed • {sync.recordsCreated} created •{' '}
                      {sync.recordsUpdated} updated
                    </p>
                    {sync.conflictsDetected > 0 && (
                      <p className="text-sm text-yellow-600">
                        {sync.conflictsDetected} conflicts
                      </p>
                    )}
                    {sync.recordsFailed > 0 && (
                      <p className="text-sm text-red-600">{sync.recordsFailed} failed</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflicts Tab */}
      {activeTab === 'conflicts' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Conflicts</CardTitle>
            <CardDescription>
              Employee data conflicts that require manual resolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conflicts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No pending conflicts</p>
                </div>
              ) : (
                conflicts.map((conflict) => (
                  <div key={conflict.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge>{conflict.conflictType.replace('_', ' ')}</Badge>
                        <p className="text-sm mt-1">
                          Employee ID: {conflict.hrisEmployeeId}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(conflict.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">HRIS Data:</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(conflict.hrisData, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">System Data:</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {conflict.systemData
                            ? JSON.stringify(conflict.systemData, null, 2)
                            : 'No existing data'}
                        </pre>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => resolveConflict(conflict.id, 'use_hris')}
                      >
                        Use HRIS Data
                      </Button>
                      {conflict.systemData && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveConflict(conflict.id, 'keep_system')}
                        >
                          Keep System Data
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveConflict(conflict.id, 'merge')}
                      >
                        Merge Both
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveConflict(conflict.id, 'create_new')}
                      >
                        Create New User
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
