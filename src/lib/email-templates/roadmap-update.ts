/**
 * Roadmap update email templates
 * Supports EN and FR languages with Club Med branding
 */

type RoadmapStage = 'now' | 'next' | 'later' | 'under_consideration';

interface RoadmapUpdateParams {
  title: string;
  stage: RoadmapStage;
  summary: string;
  link: string;
  language: 'en' | 'fr';
}

/**
 * Get stage badge color based on stage
 */
function getStageBadgeColor(stage: RoadmapStage): string {
  const colors: Record<RoadmapStage, string> = {
    now: '#10B981',           // Green - In progress
    next: '#3B82F6',          // Blue - Coming soon
    later: '#F59E0B',         // Amber - Future
    under_consideration: '#6B7280', // Gray - Under review
  };
  return colors[stage] || '#6B7280';
}

/**
 * Generate HTML email for roadmap update
 */
export function generateRoadmapUpdateHTML(params: RoadmapUpdateParams): string {
  const { title, stage, summary, link, language } = params;

  const content = {
    en: {
      greeting: 'Hello,',
      intro: 'We have an update on our product roadmap:',
      stageLabels: {
        now: 'Now',
        next: 'Next',
        later: 'Later',
        under_consideration: 'Under Consideration',
      },
      currentStage: 'Current Stage:',
      ctaButton: 'View Roadmap Details',
      footer: 'Stay informed about our product development and share your feedback.',
      footerNote: 'This is an automated message from Gentil Feedback.',
      unsubscribe: 'If you no longer wish to receive these emails, please update your preferences.',
    },
    fr: {
      greeting: 'Bonjour,',
      intro: 'Nous avons une mise à jour sur notre feuille de route produit :',
      stageLabels: {
        now: 'Maintenant',
        next: 'Prochainement',
        later: 'Plus tard',
        under_consideration: 'À l\'étude',
      },
      currentStage: 'Étape actuelle :',
      ctaButton: 'Voir les détails de la feuille de route',
      footer: 'Restez informé(e) de notre développement produit et partagez vos retours.',
      footerNote: 'Ceci est un message automatique d\'Gentil Feedback.',
      unsubscribe: 'Si vous ne souhaitez plus recevoir ces emails, veuillez mettre à jour vos préférences.',
    },
  };

  const t = content[language];
  const stageLabel = t.stageLabels[stage];
  const badgeColor = getStageBadgeColor(stage);

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
                🚀 Roadmap Update
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

              <!-- Roadmap card -->
              <div style="background-color: #f8f9fa; border-left: 4px solid ${badgeColor}; padding: 24px; margin: 0 0 30px; border-radius: 4px;">
                <div style="margin-bottom: 12px;">
                  <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${stageLabel}
                  </span>
                </div>
                <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px; font-weight: 600; line-height: 1.3;">
                  ${title}
                </h2>
                <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">
                  ${summary}
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${link}" style="display: inline-block; background-color: #0066CC; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">
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
 * Generate plain text email for roadmap update
 */
export function generateRoadmapUpdateText(params: RoadmapUpdateParams): string {
  const { title, stage, summary, link, language } = params;

  const content = {
    en: {
      greeting: 'Hello,',
      intro: 'We have an update on our product roadmap:',
      stageLabels: {
        now: 'Now',
        next: 'Next',
        later: 'Later',
        under_consideration: 'Under Consideration',
      },
      currentStage: 'Current Stage:',
      linkLabel: 'View roadmap details at:',
      footer: 'Stay informed about our product development and share your feedback.',
      footerNote: 'This is an automated message from Gentil Feedback.',
    },
    fr: {
      greeting: 'Bonjour,',
      intro: 'Nous avons une mise à jour sur notre feuille de route produit :',
      stageLabels: {
        now: 'Maintenant',
        next: 'Prochainement',
        later: 'Plus tard',
        under_consideration: 'À l\'étude',
      },
      currentStage: 'Étape actuelle :',
      linkLabel: 'Voir les détails de la feuille de route à :',
      footer: 'Restez informé(e) de notre développement produit et partagez vos retours.',
      footerNote: 'Ceci est un message automatique d\'Gentil Feedback.',
    },
  };

  const t = content[language];
  const stageLabel = t.stageLabels[stage];

  return `
${t.greeting}

${t.intro}

🚀 ROADMAP UPDATE

${title}
${t.currentStage} ${stageLabel}

${summary}

${t.linkLabel}
${link}

${t.footer}

---
${t.footerNote}
  `.trim();
}
