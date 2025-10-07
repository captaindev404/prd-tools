# Sidebar Role-Based Navigation - Manual Testing Guide

## Overview

This document provides a comprehensive manual testing checklist for verifying role-based sidebar navigation filtering in the Gentil Feedback platform.

## Test Date

**Tested on:** 2025-10-04

## Test Environment

- **URL:** http://localhost:3000
- **Browser:** Chrome/Firefox/Safari
- **Viewport:** 1280x720

## Role-Based Navigation Matrix

### Expected Visibility by Role

| Navigation Item | USER | PM | PO | RESEARCHER | MODERATOR | ADMIN |
|----------------|------|----|----|------------|-----------|-------|
| Dashboard      | ✓    | ✓  | ✓  | ✓          | ✓         | ✓     |
| Feedback       | ✓    | ✓  | ✓  | ✓          | ✓         | ✓     |
| Features       | ✗    | ✓  | ✓  | ✗          | ✗         | ✓     |
| Roadmap        | ✓    | ✓  | ✓  | ✓          | ✓         | ✓     |
| Research       | ✗    | ✓  | ✓  | ✓          | ✗         | ✓     |
| └─ Sessions    | ✗    | ✓  | ✓  | ✓          | ✗         | ✓     |
| └─ Panels      | ✗    | ✓  | ✓  | ✓          | ✗         | ✓     |
| └─ Questionnaires | ✗ | ✓  | ✓  | ✓          | ✗         | ✓     |
| Analytics      | ✗    | ✓  | ✓  | ✓          | ✗         | ✓     |
| Moderation     | ✗    | ✗  | ✗  | ✗          | ✓         | ✓     |
| Admin Panel    | ✗    | ✗  | ✗  | ✗          | ✗         | ✓     |
| └─ Users       | ✗    | ✗  | ✗  | ✗          | ✗         | ✓     |
| └─ Villages    | ✗    | ✗  | ✗  | ✗          | ✗         | ✓     |
| Settings       | ✓    | ✓  | ✓  | ✓          | ✓         | ✓     |

## Test Users

Use these credentials for testing (seeded in database):

- **USER:** user@dev.local
- **PM:** pm@dev.local
- **PO:** po@dev.local (needs to be added to seed)
- **RESEARCHER:** researcher@dev.local
- **MODERATOR:** moderator@dev.local
- **ADMIN:** admin@dev.local

## Test Procedures

### 1. USER Role Testing

**Test User:** user@dev.local

**Steps:**
1. Sign in as USER
2. Navigate to /dashboard
3. Open sidebar (if not already open)
4. Take screenshot: `screenshots/sidebar-user.png`

**Expected Results:**
- ✅ Dashboard - visible
- ✅ Feedback - visible
- ✅ Roadmap - visible
- ✅ Settings - visible
- ❌ Features - NOT visible
- ❌ Research - NOT visible
- ❌ Analytics - NOT visible
- ❌ Moderation - NOT visible
- ❌ Admin Panel - NOT visible

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

### 2. PM Role Testing

**Test User:** pm@dev.local

**Steps:**
1. Sign in as PM
2. Navigate to /dashboard
3. Open sidebar (if not already open)
4. Take screenshot: `screenshots/sidebar-pm.png`
5. Expand Research submenu
6. Take screenshot: `screenshots/sidebar-pm-research-expanded.png`

**Expected Results:**
- ✅ Dashboard - visible
- ✅ Feedback - visible
- ✅ Features - visible
- ✅ Roadmap - visible
- ✅ Research - visible (with submenu)
  - ✅ Sessions
  - ✅ Panels
  - ✅ Questionnaires
- ✅ Analytics - visible
- ✅ Settings - visible
- ❌ Moderation - NOT visible
- ❌ Admin Panel - NOT visible

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

### 3. PO Role Testing

**Test User:** po@dev.local

**Steps:**
1. Sign in as PO
2. Navigate to /dashboard
3. Open sidebar (if not already open)
4. Take screenshot: `screenshots/sidebar-po.png`

**Expected Results:**
- ✅ Dashboard - visible
- ✅ Feedback - visible
- ✅ Features - visible
- ✅ Roadmap - visible
- ✅ Research - visible (with submenu)
- ✅ Analytics - visible
- ✅ Settings - visible
- ❌ Moderation - NOT visible
- ❌ Admin Panel - NOT visible

**Note:** PO should have identical permissions to PM

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

### 4. RESEARCHER Role Testing

**Test User:** researcher@dev.local

**Steps:**
1. Sign in as RESEARCHER
2. Navigate to /dashboard
3. Open sidebar (if not already open)
4. Take screenshot: `screenshots/sidebar-researcher.png`
5. Expand Research submenu
6. Take screenshot: `screenshots/sidebar-researcher-research-expanded.png`

**Expected Results:**
- ✅ Dashboard - visible
- ✅ Feedback - visible
- ✅ Roadmap - visible
- ✅ Research - visible (with submenu)
  - ✅ Sessions
  - ✅ Panels
  - ✅ Questionnaires
- ✅ Analytics - visible
- ✅ Settings - visible
- ❌ Features - NOT visible
- ❌ Moderation - NOT visible
- ❌ Admin Panel - NOT visible

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

