'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface EligibilityRules {
  include_roles?: string[];
  include_villages?: 'all' | string[];
  attributes_predicates?: Array<{
    field: string;
    operator: 'eq' | 'in' | 'contains';
    value: any;
  }>;
  required_consents?: string[];
}

interface EligibilityRulesBuilderProps {
  rules: EligibilityRules;
  onChange: (rules: EligibilityRules) => void;
}

export function EligibilityRulesBuilder({ rules, onChange }: EligibilityRulesBuilderProps) {
  const roles = ['USER', 'PM', 'PO', 'RESEARCHER', 'MODERATOR', 'ADMIN'];
  const consents = ['gdprResearchContact', 'gdprAnalytics', 'gdprEmailUpdates'];

  const updateRoles = (role: string, checked: boolean) => {
    const currentRoles = rules.include_roles || [];
    const newRoles = checked
      ? [...currentRoles, role]
      : currentRoles.filter((r) => r !== role);
    onChange({ ...rules, include_roles: newRoles });
  };

  const updateVillages = (value: string) => {
    onChange({ ...rules, include_villages: value === 'all' ? 'all' : [] });
  };

  const addAttributePredicate = () => {
    const predicates = rules.attributes_predicates || [];
    onChange({
      ...rules,
      attributes_predicates: [
        ...predicates,
        { field: '', operator: 'eq', value: '' },
      ],
    });
  };

  const updatePredicate = (index: number, updates: Partial<any>) => {
    const predicates = [...(rules.attributes_predicates || [])];
    predicates[index] = { ...predicates[index], ...updates };
    onChange({ ...rules, attributes_predicates: predicates });
  };

  const removePredicate = (index: number) => {
    const predicates = rules.attributes_predicates?.filter((_, i) => i !== index);
    onChange({ ...rules, attributes_predicates: predicates });
  };

  const updateConsents = (consent: string, checked: boolean) => {
    const currentConsents = rules.required_consents || [];
    const newConsents = checked
      ? [...currentConsents, consent]
      : currentConsents.filter((c) => c !== consent);
    onChange({ ...rules, required_consents: newConsents });
  };

  return (
    <div className="space-y-6">
      {/* Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle id="roles-section">Roles</CardTitle>
          <CardDescription>Select which user roles are eligible</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset>
            <legend className="sr-only">User Roles</legend>
            <div className="space-y-2" role="group" aria-labelledby="roles-section">
              {roles.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role}`}
                    checked={rules.include_roles?.includes(role)}
                    onCheckedChange={(checked) => updateRoles(role, !!checked)}
                    aria-label={`Include ${role} role in eligibility`}
                  />
                  <Label htmlFor={`role-${role}`} className="cursor-pointer">{role}</Label>
                </div>
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {/* Villages Section */}
      <Card>
        <CardHeader>
          <CardTitle id="villages-section">Villages</CardTitle>
          <CardDescription>Target specific villages or all villages</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset>
            <legend className="sr-only">Village Selection</legend>
            <div role="group" aria-labelledby="villages-section">
              <Label htmlFor="village-select" className="sr-only">
                Select village targeting option
              </Label>
              <Select
                value={rules.include_villages === 'all' ? 'all' : 'specific'}
                onValueChange={updateVillages}
              >
                <SelectTrigger id="village-select" aria-label="Village targeting option">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Villages</SelectItem>
                  <SelectItem value="specific">Specific Villages</SelectItem>
                </SelectContent>
              </Select>
              {rules.include_villages !== 'all' && (
                <p className="text-sm text-muted-foreground mt-2" role="status">
                  Village selection UI to be added
                </p>
              )}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {/* Attribute Predicates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle id="attributes-section">Attribute Rules</CardTitle>
              <CardDescription>Add custom attribute-based rules</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addAttributePredicate}
              aria-label="Add new attribute rule"
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <fieldset>
            <legend className="sr-only">Attribute Rules</legend>
            <div className="space-y-4" role="list" aria-labelledby="attributes-section">
              {(rules.attributes_predicates || []).map((predicate, index) => (
                <div key={index} className="flex gap-2 items-end" role="listitem">
                  <div className="flex-1">
                    <Label htmlFor={`field-${index}`}>Field</Label>
                    <Input
                      id={`field-${index}`}
                      placeholder="e.g., department"
                      value={predicate.field}
                      onChange={(e) => updatePredicate(index, { field: e.target.value })}
                      aria-label={`Attribute field ${index + 1}`}
                      aria-required="true"
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`operator-${index}`}>Operator</Label>
                    <Select
                      value={predicate.operator}
                      onValueChange={(value) => updatePredicate(index, { operator: value })}
                    >
                      <SelectTrigger id={`operator-${index}`} aria-label={`Operator for rule ${index + 1}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">Equals</SelectItem>
                        <SelectItem value="in">In</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`value-${index}`}>Value</Label>
                    <Input
                      id={`value-${index}`}
                      placeholder="Value"
                      value={predicate.value}
                      onChange={(e) => updatePredicate(index, { value: e.target.value })}
                      aria-label={`Value for rule ${index + 1}`}
                      aria-required="true"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePredicate(index)}
                    aria-label={`Remove attribute rule ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Remove rule</span>
                  </Button>
                </div>
              ))}
              {(rules.attributes_predicates?.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground" role="status">No attribute rules defined</p>
              )}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {/* Required Consents Section */}
      <Card>
        <CardHeader>
          <CardTitle id="consents-section">Required Consents</CardTitle>
          <CardDescription>Users must have given these consents</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset>
            <legend className="sr-only">Required Consents</legend>
            <div className="space-y-2" role="group" aria-labelledby="consents-section">
              {consents.map((consent) => (
                <div key={consent} className="flex items-center space-x-2">
                  <Checkbox
                    id={`consent-${consent}`}
                    checked={rules.required_consents?.includes(consent)}
                    onCheckedChange={(checked) => updateConsents(consent, !!checked)}
                    aria-label={`Require ${consent} consent`}
                  />
                  <Label htmlFor={`consent-${consent}`} className="cursor-pointer">{consent}</Label>
                </div>
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>
    </div>
  );
}
