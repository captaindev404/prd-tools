import { NextRequest, NextResponse } from 'next/server';
import { performHRISSync } from '@/lib/hris/hris-sync';
import { logAuditAction } from '@/lib/audit-log';
import { z } from 'zod';

const WebhookSchema = z.object({
  event: z.enum(['employee.created', 'employee.updated', 'employee.departed', 'sync.requested']),
  employee_id: z.string().optional(),
  timestamp: z.string(),
  signature: z.string().optional(), // HMAC signature for webhook verification
});

/**
 * POST /api/hris/webhook
 * Receive HRIS webhooks for real-time updates
 * This endpoint should be secured with HMAC signature verification in production
 */
export async function POST(req: NextRequest) {
  try {
    // Parse webhook payload
    const body = await req.json();
    const webhook = WebhookSchema.parse(body);

    // Verify webhook signature (in production)
    // TODO: Implement HMAC signature verification
    // const signature = req.headers.get('x-hris-signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Log webhook receipt
    await logAuditAction({
      userId: 'system',
      action: 'hris.webhook_received',
      metadata: webhook,
      request: req,
    });

    // Handle webhook event
    switch (webhook.event) {
      case 'employee.created':
      case 'employee.updated':
      case 'employee.departed':
        // Trigger incremental sync for specific employee
        if (webhook.employee_id) {
          console.log(`HRIS webhook: ${webhook.event} for employee ${webhook.employee_id}`);
          // Optionally trigger a targeted sync
          // For now, just log the event - full implementation would sync specific employee
        }
        break;

      case 'sync.requested':
        // Trigger full sync
        console.log('HRIS webhook: Full sync requested');
        // Trigger async sync (don't wait for completion)
        performHRISSync({
          syncType: 'full',
          triggeredBy: 'webhook',
        }).catch((error) => {
          console.error('Webhook-triggered sync failed:', error);
        });
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
      event: webhook.event,
    });
  } catch (error) {
    console.error('Error processing HRIS webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
