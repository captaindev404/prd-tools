# TASK-062: Analytics Dashboard - Quick Reference

One-page reference for the new analytics dashboard implementation.

---

## What Was Built

### 2 New API Endpoints
1. **`/api/analytics/voting`** - Voting patterns and statistics
2. **`/api/analytics/nps`** - Net Promoter Score analytics

### 5 New Chart Components
1. **`FeedbackTrendsChart`** - Line/Area chart for trends over time
2. **`VotingPatternsChart`** - Bar chart for voting by category
3. **`NPSScoreCard`** - Radial gauge for NPS score with breakdown
4. **`ResponseRatesChart`** - Horizontal funnel for response journey
5. **`PanelEngagementChart`** - Pie/Donut chart for panel distribution

### 1 Enhanced Dashboard Page
**`/analytics/enhanced-page.tsx`** - Comprehensive analytics with filters and export

---

## Quick Access

### URLs
- **Original Dashboard:** http://localhost:3000/analytics
- **Enhanced Dashboard:** http://localhost:3000/analytics/enhanced-page

### API Endpoints
```bash
# Voting analytics
GET /api/analytics/voting?timeRange=30d&productArea=Reservations&village=vlg-001

# NPS analytics
GET /api/analytics/nps?timeRange=30d&panelId=pan_12345&questionnaireId=qnn_67890
```

---

## Key Features

### Filters
- **Time Range:** 7d, 30d, 90d, 1y, all
- **Product Area:** All, Reservations, CheckIn, Payments, Housekeeping, Backoffice
- **Village:** All, specific village ID

### Tabs
- **Overview:** Summary metrics + key charts
- **Voting:** Detailed voting analytics
- **NPS:** NPS scores and trends
- **Research:** Response rates + panel engagement

### Export
- **CSV:** Tabular data export
- **JSON:** Complete analytics export
- Timestamped filenames (e.g., `voting-analytics-2025-10-13.csv`)

---

## Chart Components Usage

### FeedbackTrendsChart
```tsx
<FeedbackTrendsChart
  data={[
    { date: '2025-10-01', value: 25 },
    { date: '2025-10-02', value: 32 },
    // ...
  ]}
  title="Feedback Trends"
  description="Submissions over time"
  height={350}
  showArea={true}
/>
```

### VotingPatternsChart
```tsx
<VotingPatternsChart
  data={[
    { category: 'Reservations', value: 150, percentage: 35.2 },
    { category: 'CheckIn', value: 120, percentage: 28.1 },
    // ...
  ]}
  title="Votes by Product Area"
  height={350}
/>
```

### NPSScoreCard
```tsx
<NPSScoreCard
  npsScore={42}
  totalResponses={250}
  promoters={120}
  passives={80}
  detractors={50}
  trend={5.2}
  height={350}
/>
```

### ResponseRatesChart
```tsx
<ResponseRatesChart
  data={{
    sent: 1000,
    opened: 750,
    started: 600,
    completed: 450,
  }}
  title="Questionnaire Response Funnel"
  height={350}
/>
```

### PanelEngagementChart
```tsx
<PanelEngagementChart
  data={[
    { category: 'UX Testers', value: 45 },
    { category: 'Beta Users', value: 32 },
    // ...
  ]}
  title="Panel Engagement"
  innerRadius={60} // Donut chart
  height={350}
/>
```

---

## API Response Structures

### Voting Analytics Response
```typescript
{
  summary: {
    totalVotes: number;
    uniqueVoters: number;
    avgVotesPerUser: number;
    avgVotesPerFeedback: number;
    trend: number;
  };
  votingTrends: TimeSeriesData[];
  votesByProductArea: CategoryData[];
  votesByFeature: {
    featureId: string;
    featureName: string;
    voteCount: number;
    weightedVotes: number;
  }[];
  topVoters: {
    userId: string;
    displayName: string;
    voteCount: number;
    totalWeight: number;
  }[];
  voteDistribution: {
    range: string;
    count: number;
  }[];
}
```

### NPS Analytics Response
```typescript
{
  summary: {
    overallNPS: number;
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    trend: number;
  };
  npsOverTime: TimeSeriesData[];
  npsDistribution: CategoryData[];
  npsByPanel: {
    panelId: string;
    panelName: string;
    npsScore: number;
    responseCount: number;
  }[];
  npsByQuestionnaire: {
    questionnaireId: string;
    questionnaireTitle: string;
    npsScore: number;
    responseCount: number;
  }[];
  scoreBreakdown: {
    score: number;
    count: number;
    percentage: number;
  }[];
}
```

