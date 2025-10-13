# Task 65: Roadmap Communications Hub - Visual Guide

## Page Navigation

```
/roadmap
├── Main Roadmap (Kanban view)
│
├── /timeline
│   └── Timeline/Gantt Chart View
│
├── /milestones
│   └── Milestone Tracking Dashboard
│
└── /communications
    ├── Release Notes Tab
    │   ├── Changelog viewer
    │   └── Download (HTML/Markdown)
    │
    └── Notifications Tab
        ├── Item Selection
        └── Publish Form
```

---

## 1. Timeline View (`/roadmap/timeline`)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Roadmap                                       │
│                                                         │
│ Timeline View                                           │
│ Visualize roadmap progress and target dates...         │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │  Total   │ │In Progress│ │Completed │ │Avg Progress│ │
│ │    15    │ │     8     │ │    3     │ │    65%    │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Timeline Gantt Chart                                    │
│ ┌─────────────────────────────────────────────────┐   │
│ │                         Jan     Feb     Mar     │   │
│ │ Mobile Check-in    [■■■■■■■■■─────────]        │   │
│ │ Payment Gateway    [■■■■■■■■■■■■──────]        │   │
│ │ Self-Service...        [■■■■■■■■─────]         │   │
│ │ Dashboard Rewrite           [■■■■─────]        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Color Legend:                                           │
│ [Green=Now] [Blue=Next] [Gray=Later] [Yellow=Considering]│
├─────────────────────────────────────────────────────────┤
│ Roadmap Items (List View)                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Mobile Check-in [NOW]                           │   │
│ │ Start: Jan 15, 2025 • Target: Mar 15, 2025     │   │
│ │ 3 features                                       │   │
│ │ Progress: [■■■■■■■─────] 75%                   │   │
│ └─────────────────────────────────────────────────┘   │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Key Features
- Gantt chart with horizontal bars
- Hover tooltips showing duration, progress, stage
- Summary statistics cards
- Item list with progress bars
- Color-coded by stage

---

## 2. Milestones View (`/roadmap/milestones`)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Roadmap                                       │
│                                                         │
│ Milestones                                              │
│ Track progress and status of roadmap milestones        │
├─────────────────────────────────────────────────────────┤
│ ┌────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │ 15 │ │   5    │ │   7    │ │   2    │ │   1    │   │
│ │Total│ │Complete│ │On Track│ │At Risk │ │Delayed │   │
│ └────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
├─────────────────────────────────────────────────────────┤
│ [All(15)] [On Track(7)] [At Risk(2)] [Delayed(1)] [Complete(5)]│
├─────────────────────────────────────────────────────────┤
│ ┌────────────────────────┐ ┌────────────────────────┐ │
│ │ Mobile Check-in        │ │ Payment Gateway        │ │
│ │ [NOW] 📈 On Track      │ │ [NEXT] ⚠️ At Risk    │ │
│ │                        │ │                        │ │
│ │ Description text...    │ │ Description text...    │ │
│ │                        │ │                        │ │
│ │ Progress               │ │ Progress               │ │
│ │ [■■■■■■■■──] 75%      │ │ [■■■■■─────] 45%      │ │
│ │                        │ │                        │ │
│ │ 🕐 Target: Mar 15      │ │ 🕐 Target: Feb 28     │ │
│ │ 3 features • 5 feedback│ │ 2 features • 8 feedback│ │
│ └────────────────────────┘ └────────────────────────┘ │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Status Indicators
```
✅ Completed (100% progress)
   - Green checkmark
   - Green left border

📈 On Track (Normal progress)
   - Blue trending-up icon
   - Blue left border

⚠️ At Risk (<30 days, <75% progress)
   - Yellow alert icon
   - Yellow left border

🕐 Delayed (Past target date)
   - Red clock icon
   - Red left border
```

---

## 3. Communications Hub (`/roadmap/communications`)

