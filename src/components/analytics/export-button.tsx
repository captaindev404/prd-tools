/**
 * ExportButton Component
 *
 * Button with dropdown menu for exporting analytics data as CSV or JSON
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Download, FileText, FileJson, Loader2 } from 'lucide-react';
import { exportAsCSV, exportAsJSON, generateExportFilename } from '@/lib/analytics-helpers';
import type { ExportFormat } from '@/types/analytics';

interface ExportButtonProps {
  data: Record<string, unknown>[] | unknown;
  filename: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportButton({
  data,
  filename,
  variant = 'outline',
  size = 'default',
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      // Add small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      const exportFilename = generateExportFilename(filename, format);

      if (format === 'csv') {
        if (Array.isArray(data)) {
          exportAsCSV(data as Record<string, unknown>[], exportFilename);
        } else {
          // If data is not an array, convert it to a single-item array
          exportAsCSV([data as Record<string, unknown>], exportFilename);
        }
      } else {
        exportAsJSON(data, exportFilename);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <FileText className="h-4 w-4 text-gray-500" />
            <span>Export as CSV</span>
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
            onClick={() => handleExport('json')}
            disabled={isExporting}
          >
            <FileJson className="h-4 w-4 text-gray-500" />
            <span>Export as JSON</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
