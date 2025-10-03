import * as sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@odyssey-feedback.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Odyssey Feedback';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

if (SENDGRID_API_KEY && !IS_DEVELOPMENT) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export interface BulkEmailRecipient {
  email: string;
  subject: string;
  html: string;
  text: string;
  personalizations?: Record<string, string>;
}

/**
 * Send a single email via SendGrid
 * In development mode, logs to console instead of sending
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { to, subject, html, text } = options;

    // Development mode: log instead of sending
    if (IS_DEVELOPMENT) {
      console.log('📧 [DEV MODE] Email would be sent:');
      console.log('  To:', to);
      console.log('  Subject:', subject);
      console.log('  Text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    // Validate API key
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    // Send email
    const msg = {
      to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject,
      text,
      html,
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (error) {
    console.error('Error sending email:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send bulk emails to multiple recipients
 * Each recipient can have personalized content
 * In development mode, logs to console instead of sending
 */
export async function sendBulkEmail(recipients: BulkEmailRecipient[]): Promise<{
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: Array<{ email: string; error: string }>;
}> {
  const results = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  // Development mode: log instead of sending
  if (IS_DEVELOPMENT) {
    console.log(`📧 [DEV MODE] Bulk email would be sent to ${recipients.length} recipients:`);
    recipients.forEach((recipient, index) => {
      if (index < 3) { // Only log first 3 to avoid clutter
        console.log(`  ${index + 1}. ${recipient.email} - ${recipient.subject}`);
      }
    });
    if (recipients.length > 3) {
      console.log(`  ... and ${recipients.length - 3} more`);
    }
    return {
      success: true,
      successCount: recipients.length,
      failureCount: 0,
      errors: [],
    };
  }

  // Validate API key
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }

  // Send emails in batches to avoid rate limits
  const BATCH_SIZE = 100;
  const batches = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    batches.push(recipients.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const promises = batch.map(async (recipient) => {
      try {
        const msg = {
          to: recipient.email,
          from: {
            email: SENDGRID_FROM_EMAIL,
            name: SENDGRID_FROM_NAME,
          },
          subject: recipient.subject,
          text: recipient.text,
          html: recipient.html,
        };

        await sgMail.send(msg);
        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.success = false;

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error);
        }

        results.errors.push({
          email: recipient.email,
          error: errorMessage,
        });
      }
    });

    // Process batch concurrently but wait for all to complete
    await Promise.all(promises);

    // Add a small delay between batches to respect rate limits
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
