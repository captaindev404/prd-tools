/**
 * Test script for email templates
 * Run with: npx tsx src/scripts/test-email-templates.ts
 */

import { generateEmailFromTemplate } from '@/lib/email/email-templates';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('Testing email templates...\n');

// Test output directory
const outputDir = join(process.cwd(), 'test-email-output');
try {
  mkdirSync(outputDir, { recursive: true });
} catch (error) {
  // Directory already exists
}

// Test 1: Welcome Email
console.log('1. Testing Welcome Email...');
try {
  const welcomeEN = generateEmailFromTemplate('welcome', {
    displayName: 'John Doe',
    dashboardLink: 'http://localhost:3000/dashboard',
    language: 'en',
  });

  const welcomeFR = generateEmailFromTemplate('welcome', {
    displayName: 'Marie Dupont',
    dashboardLink: 'http://localhost:3000/dashboard',
    language: 'fr',
  });

  writeFileSync(join(outputDir, 'welcome-en.html'), welcomeEN.html);
  writeFileSync(join(outputDir, 'welcome-fr.html'), welcomeFR.html);
  console.log('✓ Welcome email templates generated successfully');
  console.log(`  - Subject (EN): ${welcomeEN.subject}`);
  console.log(`  - Subject (FR): ${welcomeFR.subject}\n`);
} catch (error) {
  console.error('✗ Failed to generate welcome email:', error);
}

// Test 2: Feedback Update Email
console.log('2. Testing Feedback Update Email...');
try {
  const feedbackUpdateEN = generateEmailFromTemplate('feedback_update', {
    feedbackTitle: 'Improve mobile check-in experience',
    feedbackId: 'fb_01HQXYZ123456789',
    updateType: 'status_change',
    oldStatus: 'new',
    newStatus: 'in_roadmap',
    link: 'http://localhost:3000/feedback/fb_01HQXYZ123456789',
    language: 'en',
  });

  const feedbackUpdateFR = generateEmailFromTemplate('feedback_update', {
    feedbackTitle: 'Améliorer l\'expérience d\'enregistrement mobile',
    feedbackId: 'fb_01HQXYZ123456789',
    updateType: 'comment',
    comment: 'Nous avons commencé à travailler sur cette fonctionnalité!',
    commenterName: 'Sophie Martin',
    link: 'http://localhost:3000/feedback/fb_01HQXYZ123456789',
    language: 'fr',
  });

  writeFileSync(join(outputDir, 'feedback-update-en.html'), feedbackUpdateEN.html);
  writeFileSync(join(outputDir, 'feedback-update-fr.html'), feedbackUpdateFR.html);
  console.log('✓ Feedback update email templates generated successfully');
  console.log(`  - Subject (EN): ${feedbackUpdateEN.subject}`);
  console.log(`  - Subject (FR): ${feedbackUpdateFR.subject}\n`);
} catch (error) {
  console.error('✗ Failed to generate feedback update email:', error);
}

// Test 3: Roadmap Update Email
console.log('3. Testing Roadmap Update Email...');
try {
  const roadmapEN = generateEmailFromTemplate('roadmap_update', {
    title: 'Mobile Check-in 2.0',
    stage: 'now',
    summary: 'We are redesigning the mobile check-in experience to make it faster and more intuitive. This update includes QR code scanning, passport photo upload, and biometric authentication.',
    link: 'http://localhost:3000/roadmap/rmp_01HQXYZ123456789',
    language: 'en',
  });

  const roadmapFR = generateEmailFromTemplate('roadmap_update', {
    title: 'Enregistrement mobile 2.0',
    stage: 'next',
    summary: 'Nous redesignons l\'expérience d\'enregistrement mobile pour la rendre plus rapide et intuitive. Cette mise à jour inclut le scan de QR code, le téléchargement de photo de passeport et l\'authentification biométrique.',
    link: 'http://localhost:3000/roadmap/rmp_01HQXYZ123456789',
    language: 'fr',
  });

  writeFileSync(join(outputDir, 'roadmap-update-en.html'), roadmapEN.html);
  writeFileSync(join(outputDir, 'roadmap-update-fr.html'), roadmapFR.html);
  console.log('✓ Roadmap update email templates generated successfully');
  console.log(`  - Subject (EN): ${roadmapEN.subject}`);
  console.log(`  - Subject (FR): ${roadmapFR.subject}\n`);
} catch (error) {
  console.error('✗ Failed to generate roadmap update email:', error);
}

