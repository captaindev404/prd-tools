/**
 * Weekly digest email template
 * Supports EN and FR languages with Club Med branding
 */

interface DigestItem {
  title: string;
  id: string;
  link: string;
  metadata?: string; // e.g., vote count, comment count
}

interface WeeklyDigestParams {
  weekStart: string;
  weekEnd: string;
  topFeedback: DigestItem[];
  newRoadmapItems: DigestItem[];
  completedItems: DigestItem[];
  userStats: {
    feedbackSubmitted: number;
    votesGiven: number;
    commentsPosted: number;
  };
  link: string;
  language: 'en' | 'fr';
}

/**
 * Generate HTML email for weekly digest
 */
export function generateWeeklyDigestHTML(params: WeeklyDigestParams): string {
  const { weekStart, weekEnd, topFeedback, newRoadmapItems, completedItems, userStats, link, language } = params;

  const content = {
    en: {
      title: 'Your Weekly Feedback Digest',
      greeting: 'Hello,',
      intro: `Here's your weekly summary of activity on Gentil Feedback from ${weekStart} to ${weekEnd}.`,
      statsTitle: 'Your Activity',
      statsLabels: {
        feedbackSubmitted: 'Feedback Submitted',
        votesGiven: 'Votes Given',
        commentsPosted: 'Comments Posted',
      },
      topFeedbackTitle: 'Top Feedback This Week',
      newRoadmapTitle: 'New Roadmap Items',
      completedTitle: 'Completed Items',
      noItems: 'No items this week',
      ctaButton: 'View Full Dashboard',
      footer: 'Stay engaged with product development at Club Med.',
      footerNote: 'This is an automated weekly digest from Gentil Feedback.',
      unsubscribe: 'You can disable weekly digests in your notification preferences.',
    },
    fr: {
      title: 'Votre résumé hebdomadaire',
      greeting: 'Bonjour,',
      intro: `Voici votre résumé hebdomadaire d'activité sur Gentil Feedback du ${weekStart} au ${weekEnd}.`,
      statsTitle: 'Votre activité',
      statsLabels: {
        feedbackSubmitted: 'Retours soumis',
        votesGiven: 'Votes donnés',
        commentsPosted: 'Commentaires publiés',
      },
      topFeedbackTitle: 'Meilleurs retours de la semaine',
      newRoadmapTitle: 'Nouveaux éléments de la feuille de route',
      completedTitle: 'Éléments terminés',
      noItems: 'Aucun élément cette semaine',
      ctaButton: 'Voir le tableau de bord complet',
      footer: 'Restez engagé(e) dans le développement produit chez Club Med.',
      footerNote: 'Ceci est un résumé hebdomadaire automatique de Gentil Feedback.',
      unsubscribe: 'Vous pouvez désactiver les résumés hebdomadaires dans vos préférences de notification.',
    },
  };

  const t = content[language];

  const renderItemList = (items: DigestItem[]) => {
    if (items.length === 0) {
      return `<p style="margin: 0; color: #999999; font-size: 14px; font-style: italic;">${t.noItems}</p>`;
    }

    return items
      .map(
        (item) => `
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
        <a href="${item.link}" style="color: #0066CC; text-decoration: none; font-size: 14px; font-weight: 500; line-height: 1.4;">
          ${item.title}
        </a>
        ${item.metadata ? `<p style="margin: 4px 0 0; color: #666666; font-size: 12px;">${item.metadata}</p>` : ''}
      </div>
    `
      )
      .join('');
  };

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
                ${t.title}
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${weekStart} - ${weekEnd}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 24px;">
                ${t.greeting}
              </p>
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 24px;">
                ${t.intro}
              </p>

              <!-- User Stats -->
              <div style="background-color: #f8f9fa; padding: 24px; margin: 0 0 30px; border-radius: 6px;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                  ${t.statsTitle}
                </h3>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #666666; font-size: 14px;">${t.statsLabels.feedbackSubmitted}</span>
                    </td>
                    <td align="right" style="padding: 8px 0;">
                      <span style="color: #0066CC; font-size: 18px; font-weight: 600;">${userStats.feedbackSubmitted}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #666666; font-size: 14px;">${t.statsLabels.votesGiven}</span>
                    </td>
                    <td align="right" style="padding: 8px 0;">
                      <span style="color: #0066CC; font-size: 18px; font-weight: 600;">${userStats.votesGiven}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #666666; font-size: 14px;">${t.statsLabels.commentsPosted}</span>
                    </td>
                    <td align="right" style="padding: 8px 0;">
                      <span style="color: #0066CC; font-size: 18px; font-weight: 600;">${userStats.commentsPosted}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Top Feedback -->
              ${
                topFeedback.length > 0
                  ? `
              <div style="margin: 0 0 30px;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                  ${t.topFeedbackTitle}
                </h3>
                ${renderItemList(topFeedback)}
              </div>
              `
                  : ''
              }

              <!-- New Roadmap Items -->
              ${
                newRoadmapItems.length > 0
                  ? `
              <div style="margin: 0 0 30px;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                  ${t.newRoadmapTitle}
                </h3>
                ${renderItemList(newRoadmapItems)}
              </div>
              `
                  : ''
              }

              <!-- Completed Items -->
              ${
                completedItems.length > 0
                  ? `
              <div style="margin: 0 0 30px;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                  ${t.completedTitle}
                </h3>
                ${renderItemList(completedItems)}
              </div>
              `
                  : ''
              }

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
 * Generate plain text email for weekly digest
 */
export function generateWeeklyDigestText(params: WeeklyDigestParams): string {
  const { weekStart, weekEnd, topFeedback, newRoadmapItems, completedItems, userStats, link, language } = params;

  const content = {
    en: {
      title: 'Your Weekly Feedback Digest',
      greeting: 'Hello,',
      intro: `Here's your weekly summary of activity on Gentil Feedback from ${weekStart} to ${weekEnd}.`,
      statsTitle: 'Your Activity:',
      statsLabels: {
        feedbackSubmitted: 'Feedback Submitted',
        votesGiven: 'Votes Given',
        commentsPosted: 'Comments Posted',
      },
      topFeedbackTitle: 'Top Feedback This Week:',
      newRoadmapTitle: 'New Roadmap Items:',
      completedTitle: 'Completed Items:',
      noItems: 'No items this week',
      linkLabel: 'View full dashboard at:',
      footer: 'Stay engaged with product development at Club Med.',
      footerNote: 'This is an automated weekly digest from Gentil Feedback.',
    },
    fr: {
      title: 'Votre résumé hebdomadaire',
      greeting: 'Bonjour,',
      intro: `Voici votre résumé hebdomadaire d'activité sur Gentil Feedback du ${weekStart} au ${weekEnd}.`,
      statsTitle: 'Votre activité :',
      statsLabels: {
        feedbackSubmitted: 'Retours soumis',
        votesGiven: 'Votes donnés',
        commentsPosted: 'Commentaires publiés',
      },
      topFeedbackTitle: 'Meilleurs retours de la semaine :',
      newRoadmapTitle: 'Nouveaux éléments de la feuille de route :',
      completedTitle: 'Éléments terminés :',
      noItems: 'Aucun élément cette semaine',
      linkLabel: 'Voir le tableau de bord complet à :',
      footer: 'Restez engagé(e) dans le développement produit chez Club Med.',
      footerNote: 'Ceci est un résumé hebdomadaire automatique de Gentil Feedback.',
    },
  };

  const t = content[language];

  const renderTextList = (items: DigestItem[]) => {
    if (items.length === 0) {
      return `  ${t.noItems}`;
    }
    return items.map((item) => `  - ${item.title}${item.metadata ? ` (${item.metadata})` : ''}\n    ${item.link}`).join('\n\n');
  };

  return `
${t.title}
${weekStart} - ${weekEnd}

${t.greeting}

${t.intro}

${t.statsTitle}
- ${t.statsLabels.feedbackSubmitted}: ${userStats.feedbackSubmitted}
- ${t.statsLabels.votesGiven}: ${userStats.votesGiven}
- ${t.statsLabels.commentsPosted}: ${userStats.commentsPosted}

${topFeedback.length > 0 ? `${t.topFeedbackTitle}\n${renderTextList(topFeedback)}\n\n` : ''}${
    newRoadmapItems.length > 0 ? `${t.newRoadmapTitle}\n${renderTextList(newRoadmapItems)}\n\n` : ''
  }${completedItems.length > 0 ? `${t.completedTitle}\n${renderTextList(completedItems)}\n\n` : ''}${t.linkLabel}
${link}

${t.footer}

---
${t.footerNote}
  `.trim();
}
