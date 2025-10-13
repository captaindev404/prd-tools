# TASK-062: Analytics Dashboard - Testing Guide

Quick reference for testing the new analytics dashboard features.

---

## Quick Start

### 1. Start the Development Server

```bash
cd /Users/captaindev404/Code/club-med/gentil-feedback
npm run dev
```

Server runs at: http://localhost:3000

### 2. Navigate to Analytics Dashboard

Two options:
- **Original Dashboard:** http://localhost:3000/analytics
- **Enhanced Dashboard:** http://localhost:3000/analytics/enhanced-page

---

## API Endpoint Testing

### Test Voting Analytics API

```bash
# Basic request (30-day default)
curl http://localhost:3000/api/analytics/voting

# With time range
curl http://localhost:3000/api/analytics/voting?timeRange=90d

# With filters
curl "http://localhost:3000/api/analytics/voting?timeRange=30d&productArea=Reservations&village=vlg-001"

# Expected response structure:
{
  "summary": {
    "totalVotes": 1234,
    "uniqueVoters": 567,
    "avgVotesPerUser": 2.2,
    "avgVotesPerFeedback": 5.6,
    "trend": 15.5
  },
  "votingTrends": [...],
  "votesByProductArea": [...],
  "votesByFeature": [...],
  "topVoters": [...]
}
```

### Test NPS Analytics API

```bash
# Basic request
curl http://localhost:3000/api/analytics/nps

# With filters
curl "http://localhost:3000/api/analytics/nps?timeRange=30d&panelId=pan_01234"

# Expected response structure:
{
  "summary": {
    "overallNPS": 42,
    "totalResponses": 250,
    "promoters": 120,
    "passives": 80,
    "detractors": 50,
    "trend": 5.2
  },
  "npsOverTime": [...],
  "npsDistribution": [...],
  "npsByPanel": [...],
  "scoreBreakdown": [...]
}
```

---

## UI Testing Checklist

### Dashboard Access
- [ ] Navigate to `/analytics` - Page loads without errors
- [ ] Navigate to `/analytics/enhanced-page` - Enhanced page loads
- [ ] Check browser console - No JavaScript errors
- [ ] Check network tab - All API calls return 200 OK

### Filters Testing
- [ ] Change **Time Range** to "Last 7 days" → Charts update
- [ ] Change to "Last 90 days" → Charts update with more data
- [ ] Select **Product Area** "Reservations" → Data filters
- [ ] Select **Village** "Punta Cana" → Data filters
- [ ] Click "Refresh Data" button → Loading spinner shows, data refreshes

### Tab Navigation
- [ ] Click "Overview" tab → Summary metrics + key charts
- [ ] Click "Voting" tab → Voting analytics + export buttons
- [ ] Click "NPS" tab → NPS score + trends
- [ ] Click "Research" tab → Response rates + panel engagement

### Chart Interactions
- [ ] **FeedbackTrendsChart:**
  - [ ] Hover over line points → Tooltip shows date and value
  - [ ] Line animates on load
  - [ ] Responsive (resize browser, chart adjusts)

- [ ] **VotingPatternsChart:**
  - [ ] Hover over bars → Tooltip shows category, votes, percentage
  - [ ] Bars are color-coded
  - [ ] X-axis labels are angled for readability

- [ ] **NPSScoreCard:**
  - [ ] Gauge shows correct score (-100 to 100)
  - [ ] Color matches score range (green/amber/red)
  - [ ] Trend arrow shows up/down/stable
  - [ ] Promoters/Passives/Detractors breakdown visible

- [ ] **ResponseRatesChart:**
  - [ ] Funnel shows all stages (Sent → Opened → Started → Completed)
  - [ ] Drop-off percentages calculated correctly
  - [ ] Completion rate shows at top

- [ ] **PanelEngagementChart:**
  - [ ] Pie chart shows all panels
  - [ ] Percentages displayed on slices (if >5%)
  - [ ] Legend shows all panels with counts

### Export Testing
- [ ] **Voting Tab:**
  - [ ] Click "Export CSV" → File downloads as `voting-analytics-YYYY-MM-DD.csv`
  - [ ] Open CSV → Data is formatted correctly
  - [ ] Click "Export JSON" → File downloads as `voting-analytics-YYYY-MM-DD.json`
  - [ ] Open JSON → Data structure is correct

- [ ] **NPS Tab:**
  - [ ] Click "Export CSV" → NPS data downloads
  - [ ] Click "Export JSON" → NPS data downloads

### Responsive Design
- [ ] Desktop (>1024px):
  - [ ] 4-column grid for metric cards
  - [ ] 2-column grid for charts
  - [ ] Filters in one row

- [ ] Tablet (768px-1023px):
  - [ ] 2-column grid for metric cards
  - [ ] 2-column grid for charts
  - [ ] Filters wrap to 2 rows

- [ ] Mobile (<768px):
  - [ ] 1-column grid (stacked)
  - [ ] Charts are full width
  - [ ] Filters stack vertically
  - [ ] Tabs are scrollable

### Error Handling
- [ ] Disconnect internet → Error alert shows
- [ ] Invalid API response → Error alert shows
- [ ] Empty data (no votes) → "No data available" message
- [ ] Loading state shows skeleton placeholders

### Performance
- [ ] Initial page load < 2 seconds
- [ ] Chart render < 500ms
- [ ] Filter change instant (client-side)
- [ ] Export < 1 second
- [ ] No layout shift (CLS = 0)

---

## Visual Regression Testing

### Screenshot Checklist

Take screenshots of:
1. **Overview Tab** (desktop)
   - Full page with all summary cards and charts