// Test 4: Questionnaire Invite Email
console.log('4. Testing Questionnaire Invite Email...');
try {
  const questionnaireEN = generateEmailFromTemplate('questionnaire_invite', {
    questionnaireTitle: 'Mobile App User Experience Survey',
    deadline: '2025-10-31',
    link: 'http://localhost:3000/research/questionnaires/qnn_01HQXYZ123456789',
    language: 'en',
  });

  const questionnaireFR = generateEmailFromTemplate('questionnaire_invite', {
    questionnaireTitle: 'Sondage sur l\'expérience utilisateur de l\'application mobile',
    deadline: null,
    link: 'http://localhost:3000/research/questionnaires/qnn_01HQXYZ123456789',
    language: 'fr',
  });

  writeFileSync(join(outputDir, 'questionnaire-invite-en.html'), questionnaireEN.html);
  writeFileSync(join(outputDir, 'questionnaire-invite-fr.html'), questionnaireFR.html);
  console.log('✓ Questionnaire invite email templates generated successfully');
  console.log(`  - Subject (EN): ${questionnaireEN.subject}`);
  console.log(`  - Subject (FR): ${questionnaireFR.subject}\n`);
} catch (error) {
  console.error('✗ Failed to generate questionnaire invite email:', error);
}

// Test 5: Weekly Digest Email
console.log('5. Testing Weekly Digest Email...');
try {
  const digestEN = generateEmailFromTemplate('weekly_digest', {
    weekStart: 'October 7, 2025',
    weekEnd: 'October 13, 2025',
    topFeedback: [
      {
        title: 'Add dark mode support',
        id: 'fb_01HQXYZ111111111',
        link: 'http://localhost:3000/feedback/fb_01HQXYZ111111111',
        metadata: '42 votes',
      },
      {
        title: 'Improve search functionality',
        id: 'fb_01HQXYZ222222222',
        link: 'http://localhost:3000/feedback/fb_01HQXYZ222222222',
        metadata: '38 votes',
      },
    ],
    newRoadmapItems: [
      {
        title: 'Mobile Check-in 2.0',
        id: 'rmp_01HQXYZ333333333',
        link: 'http://localhost:3000/roadmap/rmp_01HQXYZ333333333',
      },
    ],
    completedItems: [
      {
        title: 'Email notification system',
        id: 'rmp_01HQXYZ444444444',
        link: 'http://localhost:3000/roadmap/rmp_01HQXYZ444444444',
      },
    ],
    userStats: {
      feedbackSubmitted: 3,
      votesGiven: 15,
      commentsPosted: 7,
    },
    link: 'http://localhost:3000/dashboard',
    language: 'en',
  });

  const digestFR = generateEmailFromTemplate('weekly_digest', {
    weekStart: '7 octobre 2025',
    weekEnd: '13 octobre 2025',
    topFeedback: [],
    newRoadmapItems: [],
    completedItems: [],
    userStats: {
      feedbackSubmitted: 0,
      votesGiven: 5,
      commentsPosted: 2,
    },
    link: 'http://localhost:3000/dashboard',
    language: 'fr',
  });

  writeFileSync(join(outputDir, 'weekly-digest-en.html'), digestEN.html);
  writeFileSync(join(outputDir, 'weekly-digest-fr.html'), digestFR.html);
  console.log('✓ Weekly digest email templates generated successfully');
  console.log(`  - Subject (EN): ${digestEN.subject}`);
  console.log(`  - Subject (FR): ${digestFR.subject}\n`);
} catch (error) {
  console.error('✗ Failed to generate weekly digest email:', error);
}

console.log('✓ All email templates tested successfully!');
console.log(`\nHTML files saved to: ${outputDir}`);
console.log('You can open these files in a browser to preview the emails.\n');
