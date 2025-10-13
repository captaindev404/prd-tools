'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, Code, ChevronDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  exportQuestionnaireAsJSON,
  exportQuestionnaireAsPDF,
  type QuestionnaireExportData,
} from '@/lib/questionnaire-export';

interface QuestionnaireExportButtonProps {
  questionnaireId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function QuestionnaireExportButton({
  questionnaireId,
  variant = 'outline',
  size = 'default',
}: QuestionnaireExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchQuestionnaireData = async (): Promise<QuestionnaireExportData | null> => {
    try {
      const response = await fetch(`/api/questionnaires/${questionnaireId}/export-definition`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch questionnaire data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to fetch questionnaire data',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuestionnaireData();
      if (data) {
        exportQuestionnaireAsPDF(data);
        toast({
          title: 'Export successful',
          description: 'Questionnaire exported as PDF',
        });
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuestionnaireData();
      if (data) {
        exportQuestionnaireAsJSON(data);
        toast({
          title: 'Export successful',
          description: 'Questionnaire exported as JSON',
        });
      }
    } catch (error) {
      console.error('JSON export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export as JSON',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF} disabled={isLoading}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON} disabled={isLoading}>
          <Code className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