### Tab 1: Release Notes

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Roadmap                                       │
│                                                         │
│ Communications Hub                                       │
│ Manage roadmap communications, changelogs, and...      │
├─────────────────────────────────────────────────────────┤
│ [📄 Release Notes] [📤 Notifications]                  │
├─────────────────────────────────────────────────────────┤
│ Release Notes                      [↓ Markdown] [↓ HTML]│
│ 12 updates across all stages                           │
├─────────────────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                           │
│ │ 12 │ │ 4  │ │ 6  │ │ 2  │                           │
│ │Total│ │New │ │Updt│ │Done│                           │
│ └────┘ └────┘ └────┘ └────┘                           │
├─────────────────────────────────────────────────────────┤
│ [All(12)] [New(4)] [Updated(6)] [Completed(2)]        │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐   │
│ │ Mobile Check-in [NEW] [now]                     │   │
│ │ 📅 Oct 10, 2025 • Target: Mar 15, 2026          │   │
│ │ Progress: 25% • 3 features • 5 feedback         │   │
│ │ 2 Jira tickets                                   │   │
│ │                                         75%      │   │
│ └─────────────────────────────────────────────────┘   │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Tab 2: Notifications

```
┌─────────────────────────────────────────────────────────┐
│ [📄 Release Notes] [📤 Notifications]                  │
├─────────────────────────────────────────────────────────┤
│ Select Roadmap Items                                    │
│ Choose which roadmap items to include...               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ☑ Mobile Check-in                               │   │
│ │   now • 75% complete                             │   │
│ │ ☐ Payment Gateway                                │   │
│ │   next • 45% complete                            │   │
│ │ ☑ Self-Service Kiosk                            │   │
│ │   now • 80% complete                             │   │
│ └─────────────────────────────────────────────────┘   │
│ [2 items selected]                                      │
├─────────────────────────────────────────────────────────┤
│ Publish to Stakeholders                                 │
│ Notify users about roadmap updates...                  │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Selected Roadmap Items:                          │   │
│ │ [Mobile Check-in] [Self-Service Kiosk]          │   │
│ └─────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Custom Message (Optional)                        │   │
│ │ ┌───────────────────────────────────────────┐  │   │
│ │ │ Add a custom message to include...        │  │   │
│ │ │                                            │  │   │
│ │ └───────────────────────────────────────────┘  │   │
│ │ If left empty, a default message will be...     │   │
│ └─────────────────────────────────────────────────┘   │
│ Notification Channels                                   │
│ ☑ 🔔 In-app notifications                              │
│ ☐ ✉️ Email notifications                               │
│ Audience                                                │
│ ☑ All users                                             │
│                                                         │
│                              [📤 Publish Updates]       │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Integrations

### Jira Integration
```
Roadmap Item Detail
┌─────────────────────────────────────────────────────────┐
│ Mobile Check-in                                         │
│ ...                                                     │
│ Linked Jira Tickets:                                    │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ODYS-2142                                        │   │
│ │ Status: In Progress                               │   │
│ │ Assignee: John Doe                                │   │
│ │ [View in Jira →]                                 │   │
│ └─────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ PMS-456                                          │   │
│ │ Status: Done                                      │   │
│ │ Assignee: Jane Smith                              │   │
│ │ [View in Jira →]                                 │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Figma Integration
```
Roadmap Item Detail
┌─────────────────────────────────────────────────────────┐
│ Mobile Check-in                                         │
│ ...                                                     │
│ Design Files:                                           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Mobile Check-in Designs                          │   │
│ │ Last modified: Oct 12, 2025                      │   │
│ │ [View in Figma →] [📋 Copy Embed Code]          │   │
│ │                                                   │   │
│ │ ┌─────────────────────────────────────────┐     │   │
│ │ │ [Figma Design Preview/Thumbnail]        │     │   │
│ │ │                                          │     │   │
│ │ └─────────────────────────────────────────┘     │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. User Flows

### PM Publishing Roadmap Update

1. Navigate to `/roadmap/communications`
2. Click "Notifications" tab
3. Select roadmap items to announce (checkboxes)
4. (Optional) Write custom message
5. Select notification channels:
   - ✓ In-app notifications
   - ✓ Email notifications
6. Choose audience (default: All users)
7. Click "Publish Updates"
8. Toast notification: "Updates published successfully"
9. Summary shown: X notifications sent, Y emails sent

### User Receiving Notification

**In-app:**
1. Bell icon in header shows badge (red dot)
2. Click to open notification center
3. See: "Roadmap Update: 2 items updated"
4. Click to view `/roadmap`

**Email:**
1. Receive email: "Roadmap Update: 2 items updated"
2. See list of updated items with stages and target dates
3. Click "View Full Roadmap" link
4. Opens `/roadmap` in browser

### User Viewing Timeline

1. Navigate to `/roadmap`
2. Click "Timeline" button or link
3. View Gantt chart with all roadmap items
4. Hover over bars to see details:
   - Duration: X days
   - Progress: Y%
   - Stage badge
5. Scroll down to see detailed item list
6. Click item to view full details

---

## 6. Color Coding Reference

### Stage Colors
```
NOW                  - Green (#10b981)
├─ Border            - border-green-500
├─ Badge             - bg-green-100 text-green-800
└─ Chart Bar         - #10b981

NEXT                 - Blue (#3b82f6)
├─ Border            - border-blue-500
├─ Badge             - bg-blue-100 text-blue-800
└─ Chart Bar         - #3b82f6

LATER                - Gray (#6b7280)
├─ Border            - border-gray-500
├─ Badge             - bg-gray-100 text-gray-800
└─ Chart Bar         - #6b7280

UNDER_CONSIDERATION  - Yellow (#f59e0b)
├─ Border            - border-yellow-500
├─ Badge             - bg-yellow-100 text-yellow-800
└─ Chart Bar         - #f59e0b
```

### Status Colors (Milestones)
```
COMPLETED            - Green
├─ Icon              - CheckCircle2 (green)
├─ Border            - border-green-200
└─ Background        - bg-green-50

ON_TRACK             - Blue
├─ Icon              - TrendingUp (blue)
├─ Border            - border-blue-200
└─ Background        - bg-blue-50

AT_RISK              - Yellow
├─ Icon              - AlertCircle (yellow)
├─ Border            - border-yellow-200
└─ Background        - bg-yellow-50

DELAYED              - Red
├─ Icon              - Clock (red)
├─ Border            - border-red-200
└─ Background        - bg-red-50
```

### Change Type Colors (Changelog)
```
NEW                  - Green
└─ Badge             - bg-green-100 text-green-800

UPDATED              - Blue
└─ Badge             - bg-blue-100 text-blue-800

COMPLETED            - Purple
└─ Badge             - bg-purple-100 text-purple-800
```

---

## 7. Responsive Behavior

### Desktop (≥1024px)
- 2-column grid for milestone cards
- Full-width Gantt chart
- Side-by-side summary cards (4 columns)

### Tablet (768px - 1023px)
- 2-column grid for milestone cards
- Gantt chart with horizontal scroll
- Summary cards wrap (2 columns)

### Mobile (<768px)
- 1-column grid for all cards
- Gantt chart with horizontal scroll
- Summary cards stack vertically
- Tabs switch to dropdown menu
- Item selection uses full width

---

## 8. Empty States

### No Timeline Data
```
┌─────────────────────────────────────┐
│         🗓️                         │
│                                     │
│  No roadmap items with target      │
│  dates to display                   │
└─────────────────────────────────────┘
```

### No Milestones
```
┌─────────────────────────────────────┐
│         📊                         │
│                                     │
│  No milestones in this category    │
└─────────────────────────────────────┘
```

### No Changelog
```
┌─────────────────────────────────────┐
│         📄                         │
│                                     │
│  No changelog entries to display   │
└─────────────────────────────────────┘
```

### No Selected Items
```
Publish to Stakeholders
┌─────────────────────────────────────┐
│ Selected Roadmap Items:             │
│ (No items selected)                 │
│                                     │
│ [Publish Updates] (disabled)        │
└─────────────────────────────────────┘
```

---

## 9. Loading States

All components show loading spinners during data fetching:

```
┌─────────────────────────────────────┐
│                                     │
│         ⟳ (spinning)                │
│                                     │
└─────────────────────────────────────┘
```

---

## 10. Error States

```
┌─────────────────────────────────────┐
│ ⚠️ Error loading data:              │
│ Failed to fetch timeline data       │
└─────────────────────────────────────┘
```

All components handle errors gracefully with user-friendly messages.