### 5. MODERATOR Role Testing

**Test User:** moderator@dev.local

**Steps:**
1. Sign in as MODERATOR
2. Navigate to /dashboard
3. Open sidebar (if not already open)
4. Take screenshot: `screenshots/sidebar-moderator.png`

**Expected Results:**
- ✅ Dashboard - visible
- ✅ Feedback - visible
- ✅ Roadmap - visible
- ✅ Moderation - visible
- ✅ Settings - visible
- ❌ Features - NOT visible
- ❌ Research - NOT visible
- ❌ Analytics - NOT visible
- ❌ Admin Panel - NOT visible

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

### 6. ADMIN Role Testing

**Test User:** admin@dev.local

**Steps:**
1. Sign in as ADMIN
2. Navigate to /dashboard
3. Open sidebar (if not already open)
4. Take screenshot: `screenshots/sidebar-admin.png`
5. Expand Research submenu
6. Take screenshot: `screenshots/sidebar-admin-research-expanded.png`
7. Expand Admin Panel submenu
8. Take screenshot: `screenshots/sidebar-admin-panel-expanded.png`

**Expected Results:**
- ✅ Dashboard - visible
- ✅ Feedback - visible
- ✅ Features - visible
- ✅ Roadmap - visible
- ✅ Research - visible (with submenu)
  - ✅ Sessions
  - ✅ Panels
  - ✅ Questionnaires
- ✅ Analytics - visible
- ✅ Moderation - visible
- ✅ Admin Panel - visible (with submenu)
  - ✅ Users
  - ✅ Villages
- ✅ Settings - visible

**Note:** ADMIN should see ALL navigation items

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

## Additional Functional Tests

### 7. Navigation Item Functionality

**Test:** Verify navigation items navigate to correct routes

**Steps:**
1. Sign in as PM (has good coverage)
2. Click each navigation item
3. Verify URL changes correctly

**Expected Results:**
- Dashboard → `/dashboard`
- Feedback → `/feedback`
- Features → `/features`
- Roadmap → `/roadmap`
- Research > Sessions → `/research/sessions`
- Research > Panels → `/research/panels`
- Research > Questionnaires → `/research/questionnaires`
- Analytics → `/analytics`
- Settings → `/settings`

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

### 8. Active State Highlighting

**Test:** Verify active navigation item is highlighted

**Steps:**
1. Sign in as any user
2. Navigate to /feedback
3. Check sidebar shows Feedback as active
4. Navigate to /settings
5. Check sidebar shows Settings as active

**Expected Results:**
- Active item has different background color (accent color)
- Active item is visually distinct from non-active items
- Active state updates when navigating

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

### 9. Collapsible Section Persistence

**Test:** Verify collapsible sections maintain state

**Steps:**
1. Sign in as PM or ADMIN
2. Expand Research submenu
3. Navigate to another page
4. Return to Dashboard
5. Check if Research submenu state is maintained

**Expected Results:**
- Expanded state should persist across navigation (via localStorage)
- Or submenu should auto-expand when on a submenu route

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

### 10. Responsive Sidebar

**Test:** Verify sidebar works on mobile viewport

**Steps:**
1. Set browser to mobile viewport (375x667)
2. Sign in as any user
3. Check sidebar behavior

**Expected Results:**
- Sidebar should be collapsible on mobile
- Hamburger menu or toggle button visible
- All navigation items accessible

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

## Section Grouping Tests

### 11. Verify Sidebar Sections

**Test:** Check proper grouping of navigation items

**Steps:**
1. Sign in as ADMIN (to see all sections)
2. Verify section headers

**Expected Results:**
- PRODUCT section contains: Dashboard, Feedback, Features, Roadmap
- INSIGHTS section contains: Research, Analytics
- ADMIN section contains: Moderation, Admin Panel, Settings

**Verification:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________________________

---

## Test Summary

**Total Tests:** 11
**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Overall Status:** [ ] PASS / [ ] FAIL

---

## Issues Found

| # | Severity | Description | Role Affected | Screenshot |
|---|----------|-------------|---------------|------------|
| 1 |          |             |               |            |
| 2 |          |             |               |            |
| 3 |          |             |               |            |

---

## Screenshots Captured

Place all screenshots in `e2e/screenshots/` directory:

- [ ] `sidebar-user.png`
- [ ] `sidebar-pm.png`
- [ ] `sidebar-pm-research-expanded.png`
- [ ] `sidebar-po.png`
- [ ] `sidebar-researcher.png`
- [ ] `sidebar-researcher-research-expanded.png`
- [ ] `sidebar-moderator.png`
- [ ] `sidebar-admin.png`
- [ ] `sidebar-admin-research-expanded.png`
- [ ] `sidebar-admin-panel-expanded.png`

---

## Tester Information

**Name:** _____________________________
**Date:** _____________________________
**Environment:** _____________________________

---

## Approval

**Reviewed By:** _____________________________
**Date:** _____________________________
**Status:** [ ] APPROVED / [ ] NEEDS REVISION

---

## Notes & Observations

_____________________________________________________
_____________________________________________________
_____________________________________________________
_____________________________________________________
