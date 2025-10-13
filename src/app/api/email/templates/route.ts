/**
 * API endpoint for managing email templates
 * GET /api/email/templates - List all available templates
 * POST /api/email/templates/preview - Preview a template with params
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import {
  getAvailableTemplates,
  generateEmailFromTemplate,
  validateTemplateParams,
  EMAIL_SUBJECTS,
  type EmailTemplateType,
} from '@/lib/email/email-templates';

/**
 * GET /api/email/templates
 * List all available email templates
 */
export async function GET() {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and researchers can view templates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const templates = getAvailableTemplates();

    // Return templates with their metadata
    const templateInfo = templates.map((type) => ({
      type,
      subjects: EMAIL_SUBJECTS[type],
      description: getTemplateDescription(type),
    }));

    return NextResponse.json({
      templates: templateInfo,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error in GET /api/email/templates:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get template descriptions
 */
function getTemplateDescription(type: EmailTemplateType): string {
  const descriptions: Record<EmailTemplateType, string> = {
    welcome: 'Welcome email sent to new users upon registration',
    feedback_update: 'Notification when feedback status changes or receives comments',
    roadmap_update: 'Notification when roadmap items are created or updated',
    questionnaire_invite: 'Invitation to participate in research questionnaires',
    weekly_digest: 'Weekly summary of platform activity and user stats',
  };
  return descriptions[type];
}

/**
 * Preview a template with sample parameters
 */
const previewSchema = z.object({
  templateType: z.enum(['welcome', 'feedback_update', 'roadmap_update', 'questionnaire_invite', 'weekly_digest']),
  templateParams: z.record(z.unknown()),
  language: z.enum(['en', 'fr']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and researchers can preview templates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request
    const body = await request.json();
    const { templateType, templateParams } = previewSchema.parse(body);

    // Validate template parameters
    if (!validateTemplateParams(templateType as EmailTemplateType, templateParams)) {
      return NextResponse.json(
        {
          error: 'Invalid template parameters',
          message: 'The provided parameters do not match the template requirements',
        },
        { status: 400 }
      );
    }

    // Generate email content
    const { html, text, subject } = generateEmailFromTemplate(templateType as EmailTemplateType, templateParams as never);

    return NextResponse.json({
      templateType,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error('Error in POST /api/email/templates:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
