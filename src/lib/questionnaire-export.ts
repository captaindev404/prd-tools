/**
 * Questionnaire Export Utilities
 *
 * Provides functionality to export questionnaires as PDF and JSON formats.
 * These exports are for the questionnaire definition itself (not responses).
 */

import jsPDF from 'jspdf';
import type { Question } from '@/types/questionnaire';

export interface QuestionnaireExportData {
  id: string;
  title: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  targeting: {
    type: string;
    panelIds?: string[];
    villageIds?: string[];
    roles?: string[];
  };
  responseSettings: {
    anonymous: boolean;
    responseLimit: number;
    startAt: string | null;
    endAt: string | null;
    maxResponses: number | null;
  };
  creator?: {
    displayName?: string | null;
    email: string;
  };
}

/**
 * Export questionnaire as JSON
 */
export function exportQuestionnaireAsJSON(data: QuestionnaireExportData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `questionnaire-${data.id}-${Date.now()}.json`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get question type display name
 */
function getQuestionTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    likert_5: 'Likert Scale (5-point)',
    likert_7: 'Likert Scale (7-point)',
    nps: 'Net Promoter Score (NPS)',
    mcq_single: 'Multiple Choice (Single)',
    mcq_multiple: 'Multiple Choice (Multiple)',
    text: 'Text Response',
    rating: 'Star Rating',
  };
  return typeMap[type] || type;
}

/**
 * Get localized text from question text field
 */
function getLocalizedText(text: any): string {
  if (typeof text === 'string') {
    return text;
  }
  if (text && typeof text === 'object') {
    return text.en || text.fr || JSON.stringify(text);
  }
  return String(text);
}

/**
 * Export questionnaire as PDF using jsPDF
 */
