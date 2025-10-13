/**
 * Feedback update email templates
 * Supports EN and FR languages with Club Med branding
 */

interface FeedbackUpdateParams {
  feedbackTitle: string;
  feedbackId: string;
  updateType: 'status_change' | 'comment' | 'merged' | 'in_roadmap';
  oldStatus?: string;
  newStatus?: string;
  comment?: string;
  commenterName?: string;
  link: string;
  language: 'en' | 'fr';
}

/**
 * Get status badge color
 */
function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    new: '#6B7280',
    triaged: '#3B82F6',
    merged: '#8B5CF6',
    in_roadmap: '#10B981',
    closed: '#EF4444',
  };
  return colors[status] || '#6B7280';
}

/**
 * Generate HTML email for feedback update
 */
export function generateFeedbackUpdateHTML(params: FeedbackUpdateParams): string {
  const { feedbackTitle, feedbackId, updateType, oldStatus, newStatus, comment, commenterName, link, language } = params;

  const content = {
    en: {
      greeting: 'Hello,',
      updateTypes: {
        status_change: 'Your feedback has been updated',
        comment: 'New comment on your feedback',
        merged: 'Your feedback has been merged',
        in_roadmap: 'Your feedback is now in the roadmap',
      },
      statusLabels: {
        new: 'New',
        triaged: 'Triaged',
        merged: 'Merged',
        in_roadmap: 'In Roadmap',
        closed: 'Closed',
      },
      statusChange: `Status changed from ${oldStatus} to ${newStatus}`,
      commentLabel: `${commenterName} commented:`,
      ctaButton: 'View Feedback',
      footer: 'Thank you for contributing to product development at Club Med.',
      footerNote: 'This is an automated message from Gentil Feedback.',
      unsubscribe: 'Update your notification preferences if you no longer wish to receive these emails.',
    },
    fr: {
      greeting: 'Bonjour,',
      updateTypes: {
        status_change: 'Votre retour a été mis à jour',
        comment: 'Nouveau commentaire sur votre retour',
        merged: 'Votre retour a été fusionné',
        in_roadmap: 'Votre retour est maintenant dans la feuille de route',
      },
      statusLabels: {
        new: 'Nouveau',
        triaged: 'Trié',
        merged: 'Fusionné',
        in_roadmap: 'En feuille de route',
        closed: 'Fermé',
      },
      statusChange: `Statut changé de ${oldStatus} à ${newStatus}`,
      commentLabel: `${commenterName} a commenté :`,
      ctaButton: 'Voir le retour',
      footer: 'Merci de contribuer au développement produit chez Club Med.',
      footerNote: 'Ceci est un message automatique de Gentil Feedback.',
      unsubscribe: 'Mettez à jour vos préférences de notification si vous ne souhaitez plus recevoir ces emails.',
    },
  };

  const t = content[language];
  const updateTitle = t.updateTypes[updateType];
  const newStatusColor = newStatus ? getStatusBadgeColor(newStatus) : '#6B7280';

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${updateTitle}</title>
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
                ${updateTitle}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                ${t.greeting}
              </p>

              <!-- Feedback card -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #0066CC; padding: 24px; margin: 0 0 30px; border-radius: 4px;">
                <h2 style="margin: 0 0 12px; color: #1a1a1a; font-size: 18px; font-weight: 600; line-height: 1.3;">
                  ${feedbackTitle}
                </h2>
                <p style="margin: 0 0 8px; color: #666666; font-size: 13px;">
                  ID: ${feedbackId}
                </p>
                ${
                  updateType === 'status_change' && newStatus
                    ? `
                <div style="margin-top: 16px;">
                  <span style="display: inline-block; background-color: ${newStatusColor}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                    ${t.statusLabels[newStatus as keyof typeof t.statusLabels] || newStatus}
                  </span>
                </div>
                `
                    : ''
                }
                ${
                  updateType === 'comment' && comment
                    ? `
                <div style="margin-top: 16px; padding: 16px; background-color: #ffffff; border-radius: 4px; border: 1px solid #e9ecef;">
                  <p style="margin: 0 0 8px; color: #0066CC; font-size: 14px; font-weight: 600;">
                    ${t.commentLabel}
                  </p>
                  <p style="margin: 0; color: #333333; font-size: 14px; line-height: 20px;">
                    ${comment}
                  </p>
                </div>
                `
                    : ''
                }
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${link}" style="display: inline-block; background-color: #0066CC; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      ${t.ctaButton} →
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
 * Generate plain text email for feedback update
 */
export function generateFeedbackUpdateText(params: FeedbackUpdateParams): string {
  const { feedbackTitle, feedbackId, updateType, oldStatus, newStatus, comment, commenterName, link, language } = params;

  const content = {
    en: {
      greeting: 'Hello,',
      updateTypes: {
        status_change: 'Your feedback has been updated',
        comment: 'New comment on your feedback',
        merged: 'Your feedback has been merged',
        in_roadmap: 'Your feedback is now in the roadmap',
      },
      statusLabels: {
        new: 'New',
        triaged: 'Triaged',
        merged: 'Merged',
        in_roadmap: 'In Roadmap',
        closed: 'Closed',
      },
      statusChange: `Status changed from ${oldStatus} to ${newStatus}`,
      commentLabel: `${commenterName} commented:`,
      linkLabel: 'View feedback at:',
      footer: 'Thank you for contributing to product development at Club Med.',
      footerNote: 'This is an automated message from Gentil Feedback.',
    },
    fr: {
      greeting: 'Bonjour,',
      updateTypes: {
        status_change: 'Votre retour a été mis à jour',
        comment: 'Nouveau commentaire sur votre retour',
        merged: 'Votre retour a été fusionné',
        in_roadmap: 'Votre retour est maintenant dans la feuille de route',
      },
      statusLabels: {
        new: 'Nouveau',
        triaged: 'Trié',
        merged: 'Fusionné',
        in_roadmap: 'En feuille de route',
        closed: 'Fermé',
      },
      statusChange: `Statut changé de ${oldStatus} à ${newStatus}`,
      commentLabel: `${commenterName} a commenté :`,
      linkLabel: 'Voir le retour à :',
      footer: 'Merci de contribuer au développement produit chez Club Med.',
      footerNote: 'Ceci est un message automatique de Gentil Feedback.',
    },
  };

  const t = content[language];
  const updateTitle = t.updateTypes[updateType];

  let updateDetails = '';
  if (updateType === 'status_change' && newStatus) {
    updateDetails = `\n${t.statusChange}`;
  } else if (updateType === 'comment' && comment && commenterName) {
    updateDetails = `\n\n${t.commentLabel}\n"${comment}"`;
  }

  return `
${t.greeting}

${updateTitle}

${feedbackTitle}
ID: ${feedbackId}${updateDetails}

${t.linkLabel}
${link}

${t.footer}

---
${t.footerNote}
  `.trim();
}