---

## Common Data Types

### TimeSeriesData
```typescript
interface TimeSeriesData {
  date: string; // ISO date string or YYYY-MM format
  value: number;
  label?: string;
}
```

### CategoryData
```typescript
interface CategoryData {
  category: string;
  value: number;
  percentage?: number;
  color?: string;
}
```

---

## Testing Quick Commands

### Start Dev Server
```bash
npm run dev
# Opens at http://localhost:3000
```

### Test API Endpoints
```bash
# Voting analytics
curl http://localhost:3000/api/analytics/voting?timeRange=30d | jq

# NPS analytics
curl http://localhost:3000/api/analytics/nps?timeRange=30d | jq
```

### Add Seed Data
```bash
npm run db:seed
```

### Check Database
```bash
npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

---

## File Locations

### API Endpoints
```
/src/app/api/analytics/
├── voting/
│   └── route.ts        (349 lines)
└── nps/
    └── route.ts        (293 lines)
```

### Chart Components
```
/src/components/analytics/
├── FeedbackTrendsChart.tsx      (152 lines)
├── VotingPatternsChart.tsx      (126 lines)
├── NPSScoreCard.tsx             (196 lines)
├── ResponseRatesChart.tsx       (154 lines)
└── PanelEngagementChart.tsx     (172 lines)
```

### Dashboard
```
/src/app/(authenticated)/analytics/
├── page.tsx              (original dashboard)
└── enhanced-page.tsx     (new enhanced dashboard - 694 lines)
```

### Utilities
```
/src/types/analytics.ts          (type definitions)
/src/lib/analytics-helpers.ts    (helper functions)
```

### Documentation
```
/docs/tasks/
├── TASK-062-ANALYTICS-COMPLETION.md    (completion report)
├── TASK-062-TESTING-GUIDE.md          (testing guide)
└── TASK-062-QUICK-REFERENCE.md        (this file)
```

---

## Color Palette

### Chart Colors
```typescript
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];
```

### NPS Score Colors
- **Excellent (≥50):** `#10b981` (green)
- **Good (30-49):** `#84cc16` (lime)
- **Fair (0-29):** `#f59e0b` (amber)
- **Poor (-30 to -1):** `#fb923c` (orange)
- **Needs Improvement (<-30):** `#ef4444` (red)

---

## Performance Targets

### Response Times
- API endpoints: 200-500ms (cached: <50ms)
- Chart rendering: 100-300ms
- Export generation: 50-200ms

### Bundle Size
- Recharts: ~250KB (gzipped)
- New components: ~15KB (gzipped)
- Total increase: ~265KB

---

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

---

## Troubleshooting

### Charts not rendering
1. Check browser console for errors
2. Verify: `npm list recharts`
3. Clear cache and reload

### API returns 401
1. Ensure logged in
2. Check auth session
3. Restart dev server

### Empty data
1. Run: `npm run db:seed`
2. Check database: `npm run db:studio`
3. Verify votes and responses exist

### Export not working
1. Check browser allows downloads
2. Check console errors
3. Try different browser

---

## Next Steps

### For Developers
1. Review completion report: `TASK-062-ANALYTICS-COMPLETION.md`
2. Follow testing guide: `TASK-062-TESTING-GUIDE.md`
3. Run seed data: `npm run db:seed`
4. Test dashboard: http://localhost:3000/analytics/enhanced-page

### For Product Managers
1. Access dashboard after login
2. Use filters to explore data
3. Export reports for stakeholders
4. Provide feedback on UX

### For QA
1. Follow testing checklist in `TASK-062-TESTING-GUIDE.md`
2. Test all browsers and devices
3. Verify accessibility (WCAG AA)
4. Performance test with Lighthouse

---

## Known Limitations

1. PDF export not implemented (CSV/JSON only)
2. No custom date range picker (preset ranges only)
3. No real-time updates (manual refresh required)
4. No multi-select filters

See completion report for planned Phase 2 enhancements.

---

## Support

**Task:** TASK-062
**Status:** ✅ Complete
**Date:** 2025-10-13
**Agent:** A19

For issues or questions, refer to:
- Completion report for full details
- Testing guide for step-by-step testing
- CLAUDE.md for project conventions

---

**Quick Links:**
- [Completion Report](./TASK-062-ANALYTICS-COMPLETION.md)
- [Testing Guide](./TASK-062-TESTING-GUIDE.md)
- [Project README](../../README.md)
- [API Docs](../../docs/API.md)
