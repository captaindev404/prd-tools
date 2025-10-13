'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Loader2, AlertCircle, Building2, UserCircle, Layers, Clock, X, HelpCircle } from 'lucide-react';
import { Role } from '@prisma/client';
import { useRecentPanels } from '@/hooks/useRecentPanels';

interface Panel {
  id: string;
  name: string;
  description: string | null;
  _count: {
    memberships: number;
  };
}

interface Village {
  id: string;
  name: string;
}

export type TargetingType = 'all_users' | 'specific_panels' | 'specific_villages' | 'by_role';

interface TargetingTabProps {
  // Data
  availablePanels: Panel[];
  availableVillages?: Village[];

  // State
  targetingType: TargetingType;
  selectedPanels: string[];
  selectedVillages: string[];
  selectedRoles: Role[];

  // Callbacks
  onTargetingTypeChange: (type: TargetingType) => void;
  onPanelsChange: (panelIds: string[]) => void;
  onVillagesChange: (villageIds: string[]) => void;
  onRolesChange: (roles: Role[]) => void;

  // Validation
  error?: string | null;
}

const AVAILABLE_ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'USER', label: 'User', description: 'Regular users of the platform' },
  { value: 'PM', label: 'Product Manager', description: 'Product managers' },
  { value: 'PO', label: 'Product Owner', description: 'Product owners' },
  { value: 'RESEARCHER', label: 'Researcher', description: 'User researchers' },
  { value: 'ADMIN', label: 'Admin', description: 'System administrators' },
  { value: 'MODERATOR', label: 'Moderator', description: 'Content moderators' },
];

