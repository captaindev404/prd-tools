/**
 * API endpoint for sending single emails
 * POST /api/email/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { queueEmail } from '@/lib/email/email-queue';
import type { EmailTemplateType } from '@/lib/email/email-templates';

// Validation schema
const sendEmailSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  templateType: z.enum(['welcome', 'feedback_update', 'roadmap_update', 'questionnaire_invite', 'weekly_digest']),
  templateParams: z.record(z.unknown()),
  priority: z.enum(['high', 'normal', 'low']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate - only logged-in users can send emails
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and researchers can send emails via API
    if (session.user.role !== 'ADMIN' && session.user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = sendEmailSchema.parse(body);

    // Queue email for sending
    const result = await queueEmail({
      userId: validatedData.userId,
      email: validatedData.email,
      templateType: validatedData.templateType as EmailTemplateType,
      templateParams: validatedData.templateParams as never, // Type assertion needed due to generic constraints
      priority: validatedData.priority,
    });

    if (result.skipped) {
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          message: result.reason,
        },
        { status: 200 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to send email',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailLogId: result.emailLogId,
    });
  } catch (error) {
    console.error('Error in POST /api/email/send:', error);

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