export function exportQuestionnaireAsPDF(data: QuestionnaireExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper to add wrapped text
  const addWrappedText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);

    checkPageBreak(lines.length * (fontSize / 2) + 5);

    lines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += fontSize / 2;
    });

    return lines.length * (fontSize / 2);
  };

  // Title
  doc.setFillColor(52, 152, 219); // Blue header
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Questionnaire Export', margin, 25);
  y = 50;

  // Questionnaire Title
  doc.setTextColor(0, 0, 0);
  addWrappedText(data.title, 18, 'bold');
  y += 5;

  // Metadata section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const metadata = [
    `ID: ${data.id}`,
    `Version: ${data.version}`,
    `Status: ${data.status.toUpperCase()}`,
    `Created: ${new Date(data.createdAt).toLocaleDateString()} ${new Date(data.createdAt).toLocaleTimeString()}`,
    `Updated: ${new Date(data.updatedAt).toLocaleDateString()} ${new Date(data.updatedAt).toLocaleTimeString()}`,
  ];

  if (data.creator) {
    metadata.push(`Creator: ${data.creator.displayName || data.creator.email}`);
  }

  metadata.forEach((line) => {
    checkPageBreak(8);
    doc.text(line, margin, y);
    y += 6;
  });

  y += 10;

  // Targeting section
  checkPageBreak(30);
  addWrappedText('Targeting', 14, 'bold', [52, 73, 94]);
  y += 2;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  doc.text(`Type: ${data.targeting.type.replace(/_/g, ' ').toUpperCase()}`, margin + 5, y);
  y += 6;

  if (data.targeting.panelIds && data.targeting.panelIds.length > 0) {
    doc.text(`Panels: ${data.targeting.panelIds.join(', ')}`, margin + 5, y);
    y += 6;
  }

  if (data.targeting.villageIds && data.targeting.villageIds.length > 0) {
    doc.text(`Villages: ${data.targeting.villageIds.join(', ')}`, margin + 5, y);
    y += 6;
  }

  if (data.targeting.roles && data.targeting.roles.length > 0) {
    doc.text(`Roles: ${data.targeting.roles.join(', ')}`, margin + 5, y);
    y += 6;
  }

  y += 8;

  // Response Settings section
  checkPageBreak(30);
  addWrappedText('Response Settings', 14, 'bold', [52, 73, 94]);
  y += 2;

  doc.setFontSize(10);
  const settings = [
    `Anonymous: ${data.responseSettings.anonymous ? 'Yes' : 'No'}`,
    `Response Limit: ${data.responseSettings.responseLimit === 0 ? 'Unlimited' : `${data.responseSettings.responseLimit} per user`}`,
    `Start Date: ${data.responseSettings.startAt ? new Date(data.responseSettings.startAt).toLocaleDateString() : 'Not set'}`,
    `End Date: ${data.responseSettings.endAt ? new Date(data.responseSettings.endAt).toLocaleDateString() : 'Not set'}`,
    `Max Total Responses: ${data.responseSettings.maxResponses || 'Unlimited'}`,
  ];

  settings.forEach((line) => {
    checkPageBreak(8);
    doc.text(line, margin + 5, y);
    y += 6;
  });

  y += 12;

  // Questions section
  checkPageBreak(30);
  doc.setFillColor(52, 152, 219);
  doc.rect(margin - 5, y - 8, maxWidth + 10, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Questions', margin, y);
  y += 10;

  doc.setTextColor(0, 0, 0);

  // Iterate through questions
  data.questions.forEach((question, index) => {
    checkPageBreak(40);

    // Question number and text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    const questionNumber = `Question ${index + 1}:`;
    doc.text(questionNumber, margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const questionText = getLocalizedText(question.text);
    const questionLines = doc.splitTextToSize(questionText, maxWidth - 10);

    questionLines.forEach((line: string) => {
      checkPageBreak(8);
      doc.text(line, margin + 5, y);
      y += 6;
    });

    y += 4;

    // Question metadata
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Type: ${getQuestionTypeLabel(question.type)}`, margin + 5, y);
    y += 5;
    doc.text(`Required: ${question.required ? 'Yes' : 'No'}`, margin + 5, y);
    y += 5;

    // Type-specific details
    if (question.type === 'mcq_single' || question.type === 'mcq_multiple') {
      const mcqQuestion = question as any;
      if (mcqQuestion.options && mcqQuestion.options.length > 0) {
        doc.setTextColor(0, 0, 0);
        doc.text('Options:', margin + 5, y);
        y += 5;

        mcqQuestion.options.forEach((option: any, optIndex: number) => {
          checkPageBreak(8);
          const optionText = getLocalizedText(option.text);
          doc.text(`  ${String.fromCharCode(65 + optIndex)}. ${optionText}`, margin + 10, y);
          y += 5;
        });
      }
    } else if (question.type === 'likert_5' || question.type === 'likert_7') {
      const likertQuestion = question as any;
      if (likertQuestion.labels) {
        doc.setTextColor(0, 0, 0);
        if (likertQuestion.labels.lowest) {
          doc.text(`Lowest label: ${likertQuestion.labels.lowest}`, margin + 5, y);
          y += 5;
        }
        if (likertQuestion.labels.highest) {
          doc.text(`Highest label: ${likertQuestion.labels.highest}`, margin + 5, y);
          y += 5;
        }
      }
    } else if (question.type === 'text') {
      const textQuestion = question as any;
      if (textQuestion.maxLength) {
        doc.setTextColor(0, 0, 0);
        doc.text(`Max length: ${textQuestion.maxLength} characters`, margin + 5, y);
        y += 5;
      }
      if (textQuestion.multiline) {
        doc.text('Multiline: Yes', margin + 5, y);
        y += 5;
      }
    } else if (question.type === 'rating') {
      const ratingQuestion = question as any;
      const maxRating = ratingQuestion.maxRating || 5;
      doc.setTextColor(0, 0, 0);
      doc.text(`Max rating: ${maxRating} stars`, margin + 5, y);
      y += 5;
    }

    y += 10;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | Generated ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`questionnaire-${data.id}-${Date.now()}.pdf`);
}