export function TargetingTab({
  availablePanels,
  availableVillages = [],
  targetingType,
  selectedPanels,
  selectedVillages,
  selectedRoles,
  onTargetingTypeChange,
  onPanelsChange,
  onVillagesChange,
  onRolesChange,
  error,
}: TargetingTabProps) {
  const [estimatedReach, setEstimatedReach] = useState<number | null>(null);
  const [isLoadingReach, setIsLoadingReach] = useState(false);
  const [reachError, setReachError] = useState<string | null>(null);

  // Recently used panels hook
  const { recentPanels, clearRecentPanels } = useRecentPanels(availablePanels);

  // Calculate estimated reach when targeting changes
  useEffect(() => {
    const calculateReach = async () => {
      setReachError(null);
      setIsLoadingReach(true);

      try {
        const requestBody: {
          targetingType: TargetingType;
          panelIds?: string[];
          villageIds?: string[];
          roles?: Role[];
        } = { targetingType };

        // Add targeting-specific parameters
        switch (targetingType) {
          case 'specific_panels':
            if (selectedPanels.length === 0) {
              setEstimatedReach(0);
              setIsLoadingReach(false);
              return;
            }
            requestBody.panelIds = selectedPanels;
            break;
          case 'specific_villages':
            if (selectedVillages.length === 0) {
              setEstimatedReach(0);
              setIsLoadingReach(false);
              return;
            }
            requestBody.villageIds = selectedVillages;
            break;
          case 'by_role':
            if (selectedRoles.length === 0) {
              setEstimatedReach(0);
              setIsLoadingReach(false);
              return;
            }
            requestBody.roles = selectedRoles;
            break;
          case 'all_users':
            // No additional params needed
            break;
        }

        const response = await fetch('/api/questionnaires/audience-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to calculate audience size');
        }

        setEstimatedReach(data.estimatedReach);
      } catch (err) {
        console.error('Error calculating reach:', err);
        setReachError(err instanceof Error ? err.message : 'Failed to calculate reach');
        setEstimatedReach(null);
      } finally {
        setIsLoadingReach(false);
      }
    };

    calculateReach();
  }, [targetingType, selectedPanels, selectedVillages, selectedRoles]);

  const handlePanelToggle = (panelId: string, checked: boolean) => {
    if (checked) {
      onPanelsChange([...selectedPanels, panelId]);
    } else {
      onPanelsChange(selectedPanels.filter(id => id !== panelId));
    }
  };

  const handleVillageToggle = (villageId: string, checked: boolean) => {
    if (checked) {
      onVillagesChange([...selectedVillages, villageId]);
    } else {
      onVillagesChange(selectedVillages.filter(id => id !== villageId));
    }
  };

  const handleRoleToggle = (role: Role, checked: boolean) => {
    if (checked) {
      onRolesChange([...selectedRoles, role]);
    } else {
      onRolesChange(selectedRoles.filter(r => r !== role));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audience Targeting</CardTitle>
          <CardDescription>
            Define who will receive this questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Targeting Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">
                Target Audience <span className="text-red-500" aria-label="required">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Choose who will receive this questionnaire. You can target all users, specific panels, villages, or roles.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <RadioGroup
              value={targetingType}
              onValueChange={(value) => onTargetingTypeChange(value as TargetingType)}
              className="gap-4"
            >
              {/* All Users */}
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem
                  value="all_users"
                  id="all_users"
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="all_users"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      All Users
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Send to all registered users in the system. Broadest possible reach.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send to all registered users on the platform
                  </p>
                </div>
              </div>

              {/* Specific Panels */}
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem
                  value="specific_panels"
                  id="specific_panels"
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="specific_panels"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Layers className="h-4 w-4" />
                      Specific Panels
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Target members of research panels. Users can be in multiple panels and will only be counted once.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Target members of selected research panels
                  </p>
                </div>
              </div>

              {/* Specific Villages */}
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem
                  value="specific_villages"
                  id="specific_villages"
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="specific_villages"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4" />
                      Specific Villages
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Target users from specific Club Med villages. Ideal for location-specific research.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Target users from specific Club Med villages
                  </p>
                </div>
              </div>

              {/* By Role */}
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem
                  value="by_role"
                  id="by_role"
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="by_role"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <UserCircle className="h-4 w-4" />
                      By Role
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Target users by their role (PM, PO, Researcher, Admin, etc.). Useful for role-specific feedback.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Target users with specific roles (PM, PO, etc.)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional Selection Areas */}
          {targetingType === 'specific_panels' && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-medium">
                Select Panels <span className="text-red-500" aria-label="required">*</span>
              </Label>

              {/* Recently Used Panels Quick-Select */}
              {recentPanels.length > 0 && (
                <div className="mb-4 space-y-2 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Recently Used</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentPanels}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Clear recently used panels"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentPanels.map((panel) => {
                      const isSelected = selectedPanels.includes(panel.id);
                      return (
                        <Button
                          key={panel.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePanelToggle(panel.id, !isSelected)}
                          className="text-xs h-8"
                          aria-label={`${isSelected ? 'Deselect' : 'Select'} panel ${panel.name}`}
                          aria-pressed={isSelected}
                        >
                          <Clock className="mr-1.5 h-3 w-3" aria-hidden="true" />
                          {panel.name}
                          <Badge
                            variant={isSelected ? 'secondary' : 'secondary'}
                            className="ml-2 text-xs"
                            aria-hidden="true"
                          >
                            {panel._count.memberships}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quick access to your most recently used panels
                  </p>
                </div>
              )}

              {availablePanels.length === 0 ? (
                <Alert role="status">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    No panels available. Create a panel first to target specific user groups.
                  </AlertDescription>
                </Alert>
              ) : (
                <div
                  className="space-y-3 border rounded-lg p-4 max-h-[400px] overflow-y-auto"
                  role="group"
                  aria-label="Select panels for targeting"
                >
                  {availablePanels.map((panel) => (
                    <div key={panel.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`panel-${panel.id}`}
                        checked={selectedPanels.includes(panel.id)}
                        onCheckedChange={(checked) => handlePanelToggle(panel.id, !!checked)}
                        aria-describedby={`panel-${panel.id}-description`}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`panel-${panel.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {panel.name}
                        </Label>
                        <p
                          id={`panel-${panel.id}-description`}
                          className="text-sm text-muted-foreground mt-1"
                        >
                          {panel.description && `${panel.description} • `}
                          <Badge variant="secondary" className="ml-1">
                            {panel._count.memberships} {panel._count.memberships === 1 ? 'member' : 'members'}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedPanels.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedPanels.length} {selectedPanels.length === 1 ? 'panel' : 'panels'} selected
                </p>
              )}
            </div>
          )}

          {targetingType === 'specific_villages' && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-medium">
                Select Villages <span className="text-red-500" aria-label="required">*</span>
              </Label>
              {availableVillages.length === 0 ? (
                <Alert role="status">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    No villages available in the system.
                  </AlertDescription>
                </Alert>
              ) : (
                <div
                  className="space-y-3 border rounded-lg p-4 max-h-[400px] overflow-y-auto"
                  role="group"
                  aria-label="Select villages for targeting"
                >
                  {availableVillages.map((village) => (
                    <div key={village.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`village-${village.id}`}
                        checked={selectedVillages.includes(village.id)}
                        onCheckedChange={(checked) => handleVillageToggle(village.id, !!checked)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`village-${village.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {village.name}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedVillages.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedVillages.length} {selectedVillages.length === 1 ? 'village' : 'villages'} selected
                </p>
              )}
            </div>
          )}

          {targetingType === 'by_role' && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-medium">
                Select Roles <span className="text-red-500" aria-label="required">*</span>
              </Label>
              <div
                className="space-y-3 border rounded-lg p-4"
                role="group"
                aria-label="Select roles for targeting"
              >
                {AVAILABLE_ROLES.map((role) => (
                  <div key={role.value} className="flex items-start space-x-3">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}
                      aria-describedby={`role-${role.value}-description`}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`role-${role.value}`}
                        className="font-medium cursor-pointer"
                      >
                        {role.label}
                      </Label>
                      <p
                        id={`role-${role.value}-description`}
                        className="text-sm text-muted-foreground mt-1"
                      >
                        {role.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedRoles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedRoles.length} {selectedRoles.length === 1 ? 'role' : 'roles'} selected
                </p>
              )}
            </div>
          )}

          {/* Validation Error */}
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Estimated Reach Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Estimated Reach
              </p>
              {isLoadingReach ? (
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Calculating...</span>
                </div>
              ) : reachError ? (
                <div className="mt-1">
                  <p className="text-sm text-destructive">{reachError}</p>
                </div>
              ) : estimatedReach !== null ? (
                <div className="mt-1">
                  <p className="text-3xl font-bold tracking-tight">
                    {estimatedReach.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {estimatedReach === 1 ? 'user' : 'users'} will receive this questionnaire
                  </p>
                  {targetingType === 'specific_panels' && selectedPanels.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Users belonging to multiple panels are counted once
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Configure targeting to see estimated reach
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
