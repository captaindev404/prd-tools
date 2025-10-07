import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/questionnaires/[id]/export - Export questionnaire responses
 *
 * Query parameters:
 * - format: 'csv' | 'json' (default: 'csv')
 * - includePII: boolean (default: false)
 * - segment: 'village' | 'role' | 'panel' (optional)
 *
 * Auth required: RESEARCHER, PM, or ADMIN
 *
 * Returns:
 * - CSV format: headers + data rows
 * - JSON format: array of response objects
 *
 * PII handling:
 * - If includePII=false, omits email and employeeId
 * - If includePII=true, includes all user data (requires appropriate consent)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to export questionnaire data' },
        { status: 401 }
      );
    }

    // Check authorization - only RESEARCHER, PM, or ADMIN can export
    if (!['RESEARCHER', 'PM', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only researchers, product managers, and admins can export questionnaire data'
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const includePII = searchParams.get('includePII') === 'true';
    const segment = searchParams.get('segment');

    // Validate format
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        {
          error: 'Invalid format',
          message: 'Format must be either "csv" or "json"',
        },
        { status: 400 }
      );
    }

    // Validate segment if provided
    if (segment && !['village', 'role', 'panel'].includes(segment)) {
      return NextResponse.json(
        {
          error: 'Invalid segment',
          message: 'Segment must be one of: village, role, panel',
        },
        { status: 400 }
      );
    }

    // Fetch questionnaire with responses
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: id },
      include: {
        responses: {
          include: {
            respondent: {
              select: {
                id: true,
                employeeId: true,
                email: true,
                role: true,
                currentVillageId: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Parse questions from JSON string
    const questions = JSON.parse(questionnaire.questions as string || '[]');

    // Build export data
    const exportData = questionnaire.responses.map((response) => {
      const answers = JSON.parse(response.answers as string || '{}');
      const row: any = {
        responseId: response.id,
        completedAt: response.completedAt.toISOString(),
      };

      // Add PII if requested
      if (includePII) {
        row.userId = response.respondent.id;
        row.employeeId = response.respondent.employeeId;
        row.email = response.respondent.email;
        row.displayName = response.respondent.displayName || 'N/A';
      }

      // Always include non-PII demographic data
      row.role = response.respondent.role;
      row.village = response.respondent.currentVillageId || 'N/A';

      // Add answers for each question
      questions.forEach((question: any, index: number) => {
        const answer = answers[question.id];
        // Format answer based on question type
        let formattedAnswer = answer;

        if (Array.isArray(answer)) {
          // For multi-choice questions, join array values
          formattedAnswer = answer.join('; ');
        } else if (typeof answer === 'object' && answer !== null) {
          // For complex objects, stringify
          formattedAnswer = JSON.stringify(answer);
        } else if (answer === null || answer === undefined) {
          formattedAnswer = '';
        }

        const questionLabel = question.label || question.text || `Q${index + 1}`;
        row[`Q${index + 1}_${question.type}_${questionLabel.substring(0, 30)}`] = formattedAnswer;
      });

      return row;
    });

    // Apply segment filtering if requested
    let filteredData = exportData;
    if (segment === 'village') {
      // Group by village for analysis
      filteredData = exportData.sort((a, b) =>
        (a.village || '').localeCompare(b.village || '')
      );
    } else if (segment === 'role') {
      // Group by role for analysis
      filteredData = exportData.sort((a, b) =>
        (a.role || '').localeCompare(b.role || '')
      );
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `questionnaire-${id}-export-${timestamp}.${format}`;

    // Return based on format
    if (format === 'csv') {
      // Generate CSV
      if (filteredData.length === 0) {
        const csv = 'No responses yet';
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      // Get headers from first row
      const headers = Object.keys(filteredData[0]);

      // Create CSV rows with proper escaping
      const csvRows = [
        headers.join(','),
        ...filteredData.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escape CSV values
            if (value === null || value === undefined) return '';
            const str = String(value);
            // Wrap in quotes if contains comma, quote, or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          }).join(',')
        ),
      ];

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } else {
      // JSON format
      return new NextResponse(JSON.stringify(filteredData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
  } catch (error) {
    console.error('Error exporting questionnaire:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to export questionnaire data',
      },
      { status: 500 }
    );
  }
}
