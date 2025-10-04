import { PrismaClient, Role, ProductArea, FeatureStatus, FeedbackState, Source, Visibility, ModerationStatus, RoadmapStage, SessionType } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.event.deleteMany();
  await prisma.questionnaireResponse.deleteMany();
  await prisma.questionnaire.deleteMany();
  await prisma.session.deleteMany();
  await prisma.panelMembership.deleteMany();
  await prisma.panel.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.roadmapItem.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.user.deleteMany();
  await prisma.village.deleteMany();

  console.log('🧹 Cleaned existing data');

  // ========== 1. CREATE VILLAGE ==========
  const village = await prisma.village.create({
    data: {
      id: 'vlg-001',
      name: 'La Rosière',
    },
  });
  console.log('✅ Created village:', village.name);

  // ========== 2. CREATE USERS ==========
  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        id: `usr_${ulid()}`,
        employeeId: 'E123456',
        email: 'admin@dev.local',
        displayName: 'Admin Dev',
        role: Role.ADMIN,
        currentVillageId: village.id,
        consents: JSON.stringify(['research_contact', 'email_updates', 'usage_analytics']),
        villageHistory: JSON.stringify([
          { village_id: 'vlg-001', from: '2024-01-01', to: null }
        ]),
      },
    }),
    // Moderator user
    prisma.user.create({
      data: {
        id: `usr_${ulid()}`,
        employeeId: 'E123457',
        email: 'moderator@dev.local',
        displayName: 'Moderator Dev',
        role: Role.MODERATOR,
        currentVillageId: village.id,
        consents: JSON.stringify(['email_updates', 'usage_analytics']),
        villageHistory: JSON.stringify([
          { village_id: 'vlg-001', from: '2024-01-01', to: null }
        ]),
      },
    }),
    // Product Manager
    prisma.user.create({
      data: {
        id: `usr_${ulid()}`,
        employeeId: 'E234567',
        email: 'pm@dev.local',
        displayName: 'PM Dev',
        role: Role.PM,
        currentVillageId: village.id,
        consents: JSON.stringify(['email_updates', 'usage_analytics']),
        villageHistory: JSON.stringify([
          { village_id: 'vlg-001', from: '2023-06-01', to: null }
        ]),
      },
    }),
    // Product Owner
    prisma.user.create({
      data: {
        id: `usr_${ulid()}`,
        employeeId: 'E234568',
        email: 'po@dev.local',
        displayName: 'PO Dev',
        role: Role.PO,
        currentVillageId: village.id,
        consents: JSON.stringify(['email_updates', 'usage_analytics']),
        villageHistory: JSON.stringify([
          { village_id: 'vlg-001', from: '2023-06-01', to: null }
        ]),
      },
    }),
    // Researcher
    prisma.user.create({
      data: {
        id: `usr_${ulid()}`,
        employeeId: 'E345678',
        email: 'researcher@dev.local',
        displayName: 'Researcher Dev',
        role: Role.RESEARCHER,
        currentVillageId: village.id,
        consents: JSON.stringify(['research_contact', 'email_updates', 'usage_analytics']),
        villageHistory: JSON.stringify([
          { village_id: 'vlg-001', from: '2024-03-15', to: null }
        ]),
      },
    }),
    // Regular users
    prisma.user.create({
      data: {
        id: `usr_${ulid()}`,
        employeeId: 'E456789',
        email: 'user@dev.local',
        displayName: 'User Dev',
        role: Role.USER,
        currentVillageId: village.id,
        consents: JSON.stringify(['research_contact', 'usage_analytics']),
        villageHistory: JSON.stringify([
          { village_id: 'vlg-001', from: '2024-05-01', to: null }
        ]),
      },
    }),
    prisma.user.create({
      data: {
        id: `usr_${ulid()}`,
        employeeId: 'E567890',
        email: 'user2@dev.local',
        displayName: 'User2 Dev',
        role: Role.USER,
        currentVillageId: village.id,
        consents: JSON.stringify(['email_updates']),
        villageHistory: JSON.stringify([
          { village_id: 'vlg-001', from: '2024-02-10', to: null }
        ]),
      },
    }),
  ]);
  console.log('✅ Created', users.length, 'users');

  const [admin, moderator, pm, po, researcher, user1, user2] = users;

  // ========== 3. CREATE FEATURES ==========
  const features = await Promise.all([
    prisma.feature.create({
      data: {
        id: 'feat-checkin-mobile',
        title: 'Mobile Check-in',
        area: ProductArea.CheckIn,
        status: FeatureStatus.generally_available,
        tags: JSON.stringify(['rx', 'guest-experience']),
        description: 'Allow guests to check in via mobile app',
      },
    }),
    prisma.feature.create({
      data: {
        id: 'feat-kiosk-passport-scan',
        title: 'Kiosk Passport Scanner',
        area: ProductArea.CheckIn,
        status: FeatureStatus.in_progress,
        tags: JSON.stringify(['automation', 'queue-reduction']),
        description: 'Automated passport scanning at check-in kiosks',
      },
    }),
    prisma.feature.create({
      data: {
        id: 'feat-payment-split',
        title: 'Split Payment Support',
        area: ProductArea.Payments,
        status: FeatureStatus.discovery,
        tags: JSON.stringify(['payments', 'flexibility']),
        description: 'Allow splitting bills across multiple payment methods',
      },
    }),
    prisma.feature.create({
      data: {
        id: 'feat-housekeeping-schedule',
        title: 'Housekeeping Schedule Preferences',
        area: ProductArea.Housekeeping,
        status: FeatureStatus.shaping,
        tags: JSON.stringify(['guest-preferences', 'efficiency']),
        description: 'Let guests set preferred housekeeping times',
      },
    }),
    prisma.feature.create({
      data: {
        id: 'feat-reservation-modify',
        title: 'Self-Service Reservation Modifications',
        area: ProductArea.Reservations,
        status: FeatureStatus.idea,
        tags: JSON.stringify(['self-service', 'flexibility']),
        description: 'Allow guests to modify their own reservations within constraints',
      },
    }),
  ]);
  console.log('✅ Created', features.length, 'features');

  const [mobileCheckin, kioskPassport, splitPayment, housekeepingSchedule, reservationModify] = features;

  // ========== 4. CREATE FEEDBACK ==========
  const feedbacks = await Promise.all([
    prisma.feedback.create({
      data: {
        id: `fb_${ulid()}`,
        authorId: user1.id,
        title: 'Add passport scan at kiosk',
        body: 'Would reduce queue time significantly. Currently we have to manually type in passport details which is time-consuming and error-prone.',
        featureId: kioskPassport.id,
        villageId: village.id,
        visibility: Visibility.public,
        source: Source.app,
        state: FeedbackState.in_roadmap,
        moderationStatus: ModerationStatus.approved,
        moderationSignals: JSON.stringify([]),
        editWindowEndsAt: new Date(Date.now() - 1000 * 60 * 60), // expired
      },
    }),
    prisma.feedback.create({
      data: {
        id: `fb_${ulid()}`,
        authorId: user2.id,
        title: 'Mobile check-in not working on iOS 17',
        body: 'The app crashes when I try to complete check-in on my iPhone 15 Pro. Running iOS 17.2.',
        featureId: mobileCheckin.id,
        villageId: village.id,
        visibility: Visibility.public,
        source: Source.app,
        state: FeedbackState.triaged,
        moderationStatus: ModerationStatus.approved,
        moderationSignals: JSON.stringify([]),
        editWindowEndsAt: new Date(Date.now() + 1000 * 60 * 10), // 10 min left
      },
    }),
    prisma.feedback.create({
      data: {
        id: `fb_${ulid()}`,
        authorId: user1.id,
        title: 'Split payment between credit cards',
        body: 'Would like to split final bill 50/50 between two different credit cards for accounting purposes.',
        featureId: splitPayment.id,
        villageId: village.id,
        visibility: Visibility.public,
        source: Source.web,
        state: FeedbackState.new,
        moderationStatus: ModerationStatus.approved,
        moderationSignals: JSON.stringify([]),
        editWindowEndsAt: new Date(Date.now() + 1000 * 60 * 15), // full 15 min
      },
    }),
    prisma.feedback.create({
      data: {
        id: `fb_${ulid()}`,
        authorId: pm.id,
        title: 'Guest feedback: need flexible housekeeping times',
        body: 'Multiple guests have requested ability to set preferred housekeeping schedule. Currently causes conflicts when guests are working in room.',
        featureId: housekeepingSchedule.id,
        villageId: village.id,
        visibility: Visibility.internal,
        source: Source.support,
        state: FeedbackState.triaged,
        moderationStatus: ModerationStatus.approved,
        moderationSignals: JSON.stringify([]),
      },
    }),
    prisma.feedback.create({
      data: {
        id: `fb_${ulid()}`,
        authorId: user2.id,
        title: 'Allow date changes without calling support',
        body: 'Had to call support to change my reservation dates. Would be much easier to do this self-service in the app.',
        featureId: reservationModify.id,
        villageId: village.id,
        visibility: Visibility.public,
        source: Source.app,
        state: FeedbackState.new,
        moderationStatus: ModerationStatus.approved,
        moderationSignals: JSON.stringify([]),
      },
    }),
    prisma.feedback.create({
      data: {
        id: `fb_${ulid()}`,
        authorId: user1.id,
        title: 'Passport scanner would be great',
        body: 'Automatic passport scanning at check-in would speed things up.',
        featureId: kioskPassport.id,
        villageId: village.id,
        visibility: Visibility.public,
        source: Source.kiosk,
        state: FeedbackState.merged,
        moderationStatus: ModerationStatus.approved,
        moderationSignals: JSON.stringify([]),
        duplicateOfId: null, // Will set this to first feedback after creation
      },
    }),
  ]);
  console.log('✅ Created', feedbacks.length, 'feedback items');

  // Mark last feedback as duplicate of first
  await prisma.feedback.update({
    where: { id: feedbacks[5].id },
    data: { duplicateOfId: feedbacks[0].id },
  });
  console.log('✅ Marked duplicate feedback');

  // ========== 5. CREATE VOTES ==========
  const votes = await Promise.all([
    // Votes on passport scanner feedback
    prisma.vote.create({
      data: {
        feedbackId: feedbacks[0].id,
        userId: user1.id,
        weight: 1.0,
        decayedWeight: 1.0,
      },
    }),
    prisma.vote.create({
      data: {
        feedbackId: feedbacks[0].id,
        userId: user2.id,
        weight: 1.0,
        decayedWeight: 1.0,
      },
    }),
    prisma.vote.create({
      data: {
        feedbackId: feedbacks[0].id,
        userId: pm.id,
        weight: 2.0, // PM has higher weight
        decayedWeight: 2.0,
      },
    }),
    // Votes on iOS bug
    prisma.vote.create({
      data: {
        feedbackId: feedbacks[1].id,
        userId: user1.id,
        weight: 1.0,
        decayedWeight: 1.0,
      },
    }),
    // Votes on split payment
    prisma.vote.create({
      data: {
        feedbackId: feedbacks[2].id,
        userId: user1.id,
        weight: 1.0,
        decayedWeight: 1.0,
      },
    }),
    prisma.vote.create({
      data: {
        feedbackId: feedbacks[2].id,
        userId: user2.id,
        weight: 1.0,
        decayedWeight: 1.0,
      },
    }),
  ]);
  console.log('✅ Created', votes.length, 'votes');

  // ========== 6. CREATE ROADMAP ITEMS ==========
  const roadmapItems = await Promise.all([
    prisma.roadmapItem.create({
      data: {
        id: `rmp_${ulid()}`,
        title: 'Faster Arrival Flow',
        stage: RoadmapStage.next,
        description: 'Streamline check-in process with automated passport scanning and mobile integration',
        jiraTickets: JSON.stringify(['ODYS-2142', 'ODYS-2143']),
        figmaLinks: JSON.stringify(['https://figma.com/file/abc123']),
        commsCadence: 'monthly',
        commsChannels: JSON.stringify(['in-app', 'email']),
        commsAudience: JSON.stringify({
          villages: ['all'],
          roles: ['USER'],
          languages: ['fr', 'en']
        }),
        successCriteria: JSON.stringify([
          'reduce_checkin_time_lt_2min',
          'nps_area>=+30'
        ]),
        guardrails: JSON.stringify([
          'error_rate<0.5%',
          'perf_p95<800ms'
        ]),
        createdBy: {
          connect: { id: pm.id }
        },
      },
    }),
    prisma.roadmapItem.create({
      data: {
        id: `rmp_${ulid()}`,
        title: 'Flexible Payment Options',
        stage: RoadmapStage.later,
        description: 'Support split payments and multiple payment methods',
        jiraTickets: JSON.stringify(['ODYS-3001']),
        figmaLinks: JSON.stringify([]),
        commsCadence: 'ad_hoc',
        commsChannels: JSON.stringify(['in-app']),
        commsAudience: JSON.stringify({
          villages: ['all'],
          roles: ['USER'],
          languages: ['all']
        }),
        successCriteria: JSON.stringify([
          'support_multi_payment_methods',
          'reduce_payment_support_calls_50_percent'
        ]),
        guardrails: JSON.stringify([
          'payment_failure_rate<1%'
        ]),
        createdBy: {
          connect: { id: pm.id }
        },
      },
    }),
  ]);
  console.log('✅ Created', roadmapItems.length, 'roadmap items');

  // ========== 7. CREATE RESEARCH PANEL ==========
  const panel = await prisma.panel.create({
    data: {
      id: `pan_${ulid()}`,
      name: 'Reception Core Panel',
      eligibilityRules: JSON.stringify({
        include_roles: ['USER'],
        include_villages: ['all'],
        required_consents: ['research_contact']
      }),
      sizeTarget: 150,
      quotas: JSON.stringify([
        {
          key: 'village_id',
          distribution: 'proportional'
        }
      ]),
      createdBy: { connect: { id: researcher.id } },
    },
  });
  console.log('✅ Created panel:', panel.name);

  // Add panel memberships (only users with research_contact consent)
  await Promise.all([
    prisma.panelMembership.create({
      data: {
        panelId: panel.id,
        userId: user1.id,
        active: true,
      },
    }),
    prisma.panelMembership.create({
      data: {
        panelId: panel.id,
        userId: researcher.id,
        active: true,
      },
    }),
    prisma.panelMembership.create({
      data: {
        panelId: panel.id,
        userId: admin.id,
        active: true,
      },
    }),
  ]);
  console.log('✅ Created panel memberships');

  // ========== 8. CREATE QUESTIONNAIRE ==========
  const questionnaire = await prisma.questionnaire.create({
    data: {
      id: `qnn_${ulid()}`,
      title: 'Check-in Satisfaction Survey',
      version: '1.0.0',
      questions: JSON.stringify([
        {
          id: 'nps',
          type: 'nps',
          text: {
            en: 'How likely are you to recommend our check-in process?',
            fr: 'Recommanderiez-vous notre processus d\'enregistrement ?'
          },
          scale: '0-10',
          required: true
        },
        {
          id: 'pain_points',
          type: 'text',
          text: {
            en: 'What could we improve about check-in?',
            fr: 'Que pourrions-nous améliorer concernant l\'enregistrement ?'
          },
          required: false
        },
        {
          id: 'satisfaction',
          type: 'likert',
          text: {
            en: 'How satisfied are you with the check-in speed?',
            fr: 'Êtes-vous satisfait de la rapidité de l\'enregistrement ?'
          },
          scale: '1-5',
          required: true
        }
      ]),
      adHocFilters: JSON.stringify({
        villages: ['vlg-001'],
        features_interacted: ['feat-checkin-mobile']
      }),
      deliveryMode: JSON.stringify(['in-app']),
      startAt: new Date('2025-10-10T09:00:00Z'),
      endAt: new Date('2025-11-10T17:00:00Z'),
      maxResponses: 1000,
      aggregateExports: JSON.stringify(['csv', 'parquet']),
      piiIncluded: false,
      createdBy: {
        connect: { id: researcher.id }
      },
    },
  });
  console.log('✅ Created questionnaire:', questionnaire.title);

  // Add some responses
  await Promise.all([
    prisma.questionnaireResponse.create({
      data: {
        questionnaireId: questionnaire.id,
        respondentId: user1.id,
        answers: JSON.stringify({
          nps: 9,
          pain_points: 'Sometimes the app is slow to load',
          satisfaction: 4
        }),
        scoreMap: JSON.stringify({
          nps_score: 9,
          satisfaction_score: 4
        }),
      },
    }),
    prisma.questionnaireResponse.create({
      data: {
        questionnaireId: questionnaire.id,
        respondentId: user2.id,
        answers: JSON.stringify({
          nps: 7,
          pain_points: '',
          satisfaction: 3
        }),
        scoreMap: JSON.stringify({
          nps_score: 7,
          satisfaction_score: 3
        }),
      },
    }),
  ]);
  console.log('✅ Created questionnaire responses');

  // ========== 9. CREATE RESEARCH SESSION ==========
  const session = await prisma.session.create({
    data: {
      id: `ses_${ulid()}`,
      type: SessionType.usability,
      prototypeLink: 'https://figma.com/proto/abc123',
      scheduledAt: new Date('2025-10-15T14:00:00Z'),
      durationMinutes: 60,
      panelId: panel.id,
      participantIds: JSON.stringify([user1.id, user2.id]),
      facilitatorIds: JSON.stringify([researcher.id]),
      minParticipants: 2,
      maxParticipants: 4,
      consentRequired: true,
      recordingEnabled: true,
      recordingStorageDays: 365,
      notesSecure: true,
      status: 'scheduled',
    },
  });
  console.log('✅ Created research session');

  // ========== 10. CREATE EVENTS ==========
  await Promise.all([
    prisma.event.create({
      data: {
        type: 'feedback.created',
        payload: JSON.stringify({
          feedback_id: feedbacks[0].id,
          author_id: user1.id,
          village_id: village.id,
          feature_refs: [kioskPassport.id],
          source: 'app'
        }),
        userId: user1.id,
      },
    }),
    prisma.event.create({
      data: {
        type: 'vote.cast',
        payload: JSON.stringify({
          feedback_id: feedbacks[0].id,
          voter_id: pm.id,
          weight: 2.0
        }),
        userId: pm.id,
      },
    }),
    prisma.event.create({
      data: {
        type: 'roadmap.published',
        payload: JSON.stringify({
          roadmap_item_id: roadmapItems[0].id,
          stage: 'next'
        }),
        userId: pm.id,
      },
    }),
  ]);
  console.log('✅ Created events');

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Villages: 1`);
  console.log(`   - Users: ${users.length} (1 Admin, 1 Moderator, 1 PM, 1 Researcher, 2 Regular users)`);
  console.log(`   - Features: ${features.length}`);
  console.log(`   - Feedback: ${feedbacks.length} (including 1 duplicate)`);
  console.log(`   - Votes: ${votes.length}`);
  console.log(`   - Roadmap Items: ${roadmapItems.length}`);
  console.log(`   - Research Panels: 1`);
  console.log(`   - Panel Memberships: 3`);
  console.log(`   - Questionnaires: 1`);
  console.log(`   - Questionnaire Responses: 2`);
  console.log(`   - Research Sessions: 1`);
  console.log(`   - Events: 3`);
  console.log('\n🔐 Dev Login Credentials (password for all: "dev123"):');
  console.log(`   - admin@dev.local (ADMIN)`);
  console.log(`   - moderator@dev.local (MODERATOR)`);
  console.log(`   - pm@dev.local (PM)`);
  console.log(`   - po@dev.local (PO)`);
  console.log(`   - researcher@dev.local (RESEARCHER)`);
  console.log(`   - user@dev.local (USER)`);
  console.log(`   - user2@dev.local (USER)`);
  console.log('\n🔍 Run "npx prisma studio" to explore the data\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
