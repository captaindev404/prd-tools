# Gentil Feedback User Guide

**Version**: 0.5.0

Welcome to the Gentil Feedback Platform! This guide will help you understand how to use the platform based on your role.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [For All Users](#for-all-users)
4. [For Product Managers](#for-product-managers)
5. [For Researchers](#for-researchers)
6. [For Moderators](#for-moderators)
7. [Common Questions](#common-questions)

---

## Introduction

Gentil Feedback is Club Med's platform for:
- Collecting product feedback from employees
- Prioritizing features through weighted voting
- Communicating roadmap updates
- Conducting user research and testing

Your role determines which features you have access to:

| Role | Capabilities |
|------|-------------|
| **USER** | Submit feedback, vote, view roadmap, join research panels |
| **PM** (Product Manager) | All USER capabilities + manage features, create roadmap items, publish communications |
| **PO** (Product Owner) | Same as PM |
| **RESEARCHER** | All USER capabilities + create panels, questionnaires, schedule sessions |
| **MODERATOR** | All USER capabilities + review flagged content, merge duplicates |
| **ADMIN** | All capabilities + user management, system configuration |

---

## Getting Started

### Sign In

1. Go to the platform URL
2. Click "Sign In"
3. Choose your authentication method:
   - **Azure AD** (for Club Med employees)
   - **Keycloak** (alternative SSO)
4. Enter your credentials
5. You'll be redirected to your dashboard

### First-Time Setup

After your first sign-in:
1. Review your profile information
2. Set your consent preferences:
   - Research contact: Allow researchers to invite you to studies
   - Usage analytics: Help improve the platform
   - Email updates: Receive notifications by email
3. Complete your profile (optional):
   - Upload avatar
   - Add bio
   - Set notification preferences

---

## For All Users

### Submitting Feedback

#### How to Submit

1. Navigate to `/feedback/new` or click "Submit Feedback"
2. Fill in the form:
   - **Title** (required): Brief description (8-120 characters)
   - **Description** (required): Detailed explanation (20-5000 characters)
   - **Feature Area** (optional): Select related product area
   - **Village** (optional): Defaults to your current village
3. Click "Submit"

#### Guidelines

- Be specific and constructive
- One idea per submission
- Check for duplicates before submitting
- Avoid including sensitive information (PII)
- You have 15 minutes to edit after submission

#### What Happens Next

1. Your feedback is automatically checked for:
   - Duplicate submissions
   - Inappropriate content
   - Personally identifiable information (PII)
2. If approved, it appears in the feedback list
3. If flagged, it goes to moderation queue
4. You'll receive notifications about updates

### Viewing Feedback

#### Browse All Feedback

1. Go to `/feedback`
2. Use filters:
   - **State**: New, Triaged, In Roadmap, Closed
   - **Area**: Reservations, Check-in, Payments, etc.
   - **Village**: Filter by village
   - **Sort by**: Date, Votes, Recent activity
3. Click any item to view details

#### Search Feedback

Use the search box to find feedback by:
- Keywords in title
- Keywords in description
- Feature name
- Author name

### Voting on Feedback

#### How to Vote

1. Open any feedback item
2. Click the "Vote" button (thumbs up icon)
3. Your vote is counted with a weighted value
4. You can remove your vote by clicking again

#### Vote Weights

Your vote weight is calculated based on:
- **Role**: USER=1.0, PM=2.0, PO=2.5, RESEARCHER=1.5
- **Panel Membership**: +0.5 if you're in a relevant research panel
- **Village Priority**: Varies by village settings
- **Time Decay**: Votes gradually lose weight over 180 days

Example: A PM's vote starts at 2.0 points. After 180 days, it decays to 1.0 point.

#### Voting Rules

- You can only vote once per feedback item
- No downvoting (only upvotes)
- You can vote on your own feedback
- You can remove your vote at any time

### Viewing the Roadmap

#### Access Roadmap

1. Go to `/roadmap`
2. View items by stage:
   - **Now**: Currently being worked on
   - **Next**: Planned for near future
   - **Later**: Long-term plans
   - **Under Consideration**: Being evaluated

#### Understanding Roadmap Items

Each roadmap item shows:
- **Title & Description**: What's being built
- **Progress**: Completion percentage
- **Target Date**: Expected delivery
- **Linked Feedback**: Related feedback items
- **Features**: Affected product areas
- **Updates**: Communications from product team

### Managing Your Profile

#### Update Profile

1. Go to `/profile`
2. Edit information:
   - Display name
   - Avatar
   - Bio (optional)
3. Click "Save Changes"

#### Manage Consent

1. Go to `/profile` > "Privacy Settings"
2. Toggle consent options:
   - **Research Contact**: Allow researchers to invite you
   - **Usage Analytics**: Anonymous usage tracking
   - **Email Updates**: Receive email notifications
3. Changes take effect immediately

#### Export Your Data

To export all your data (GDPR compliance):
1. Go to `/profile` > "Privacy"
2. Click "Export My Data"
3. Download JSON file with all your:
   - Feedback submissions
   - Votes
   - Questionnaire responses
   - Panel memberships
   - Consent preferences

---

## For Product Managers

### Managing the Feature Catalog

#### Create a Feature

1. Go to `/features` > "New Feature"
2. Fill in details:
   - **Title** (required): Feature name
   - **Description**: What it does
   - **Area** (required): Product area (Check-in, Payments, etc.)
   - **Tags**: Keywords for organization
   - **Status**: idea → discovery → shaping → in_progress → released → GA → deprecated
3. Click "Create Feature"

#### Update Feature Status

1. Open any feature
2. Click "Edit"
3. Update status as work progresses:
   - **Idea**: Initial concept
   - **Discovery**: Researching feasibility
   - **Shaping**: Designing solution
   - **In Progress**: Active development
   - **Released**: Deployed to users
   - **GA**: Generally available
   - **Deprecated**: No longer supported
4. Save changes

#### Link Feedback to Features

1. Open a feedback item
2. Click "Link to Feature"
3. Select the related feature
4. Feedback now appears in feature's linked items

### Creating Roadmap Items

#### Create Roadmap Item

1. Go to `/roadmap/manage` > "New Item"
2. Fill in form:
   - **Title** (required): Clear, descriptive name
   - **Description**: What's being delivered
   - **Stage** (required): now | next | later | under_consideration
   - **Target Date**: Expected completion
   - **Progress**: 0-100%
   - **Visibility**: public (visible to all) or internal (staff only)
3. Link related items:
   - **Features**: Select from catalog
   - **Feedback**: Link canonical feedback
   - **Jira Tickets**: Add ticket IDs (e.g., ODYS-2142)
   - **Figma Links**: Design files
4. Add success criteria:
   - Example: "reduce_checkin_time_lt_2min"
   - Example: "nps_area>=+30"
5. Add guardrails:
   - Example: "error_rate<0.5%"
   - Example: "perf_p95<800ms"
6. Configure communications:
   - **Cadence**: monthly or ad_hoc
   - **Channels**: in-app, email, inbox
   - **Audience**: villages, roles, languages
7. Click "Create"

#### Update Roadmap Progress

1. Open roadmap item
2. Click "Edit"
3. Update:
   - Progress percentage
   - Target date
   - Stage (if moving between now/next/later)
   - Description
4. Save changes

### Publishing Roadmap Communications

#### Send Update

1. Open roadmap item
2. Click "Publish Update"
3. Write message:
   - Keep it concise and actionable
   - Highlight key progress
   - Mention any blockers or changes
4. Select delivery:
   - **Channels**: In-app notification, email, or both
   - **Audience**: Filter by village, role, or language
5. Preview message
6. Click "Send"

#### Communication Best Practices

- **Regular Updates**: Follow your cadence (monthly recommended)
- **Be Transparent**: Share both progress and challenges
- **Link to Resources**: Include Figma, Jira, or demo links
- **Celebrate Wins**: Acknowledge team contributions
- **Manage Expectations**: Be realistic about timelines

### Merging Duplicate Feedback

#### Find Duplicates

1. Open a feedback item
2. Click "Find Duplicates"
3. Review suggestions (86% similarity threshold)
4. Identify canonical (best) version

#### Merge Process

1. Open the duplicate feedback
2. Click "Merge"
3. Select target (canonical) feedback
4. Enter merge reason
5. Confirm merge

What happens:
- All votes transfer to canonical item
- Duplicate marked as "merged"
- Link created to canonical item
- Original author notified
- Event logged for audit

### Reviewing Feedback

As a PM, you can:
- Triage feedback (change state from "new" to "triaged")
- Link feedback to features
- Add feedback to roadmap items
- Respond to feedback with comments
- Close feedback with resolution notes

---

## For Researchers

### Creating Research Panels

#### What is a Panel?

A research panel is a group of users who:
- Match specific criteria (role, village, department, etc.)
- Consented to research contact
- Are available for studies, surveys, and testing

#### Create a Panel

1. Go to `/research/panels` > "New Panel"
2. Fill in details:
   - **Name** (required): Descriptive panel name
   - **Description**: Purpose and goals
   - **Size Target**: Desired number of members
   - **Status**: recruiting | active | archived
3. Define eligibility rules:
   - **Roles**: Which roles to include (e.g., USER only)
   - **Villages**: Specific villages or "all"
   - **Attributes**: Department, job function, etc.
   - **Required Consents**: Must have "research_contact"
4. Set quotas (optional):
   - Proportional by village
   - Fixed numbers per department
5. Click "Create Panel"

#### Invite Members

1. Open panel
2. Click "Invite Members"
3. Choose invitation method:
   - **Auto-recruit**: System finds eligible users
   - **Manual selection**: Pick specific users
4. Write invitation message
5. Send invitations

#### Manage Panel Members

- View member list with status (invited, accepted, declined)
- Remove members if needed
- Track panel size vs. target
- Export member list

### Creating Questionnaires

#### Build a Questionnaire

1. Go to `/research/questionnaires` > "New"
2. Set basic info:
   - **Title** (required): Clear, descriptive name
   - **Version**: Use semantic versioning (1.0.0)
   - **Description**: What you're measuring
3. Add questions:

**Question Types:**

| Type | Description | Example |
|------|-------------|---------|
| **NPS** | Net Promoter Score (0-10) | "How likely are you to recommend?" |
| **Likert** | Agreement scale (1-5) | "The check-in process is easy" |
| **MCQ** | Multiple choice (single) | "Which feature do you use most?" |
| **Checkbox** | Multiple choice (multiple) | "Select all that apply" |
| **Text** | Free text response | "What would you improve?" |
| **Number** | Numeric input | "How many times per week?" |

For each question:
- **ID**: Unique identifier (e.g., "nps", "satisfaction_q1")
- **Type**: Select from above
- **Text**: Question in English and French
- **Required**: Yes or No
- **Scale**: For Likert (e.g., 1-5)
- **Options**: For MCQ and Checkbox

4. Configure targeting:
   - **Panels**: Select which panels to target
   - **Ad-hoc Filters**: Additional criteria (village, features used)
5. Set delivery:
   - **Mode**: in-app, email, or both
   - **Start Date**: When to begin
   - **End Date**: When to close
   - **Max Responses**: Response cap
6. Save as draft

#### Test and Publish

1. Preview questionnaire
2. Send test to yourself
3. Make adjustments
4. Click "Publish"

What happens:
- Status changes to "published"
- Invitations sent to targeted users
- Responses start collecting
- Analytics available in real-time

#### Analyze Responses

1. Go to questionnaire detail page
2. View analytics:
   - **Response Rate**: Completed / Invited
   - **NPS Score**: Calculated automatically
   - **Question Stats**: Averages, distributions
   - **Free Text**: All text responses
3. Export data:
   - CSV format (for Excel)
   - Parquet format (for data analysis)
   - PII excluded by default

### Scheduling User Testing Sessions

#### Create a Session

1. Go to `/research/sessions` > "New Session"
2. Select session type:
   - **Usability**: Test an existing feature
   - **Interview**: One-on-one conversation
   - **Prototype Walkthrough**: Demo new designs
   - **Remote Test**: Unmoderated testing
3. Fill in details:
   - **Title**: Session name
   - **Description**: What you're testing
   - **Date & Time**: When it happens
   - **Duration**: Minutes (e.g., 45)
   - **Facilitators**: Add researchers
   - **Min/Max Participants**: e.g., 3-6 users
4. Add materials:
   - **Prototype Link**: Figma, InVision, etc.
   - **Test Script**: Upload or link
   - **Recording**: Enable/disable
5. Set recruitment:
   - **From Panels**: Select panels
   - **Custom Invites**: Add specific users
6. Click "Schedule Session"

#### Manage Sessions

1. View session details
2. See participant list with RSVP status
3. Send reminders
4. Update session info if needed
5. Cancel if necessary

#### During the Session

1. Check in participants
2. Share prototype/materials
3. Take notes in platform
4. Record if enabled (with consent)

#### After the Session

1. Mark session as "completed"
2. Upload recording (if recorded)
3. Add notes and insights
4. Tag key findings
5. Link to relevant feedback or roadmap items

### Research Best Practices

#### Panel Management
- Keep panels active with regular engagement
- Respect user time (limit frequency)
- Thank participants
- Share research findings when appropriate

#### Questionnaire Design
- Keep surveys short (10 questions max)
- Mix quantitative and qualitative questions
- Use consistent scales
- Test before launch
- Provide incentives if appropriate

#### Session Planning
- Over-recruit by 20% (account for no-shows)
- Send calendar invites
- Prepare clear objectives
- Have backup facilitator
- Test technology beforehand

---

## For Moderators

### Accessing the Moderation Queue

1. Go to `/moderation`
2. View flagged items
3. Use filters:
   - **Status**: Pending, Approved, Rejected
   - **Signal**: Toxicity, Spam, PII, Off-topic
   - **SLA**: Overdue items first
4. Click item to review

### Reviewing Flagged Content

#### What Gets Flagged?

Content is auto-flagged if:
- Toxicity score > 0.7
- Spam score > 0.8
- PII detected
- Reported by users

#### Review Process

1. Open flagged feedback
2. Read content carefully
3. Check moderation signals:
   - **Toxicity**: Offensive language
   - **Spam**: Promotional content
   - **PII**: Personal data (emails, phone numbers)
   - **Off-topic**: Unrelated to product
4. Review context:
   - Author history
   - Similar submissions
   - Votes/comments
5. Make decision: Approve or Reject

#### Approve Content

1. Click "Approve"
2. Add notes (optional): "Reviewed - acceptable"
3. Confirm

What happens:
- Status changes to "approved"
- Content becomes visible
- Author notified
- Event logged

#### Reject Content

1. Click "Reject"
2. Select reason:
   - Inappropriate content
   - Spam/promotional
   - Off-topic
   - Contains PII
   - Duplicate
3. Add detailed notes
4. Confirm

What happens:
- Status changes to "rejected"
- Content hidden from public
- Author notified with reason
- Event logged

### Handling PII

#### What is PII?

Personally Identifiable Information:
- Email addresses
- Phone numbers
- Room/reservation numbers
- Credit card numbers
- Employee IDs
- Personal addresses

#### PII Detection

System automatically:
- Scans all submissions
- Redacts detected PII
- Flags for manual review

Redaction example:
- `alex.rodriguez@clubmed.com` → `a***.r*******@clubmed.com`

#### Manual PII Review

If PII detected:
1. Verify detection is correct
2. Ensure redaction is adequate
3. If needed, manually edit to remove remaining PII
4. Approve with PII removed
5. Document in notes

### Merging Duplicates

As a moderator, you can merge duplicate feedback:

1. Identify duplicates:
   - Use "Find Duplicates" tool
   - Review similarity scores
   - Check vote counts
2. Choose canonical (best) version
3. Merge duplicates into canonical
4. Votes consolidate automatically
5. Original authors notified

### Moderation Guidelines

#### Approval Criteria

Approve if:
- Content is constructive feedback
- Language is professional
- On-topic for the product
- No PII or sensitive data
- Not duplicate of existing feedback

#### Rejection Criteria

Reject if:
- Abusive or offensive language
- Spam or promotional content
- Completely off-topic
- Contains unredacted PII
- Duplicate (after merging)
- Privacy violation

#### Response Times

- **SLA**: 48 hours for review
- **Priority**: Flag items overdue
- **Batching**: Review similar items together
- **Escalation**: Complex cases to admin

#### Communication

When rejecting:
- Be respectful and professional
- Explain specific reason
- Suggest how to resubmit properly
- Link to guidelines if helpful

### Moderation Reports

Access reports at `/moderation/reports`:
- Items reviewed per day/week
- Approval vs. rejection rate
- Average review time
- Top signals (toxicity, spam, etc.)
- Backlog size

---

## Common Questions

### General

**Q: How do I change my village affiliation?**
A: Your village is synced from your HRIS/IDP. Contact HR to update your village assignment.

**Q: Can I submit anonymous feedback?**
A: No, all feedback requires authentication for accountability and follow-up.

**Q: How long is my data stored?**
A: Feedback: 5 years, Research records: 3 years, PII backups: 30 days.

**Q: How do I delete my account?**
A: Contact admin team. Your data will be anonymized per GDPR requirements.

### Feedback & Voting

**Q: Why was my feedback flagged?**
A: Auto-screening detected potential issues (toxicity, spam, PII). A moderator will review within 48 hours.

**Q: Can I change my vote?**
A: Yes, click the vote button again to remove your vote. You can vote again later.

**Q: Why do some votes count more than others?**
A: Votes are weighted by role, panel membership, and village priority to prioritize most relevant feedback.

**Q: What happens to my votes if feedback is merged?**
A: Your vote transfers to the canonical (merged) feedback automatically.

### Roadmap

**Q: Why isn't my feedback in the roadmap?**
A: Not all feedback makes the roadmap. PMs prioritize based on votes, strategic fit, and resources.

**Q: Can I suggest changes to the roadmap?**
A: Submit feedback about roadmap priorities. PMs review all suggestions.

**Q: What does "Under Consideration" mean?**
A: The team is evaluating feasibility, priority, and resource requirements before committing.

### Research

**Q: How do I join a research panel?**
A: Enable "Research Contact" consent in your profile. Researchers will invite you based on eligibility.

**Q: Can I decline a panel invitation?**
A: Yes, you can accept or decline any invitation without penalty.

**Q: Are my questionnaire responses anonymous?**
A: Responses are linked to your account for targeting purposes, but exports exclude PII by default. Check each questionnaire's privacy settings.

**Q: Will I be compensated for research participation?**
A: Check the session or questionnaire details. Some studies offer incentives.

### Moderation

**Q: How long does moderation take?**
A: Maximum 48 hours. Most reviews are completed within 24 hours.

**Q: Can I appeal a rejection?**
A: Yes, contact the moderation team via the "Appeal" link in your notification.

**Q: What if I accidentally included PII?**
A: The system auto-redacts most PII. If something slips through, moderators will remove it before approval.

### Privacy & GDPR

**Q: What consent do I need to give?**
A: Only "Usage Analytics" is required. Other consents (Research, Email) are optional.

**Q: How do I revoke consent?**
A: Go to Profile > Privacy Settings and toggle off any consent.

**Q: Can I export all my data?**
A: Yes, use the "Export My Data" button in your profile to download everything.

**Q: How is my data protected?**
A: We use encryption, access controls, PII redaction, and regular security audits.

---

## Need Help?

### Support Resources

- **User Documentation**: Check this guide first
- **API Documentation**: `docs/API.md` for developers
- **Deployment Guide**: `docs/DEPLOYMENT.md` for admins
- **Technical Issues**: Create a support ticket
- **Product Questions**: Contact Product team
- **Security Concerns**: Report immediately to Security team

### Feedback on the Platform

We welcome feedback about the Gentil Feedback platform itself! Submit your suggestions, bugs, or feature requests through the platform.

---

**Last Updated**: 2025-10-02
**Version**: 0.5.0

Thank you for using Gentil Feedback!
