/**
 * Welcome email template for new users
 * Supports EN and FR languages with Club Med branding
 */

interface WelcomeEmailParams {
  displayName: string;
  dashboardLink: string;
  language: 'en' | 'fr';
}

/**
 * Generate HTML email for welcome message
 */
export function generateWelcomeHTML(params: WelcomeEmailParams): string {
  const { displayName, dashboardLink, language } = params;

  const content = {
    en: {
      greeting: `Welcome to Gentil Feedback, ${displayName}!`,
      intro: 'We\'re excited to have you on board. Gentil Feedback is your platform to share feedback, influence product development, and participate in user research at Club Med.',
      feature1Title: 'Share Feedback',
      feature1Text: 'Submit ideas and suggestions to help improve our products and services.',
      feature2Title: 'Vote on Ideas',
      feature2Text: 'Support feedback from other team members to help prioritize development.',
      feature3Title: 'Track Progress',
      feature3Text: 'Follow the roadmap to see what we\'re building and when it\'s coming.',
      feature4Title: 'Join Research',
      feature4Text: 'Participate in questionnaires and user testing sessions to shape our products.',
      ctaButton: 'Go to Dashboard',
      footer: 'If you have any questions, please don\'t hesitate to reach out to the product team.',
      footerNote: 'This is an automated message from Gentil Feedback.',
    },
    fr: {
      greeting: `Bienvenue sur Gentil Feedback, ${displayName} !`,
      intro: 'Nous sommes ravis de vous accueillir. Gentil Feedback est votre plateforme pour partager des retours, influencer le développement produit et participer à la recherche utilisateur chez Club Med.',
      feature1Title: 'Partager vos retours',
      feature1Text: 'Soumettez des idées et suggestions pour améliorer nos produits et services.',
      feature2Title: 'Voter sur les idées',
      feature2Text: 'Soutenez les retours d\'autres membres de l\'équipe pour aider à prioriser le développement.',
      feature3Title: 'Suivre la progression',
      feature3Text: 'Consultez la feuille de route pour voir ce que nous construisons et quand cela arrive.',
      feature4Title: 'Participer à la recherche',
      feature4Text: 'Participez aux questionnaires et sessions de test utilisateur pour façonner nos produits.',
      ctaButton: 'Aller au tableau de bord',
      footer: 'Si vous avez des questions, n\'hésitez pas à contacter l\'équipe produit.',
      footerNote: 'Ceci est un message automatique de Gentil Feedback.',
    },
  };

  const t = content[language];

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Gentil Feedback</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header with Club Med colors -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%); padding: 40px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ${t.greeting}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 24px;">
                ${t.intro}
              </p>

              <!-- Features grid -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 30px;">
                <tr>
                  <td style="padding: 0 10px 20px 0; vertical-align: top; width: 50%;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; height: 100%;">
                      <div style="font-size: 24px; margin-bottom: 10px;">💡</div>
                      <h3 style="margin: 0 0 8px; color: #0066CC; font-size: 16px; font-weight: 600;">
                        ${t.feature1Title}
                      </h3>
                      <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px;">
                        ${t.feature1Text}
                      </p>
                    </div>
                  </td>
                  <td style="padding: 0 0 20px 10px; vertical-align: top; width: 50%;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; height: 100%;">
                      <div style="font-size: 24px; margin-bottom: 10px;">👍</div>
                      <h3 style="margin: 0 0 8px; color: #0066CC; font-size: 16px; font-weight: 600;">
                        ${t.feature2Title}
                      </h3>
                      <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px;">
                        ${t.feature2Text}
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 10px 0 0; vertical-align: top; width: 50%;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; height: 100%;">
                      <div style="font-size: 24px; margin-bottom: 10px;">🗺️</div>
                      <h3 style="margin: 0 0 8px; color: #0066CC; font-size: 16px; font-weight: 600;">
                        ${t.feature3Title}
                      </h3>
                      <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px;">
                        ${t.feature3Text}
                      </p>
                    </div>
                  </td>
                  <td style="padding: 0 0 0 10px; vertical-align: top; width: 50%;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; height: 100%;">
                      <div style="font-size: 24px; margin-bottom: 10px;">🔬</div>
                      <h3 style="margin: 0 0 8px; color: #0066CC; font-size: 16px; font-weight: 600;">
                        ${t.feature4Title}
                      </h3>
                      <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px;">
                        ${t.feature4Text}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${dashboardLink}" style="display: inline-block; background-color: #0066CC; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
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
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 18px; text-align: center;">
                ${t.footerNote}
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
 * Generate plain text email for welcome message
 */
export function generateWelcomeText(params: WelcomeEmailParams): string {
  const { displayName, dashboardLink, language } = params;

  const content = {
    en: {
      greeting: `Welcome to Gentil Feedback, ${displayName}!`,
      intro: 'We\'re excited to have you on board. Gentil Feedback is your platform to share feedback, influence product development, and participate in user research at Club Med.',
      feature1: '💡 Share Feedback - Submit ideas and suggestions to help improve our products and services.',
      feature2: '👍 Vote on Ideas - Support feedback from other team members to help prioritize development.',
      feature3: '🗺️ Track Progress - Follow the roadmap to see what we\'re building and when it\'s coming.',
      feature4: '🔬 Join Research - Participate in questionnaires and user testing sessions to shape our products.',
      ctaLabel: 'Go to your dashboard:',
      footer: 'If you have any questions, please don\'t hesitate to reach out to the product team.',
      footerNote: 'This is an automated message from Gentil Feedback.',
    },
    fr: {
      greeting: `Bienvenue sur Gentil Feedback, ${displayName} !`,
      intro: 'Nous sommes ravis de vous accueillir. Gentil Feedback est votre plateforme pour partager des retours, influencer le développement produit et participer à la recherche utilisateur chez Club Med.',
      feature1: '💡 Partager vos retours - Soumettez des idées et suggestions pour améliorer nos produits et services.',
      feature2: '👍 Voter sur les idées - Soutenez les retours d\'autres membres de l\'équipe pour aider à prioriser le développement.',
      feature3: '🗺️ Suivre la progression - Consultez la feuille de route pour voir ce que nous construisons et quand cela arrive.',
      feature4: '🔬 Participer à la recherche - Participez aux questionnaires et sessions de test utilisateur pour façonner nos produits.',
      ctaLabel: 'Aller à votre tableau de bord :',
      footer: 'Si vous avez des questions, n\'hésitez pas à contacter l\'équipe produit.',
      footerNote: 'Ceci est un message automatique de Gentil Feedback.',
    },
  };

  const t = content[language];

  return `
${t.greeting}

${t.intro}

${t.feature1}

${t.feature2}

${t.feature3}

${t.feature4}

${t.ctaLabel}
${dashboardLink}

${t.footer}

---
${t.footerNote}
  `.trim();
}
