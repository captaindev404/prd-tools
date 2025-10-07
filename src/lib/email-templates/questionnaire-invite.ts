/**
 * Questionnaire invitation email templates
 * Supports EN and FR languages with Club Med branding
 */

interface QuestionnaireInviteParams {
  questionnaireTitle: string;
  deadline: string | null;
  link: string;
  language: 'en' | 'fr';
}

/**
 * Generate HTML email for questionnaire invitation
 */
export function generateQuestionnaireInviteHTML(params: QuestionnaireInviteParams): string {
  const { questionnaireTitle, deadline, link, language } = params;

  const content = {
    en: {
      greeting: 'Hello,',
      intro: 'You have been invited to participate in a new questionnaire:',
      title: questionnaireTitle,
      deadlineLabel: 'Deadline:',
      noDeadline: 'No deadline specified',
      ctaButton: 'Complete Questionnaire',
      footer: 'Your feedback helps us improve our products and services.',
      footerNote: 'This is an automated message from Gentil Feedback.',
      unsubscribe: 'If you no longer wish to receive these emails, please update your preferences.',
    },
    fr: {
      greeting: 'Bonjour,',
      intro: 'Vous avez été invité(e) à participer à un nouveau questionnaire :',
      title: questionnaireTitle,
      deadlineLabel: 'Date limite :',
      noDeadline: 'Aucune date limite spécifiée',
      ctaButton: 'Compléter le questionnaire',
      footer: 'Vos retours nous aident à améliorer nos produits et services.',
      footerNote: 'Ceci est un message automatique d\'Gentil Feedback.',
      unsubscribe: 'Si vous ne souhaitez plus recevoir ces emails, veuillez mettre à jour vos préférences.',
    },
  };

  const t = content[language];
  const deadlineText = deadline || t.noDeadline;

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header with Club Med colors -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Gentil Feedback
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                ${t.greeting}
              </p>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 24px;">
                ${t.intro}
              </p>

              <!-- Questionnaire card -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #0066CC; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
                <h2 style="margin: 0 0 10px; color: #0066CC; font-size: 18px; font-weight: 600;">
                  ${questionnaireTitle}
                </h2>
                <p style="margin: 0; color: #666666; font-size: 14px;">
                  <strong>${t.deadlineLabel}</strong> ${deadlineText}
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${link}" style="display: inline-block; background-color: #0066CC; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">
                      ${t.ctaButton}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px;">
                ${t.footer}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px; line-height: 18px;">
                ${t.footerNote}
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 18px;">
                ${t.unsubscribe}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for questionnaire invitation
 */
export function generateQuestionnaireInviteText(params: QuestionnaireInviteParams): string {
  const { questionnaireTitle, deadline, link, language } = params;

  const content = {
    en: {
      greeting: 'Hello,',
      intro: 'You have been invited to participate in a new questionnaire:',
      deadlineLabel: 'Deadline:',
      noDeadline: 'No deadline specified',
      linkLabel: 'Complete the questionnaire at:',
      footer: 'Your feedback helps us improve our products and services.',
      footerNote: 'This is an automated message from Gentil Feedback.',
    },
    fr: {
      greeting: 'Bonjour,',
      intro: 'Vous avez été invité(e) à participer à un nouveau questionnaire :',
      deadlineLabel: 'Date limite :',
      noDeadline: 'Aucune date limite spécifiée',
      linkLabel: 'Compléter le questionnaire à :',
      footer: 'Vos retours nous aident à améliorer nos produits et services.',
      footerNote: 'Ceci est un message automatique d\'Gentil Feedback.',
    },
  };

  const t = content[language];
  const deadlineText = deadline || t.noDeadline;

  return `
${t.greeting}

${t.intro}

${questionnaireTitle}
${t.deadlineLabel} ${deadlineText}

${t.linkLabel}
${link}

${t.footer}

---
${t.footerNote}
  `.trim();
}
