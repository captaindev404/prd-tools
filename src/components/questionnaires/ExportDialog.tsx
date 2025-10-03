'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';
import type { Role } from '@prisma/client';

interface ExportDialogProps {
  questionnaireId: string;
  userRole: Role;
  trigger?: React.ReactNode;
}

type ExportFormat = 'csv' | 'json';
type ExportSegment = 'all' | 'village' | 'role' | 'panel';

export function ExportDialog({
  questionnaireId,
  userRole,
  trigger,
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includePII, setIncludePII] = useState(false);
  const [segment, setSegment] = useState<ExportSegment>('all');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const isResearcher = ['RESEARCHER', 'PM', 'ADMIN'].includes(userRole);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Build query parameters
      const params = new URLSearchParams({
        format,
        segment,
        includePII: includePII.toString(),
      });

      // Call export API
      const response = await fetch(
        `/api/questionnaires/${questionnaireId}/export?${params}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
      const filename =
        filenameMatch?.[1] ||
        `questionnaire-${questionnaireId}-export-${Date.now()}.${format}`;

      // Download file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Success toast
      toast({
        title: 'Export successful',
        description: `Questionnaire responses exported as ${format.toUpperCase()}`,
      });

      // Close dialog
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description:
          error instanceof Error ? error.message : 'Failed to export responses',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Questionnaire Responses</DialogTitle>
          <DialogDescription>
            Choose export format and options. Download will start automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="font-normal cursor-pointer">
                  CSV (Spreadsheet)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="format-json" />
                <Label htmlFor="format-json" className="font-normal cursor-pointer">
                  JSON (Raw Data)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* PII Checkbox - Only for RESEARCHER */}
          {isResearcher && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Data Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-pii"
                  checked={includePII}
                  onCheckedChange={(checked) => setIncludePII(checked === true)}
                />
                <Label
                  htmlFor="include-pii"
                  className="font-normal cursor-pointer"
                >
                  Include personally identifiable information (PII)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Includes employee ID, email, and name. Use responsibly.
              </p>
            </div>
          )}

          {/* Segment Selector */}
          <div className="space-y-3">
            <Label htmlFor="segment" className="text-base font-semibold">
              Response Segment
            </Label>
            <Select value={segment} onValueChange={(value) => setSegment(value as ExportSegment)}>
              <SelectTrigger id="segment">
                <SelectValue placeholder="Select segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                <SelectItem value="village">By Village</SelectItem>
                <SelectItem value="role">By Role</SelectItem>
                <SelectItem value="panel">By Panel Membership</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {segment === 'all' && 'Export all responses from this questionnaire'}
              {segment === 'village' && 'Export responses grouped by village'}
              {segment === 'role' && 'Export responses grouped by user role'}
              {segment === 'panel' && 'Export responses from panel members only'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