2. **Voting Tab** (desktop)
   - Voting trends chart
   - Voting patterns bar chart
   - Top voters list

3. **NPS Tab** (desktop)
   - NPS gauge card
   - NPS over time chart
   - NPS distribution pie chart

4. **Research Tab** (desktop)
   - Response rates funnel
   - Panel engagement pie chart

5. **Mobile View** (375px width)
   - Overview tab
   - Filters expanded
   - Any chart

### Compare with Expected Layouts
- All charts should have consistent padding
- Cards should have rounded corners and shadows
- Colors should match the design system
- Typography should be consistent

---

## Common Issues & Solutions

### Issue: Charts not rendering
**Solution:**
- Check browser console for errors
- Verify Recharts is installed: `npm list recharts`
- Clear browser cache and reload

### Issue: API returns 401 Unauthorized
**Solution:**
- Make sure you're logged in
- Check auth session in browser DevTools
- Restart dev server

### Issue: API returns empty data
**Solution:**
- Run seed script: `npm run db:seed`
- Check database has votes and questionnaire responses
- Verify Prisma client is generated: `npm run db:generate`

### Issue: Export doesn't download
**Solution:**
- Check browser allows downloads
- Check console for JavaScript errors
- Try different browser

### Issue: Charts look broken on mobile
**Solution:**
- Check ResponsiveContainer width is "100%"
- Verify parent container has width
- Test in Chrome DevTools mobile emulator

---

## Seed Data Script

Add this to `/prisma/seed.ts` for testing:

```typescript
// Create votes for testing
const votes = [];
for (let i = 0; i < 100; i++) {
  const randomDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
  votes.push({
    userId: users[i % users.length].id,
    feedbackId: feedbackItems[i % feedbackItems.length].id,
    weight: 1.0 + Math.random() * 1.5,
    decayedWeight: 1.0 + Math.random() * 1.5,
    createdAt: randomDate,
  });
}

await prisma.vote.createMany({ data: votes });

// Create NPS responses for testing
const npsResponses = [];
for (let i = 0; i < 50; i++) {
  const randomDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
  const npsScore = Math.floor(Math.random() * 11); // 0-10

  npsResponses.push({
    questionnaireId: questionnaires[0].id,
    respondentId: users[i % users.length].id,
    answers: JSON.stringify({ q1: npsScore }),
    completedAt: randomDate,
  });
}

await prisma.questionnaireResponse.createMany({ data: npsResponses });

console.log('✅ Seed data created for analytics testing');
```

Run:
```bash
npm run db:seed
```

---

## Expected Behavior Summary

### Overview Tab
- Shows 4 metric cards (Total Votes, Unique Voters, NPS Score, NPS Responses)
- Shows 4 charts (Voting Trends, NPS Gauge, Voting by Area, NPS Distribution)
- All charts should have data (if seed ran)

### Voting Tab
- Shows 4 metric cards (Total Votes, Unique Voters, Avg Votes/User, Avg Votes/Feedback)
- Shows voting trends line chart
- Shows voting by product area bar chart
- Shows top voted features list
- Export buttons work

### NPS Tab
- Shows NPS gauge card with score
- Shows NPS over time line chart
- Shows NPS distribution pie chart
- Shows NPS by panel list
- Export buttons work

### Research Tab
- Shows response rates funnel chart
- Shows panel engagement pie chart
- Shows summary stats

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

All charts should render correctly in all browsers.

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate Select dropdowns
- [ ] Escape closes dropdowns

### Screen Reader
- [ ] All charts have descriptive titles
- [ ] Metric cards announce values
- [ ] Export buttons announce action
- [ ] Error alerts are announced

### Color Contrast
- [ ] All text meets WCAG AA (4.5:1 ratio)
- [ ] Chart colors are distinguishable
- [ ] Focus indicators are visible

---

## Performance Benchmarks

Use Chrome DevTools Lighthouse:

### Expected Scores
- **Performance:** >90
- **Accessibility:** >95
- **Best Practices:** >90
- **SEO:** >90

### Key Metrics
- **First Contentful Paint (FCP):** <1.5s
- **Largest Contentful Paint (LCP):** <2.5s
- **Cumulative Layout Shift (CLS):** <0.1
- **Time to Interactive (TTI):** <3s

---

## Deployment Checklist

Before deploying:
- [ ] All API endpoints tested
- [ ] All charts render correctly
- [ ] Filters work as expected
- [ ] Export functionality works
- [ ] Responsive design verified
- [ ] Error handling verified
- [ ] Performance benchmarks met
- [ ] Accessibility checks passed
- [ ] Browser compatibility verified
- [ ] Documentation updated

---

## Quick Reference: File Locations

### API Endpoints
- `/src/app/api/analytics/voting/route.ts`
- `/src/app/api/analytics/nps/route.ts`

### Chart Components
- `/src/components/analytics/FeedbackTrendsChart.tsx`
- `/src/components/analytics/VotingPatternsChart.tsx`
- `/src/components/analytics/NPSScoreCard.tsx`
- `/src/components/analytics/ResponseRatesChart.tsx`
- `/src/components/analytics/PanelEngagementChart.tsx`

### Dashboard Pages
- `/src/app/(authenticated)/analytics/page.tsx` (original)
- `/src/app/(authenticated)/analytics/enhanced-page.tsx` (new)

### Utilities
- `/src/types/analytics.ts` (types)
- `/src/lib/analytics-helpers.ts` (helpers)

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify seed data exists in database
4. Clear browser cache and restart dev server
5. Review completion report for known limitations

---

**Last Updated:** 2025-10-13
**Task:** TASK-062
**Status:** Ready for Testing ✅
