/**
 * API endpoint for sending batch emails
 * POST /api/email/batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { queueBulkEmails } from '@/lib/email/email-queue';
import type { EmailTemplateType } from '@/lib/email/email-templates';

// Validation schema
const batchEmailSchema = z.object({
  emails: z.array(
    z.object({
      userId: z.string(),
      email: z.string().email(),
      templateType: z.enum(['welcome', 'feedback_update', 'roadmap_update', 'questionnaire_invite', 'weekly_digest']),
      templateParams: z.record(z.unknown()),
      priority: z.enum(['high', 'normal', 'low']).optional(),
    })
  ).min(1).max(1000), // Limit to 1000 emails per batch
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate - only logged-in users can send emails
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and researchers can send batch emails
    if (session.user.role !== 'ADMIN' && session.user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = batchEmailSchema.parse(body);

    // Queue emails for batch sending
    const result = await queueBulkEmails(
      validatedData.emails.map((email) => ({
        userId: email.userId,
        email: email.email,
        templateType: email.templateType as EmailTemplateType,
        templateParams: email.templateParams as never,
        priority: email.priority,
      }))
    );

    return NextResponse.json({
      success: result.success,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
      errors: result.errors,
      total: validatedData.emails.length,
    });
  } catch (error) {
    console.error('Error in POST /api/email/batch:', error);

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
