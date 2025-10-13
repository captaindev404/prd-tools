/**
 * Seed script for gamification data
 * Run with: npx tsx prisma/seed-gamification.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BADGES = [
  // Feedback badges
  {
    key: 'feedback_bronze',
    name: 'Feedback Contributor',
    description: 'Submitted 10 feedback items',
    tier: 'bronze',
    category: 'feedback',
    requirement: 10,
    points: 50,
  },
  {
    key: 'feedback_silver',
    name: 'Feedback Champion',
    description: 'Submitted 50 feedback items',
    tier: 'silver',
    category: 'feedback',
    requirement: 50,
    points: 200,
  },
  {
    key: 'feedback_gold',
    name: 'Feedback Expert',
    description: 'Submitted 100 feedback items',
    tier: 'gold',
    category: 'feedback',
    requirement: 100,
    points: 500,
  },
  {
    key: 'feedback_platinum',
    name: 'Feedback Legend',
    description: 'Submitted 500 feedback items',
    tier: 'platinum',
    category: 'feedback',
    requirement: 500,
    points: 2000,
  },

  // Voting badges
  {
    key: 'voting_bronze',
    name: 'Active Voter',
    description: 'Voted on 10 feedback items',
    tier: 'bronze',
    category: 'voting',
    requirement: 10,
    points: 30,
  },
  {
    key: 'voting_silver',
    name: 'Community Voice',
    description: 'Voted on 50 feedback items',
    tier: 'silver',
    category: 'voting',
    requirement: 50,
    points: 150,
  },
  {
    key: 'voting_gold',
    name: 'Voting Expert',
    description: 'Voted on 100 feedback items',
    tier: 'gold',
    category: 'voting',
    requirement: 100,
    points: 300,
  },
  {
    key: 'voting_platinum',
    name: 'Voting Legend',
    description: 'Voted on 500 feedback items',
    tier: 'platinum',
    category: 'voting',
    requirement: 500,
    points: 1000,
  },

  // Research badges
  {
    key: 'research_bronze',
    name: 'Research Participant',
    description: 'Participated in 10 research activities',
    tier: 'bronze',
    category: 'research',
    requirement: 10,
    points: 100,
  },
  {
    key: 'research_silver',
    name: 'Research Contributor',
    description: 'Participated in 50 research activities',
    tier: 'silver',
    category: 'research',
    requirement: 50,
    points: 400,
  },
  {
    key: 'research_gold',
    name: 'Research Expert',
    description: 'Participated in 100 research activities',
    tier: 'gold',
    category: 'research',
    requirement: 100,
    points: 800,
  },
  {
    key: 'research_platinum',
    name: 'Research Legend',
    description: 'Participated in 500 research activities',
    tier: 'platinum',
    category: 'research',
    requirement: 500,
    points: 3000,
  },

  // Engagement badges
  {
    key: 'engagement_bronze',
    name: 'Community Member',
    description: 'Engaged with platform 10 times',
    tier: 'bronze',
    category: 'engagement',
    requirement: 10,
    points: 25,
  },
  {
    key: 'engagement_silver',
    name: 'Active Community Member',
    description: 'Engaged with platform 50 times',
    tier: 'silver',
    category: 'engagement',
    requirement: 50,
    points: 100,
  },
  {
    key: 'engagement_gold',
    name: 'Community Leader',
    description: 'Engaged with platform 100 times',
    tier: 'gold',
    category: 'engagement',
    requirement: 100,
    points: 250,
  },
  {
    key: 'engagement_platinum',
    name: 'Community Champion',
    description: 'Engaged with platform 500 times',
    tier: 'platinum',
    category: 'engagement',
    requirement: 500,
    points: 1500,
  },
];

const ACHIEVEMENTS = [
  // Streak achievements
  {
    key: 'streak_7day',
    name: '7-Day Streak',
    description: 'Engaged with the platform for 7 consecutive days',
    category: 'streak',
    requirement: JSON.stringify({ consecutiveDays: 7 }),
    points: 100,
    hidden: false,
  },
  {
    key: 'streak_30day',
    name: '30-Day Streak',
    description: 'Engaged with the platform for 30 consecutive days',
    category: 'streak',
    requirement: JSON.stringify({ consecutiveDays: 30 }),
    points: 500,
    hidden: false,
  },
  {
    key: 'streak_100day',
    name: '100-Day Streak',
    description: 'Engaged with the platform for 100 consecutive days',
    category: 'streak',
    requirement: JSON.stringify({ consecutiveDays: 100 }),
    points: 2000,
    hidden: false,
  },

  // Milestone achievements
  {
    key: 'milestone_level5',
    name: 'Level 5 Reached',
    description: 'Reached Level 5',
    category: 'milestone',
    requirement: JSON.stringify({ level: 5 }),
    points: 200,
    hidden: false,
  },
  {
    key: 'milestone_level10',
    name: 'Level 10 Reached',
    description: 'Reached Level 10',
    category: 'milestone',
    requirement: JSON.stringify({ level: 10 }),
    points: 500,
    hidden: false,
  },
  {
    key: 'milestone_1000points',
    name: 'Point Master',
    description: 'Earned 1,000 total points',
    category: 'milestone',
    requirement: JSON.stringify({ totalPoints: 1000 }),
    points: 250,
    hidden: false,
  },
  {
    key: 'milestone_10000points',
    name: 'Point Legend',
    description: 'Earned 10,000 total points',
    category: 'milestone',
    requirement: JSON.stringify({ totalPoints: 10000 }),
    points: 1000,
    hidden: false,
  },

  // Special achievements
  {
    key: 'special_first_feedback',
    name: 'First Steps',
    description: 'Submitted your first feedback',
    category: 'special',
    requirement: JSON.stringify({ feedbackCount: 1 }),
    points: 25,
    hidden: false,
  },
  {
    key: 'special_first_vote',
    name: 'Voice Heard',
    description: 'Cast your first vote',
    category: 'special',
    requirement: JSON.stringify({ voteCount: 1 }),
    points: 10,
    hidden: false,
  },
  {
    key: 'special_first_questionnaire',
    name: 'Research Pioneer',
    description: 'Completed your first questionnaire',
    category: 'special',
    requirement: JSON.stringify({ questionnaireCount: 1 }),
    points: 50,
    hidden: false,
  },
  {
    key: 'special_early_adopter',
    name: 'Early Adopter',
    description: 'One of the first 100 users on the platform',
    category: 'special',
    requirement: JSON.stringify({ earlyUser: true }),
    points: 100,
    hidden: true,
  },
  {
    key: 'special_all_badges',
    name: 'Badge Collector',
    description: 'Earned all available badges',
    category: 'special',
    requirement: JSON.stringify({ allBadges: true }),
    points: 1000,
    hidden: true,
  },
];

async function main() {
  console.log('Seeding gamification data...');

  // Seed badges
  console.log('Seeding badges...');
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      create: badge,
      update: badge,
    });
    console.log(`  ✓ ${badge.name}`);
  }

  // Seed achievements
  console.log('\nSeeding achievements...');
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      create: achievement,
      update: achievement,
    });
    console.log(`  ✓ ${achievement.name}`);
  }

  console.log('\n✅ Gamification data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding gamification data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
