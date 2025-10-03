import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCriteria, type EligibilityCriteria } from '@/lib/panel-eligibility';
import { CheckCircle2, Users, MapPin, Shield, Calendar } from 'lucide-react';

interface EligibilityDisplayProps {
  criteria: EligibilityCriteria;
  className?: string;
}

export function EligibilityDisplay({ criteria, className }: EligibilityDisplayProps) {
  const formatted = formatCriteria(criteria);
  const hasAnyCriteria = Object.keys(formatted).length > 0;

  if (!hasAnyCriteria) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Eligibility Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No specific criteria set (all users eligible)</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Eligibility Criteria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {formatted.roles && (
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Required Roles</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formatted.roles.split(', ').map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {formatted.villages && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Required Villages</p>
              <p className="text-sm text-muted-foreground mt-1">{formatted.villages}</p>
            </div>
          </div>
        )}

        {formatted.consents && (
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Required Consents</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formatted.consents.split(', ').map((consent) => (
                  <Badge key={consent} variant="outline" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {consent}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {formatted.tenure && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Minimum Tenure</p>
              <p className="text-sm text-muted-foreground mt-1">{formatted.tenure}</p>
            </div>
          </div>
        )}

        {formatted.predicates && (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Custom Rules</p>
              <p className="text-sm text-muted-foreground mt-1">{formatted.predicates}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
