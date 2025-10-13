# Task 57: Progress Indicator - Visual Design Guide

## Overview

This document describes the visual design and UX patterns implemented in the questionnaire creation form progress indicator.

---

## Progress Indicator Card

### Location
Positioned at the top of the form, immediately after any error/success alerts and before the tab navigation.

### Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Form Completion                       2/4 sections completed (50%)  │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░                      │
│  ✓ General Info   ✓ Questions   ○ Targeting   ○ Settings      │
└─────────────────────────────────────────────────────────────────┘
```

### Design Specs

**Card Container**:
- Border: Standard card border
- Left border: 4px solid primary color (visual accent)
- Padding: 24px (pt-6 pb-6)
- Background: Card background (white in light mode)

**Header Row**:
- Font size: 14px (text-sm)
- Left text: "Form Completion" (muted foreground, medium weight)
- Right text: "X/Y sections completed (Z%)" (foreground color, semibold)
- Flexbox layout with space-between

**Progress Bar**:
- Height: 10px (h-2.5)
- Background: Primary color at 20% opacity
- Fill: Primary color at 100%
- Border radius: Full rounded
- Smooth transition animation

**Section Checklist**:
- Grid layout: 2 columns on mobile, 4 columns on desktop
- Gap: 8px between items
- Font size: 12px (text-xs)
- Top padding: 8px (pt-2)

**Section Items**:
- Icon size: 14px (h-3.5 w-3.5)
- Icon spacing: 6px gap from text (gap-1.5)
- Complete icon: Green checkmark (text-green-600)
- Incomplete icon: Empty circle with muted border
- Complete text: Green color (text-green-700) with medium weight
- Incomplete text: Muted foreground color

---

## Tab Badges

### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [ General Info ✓ ] [ Questions ✓ ] [ Targeting & Settings ⚠ ] │
└─────────────────────────────────────────────────────────────┘
```

### Design Specs

**Tab Trigger**:
- Display: Flex with gap-2
- Text alignment: Center
- Padding: Standard tab padding

**Status Icons**:
- Size: 16px (h-4 w-4)
- Position: Right side of tab text
- Complete: Green checkmark (text-green-600)
- Incomplete: Alert circle (text-muted-foreground)
- ARIA label: "complete" or "incomplete"

**Active State**:
- Tab background: Active tab background
- Text: Active tab text color
- Icon color: Maintains status color (green or muted)

**Hover State**:
- Standard tab hover background
- Icon maintains status color

---

## Color Palette

### Complete State
- Icon: `text-green-600` (#16a34a in default theme)
- Text: `text-green-700` (#15803d in default theme)
- Weight: `font-medium` (500)

### Incomplete State
- Icon border: `border-muted-foreground/40` (muted at 40% opacity)
- Icon fill: None (empty circle)
- Text: `text-muted-foreground` (theme muted foreground)
- Weight: `font-normal` (400)

### Progress Bar
- Track: `bg-primary/20` (primary at 20% opacity)
- Fill: `bg-primary` (primary at 100%)
- Height: 10px
- Border radius: Fully rounded

---

## Responsive Behavior

### Mobile (< 768px)
- Section checklist: 2 columns
- Items stack vertically with good spacing
- Progress bar full width
- Tab text may wrap on very small screens

### Tablet (768px - 1024px)
- Section checklist: 4 columns
- All items in single row
- Tab text readable without wrapping

### Desktop (> 1024px)
- Section checklist: 4 columns
- Optimal spacing and alignment
- All content on single lines

---

## Accessibility Features

### Screen Reader Support
- Progress bar has `aria-label="Form X% complete"`
- Section status icons have `aria-label="complete"` or `aria-label="incomplete"`
- Tab status icons have same labels
- Visual status paired with text descriptions

### Keyboard Navigation
- Tab navigation works through all interactive elements
- Focus indicators on tabs
- No keyboard traps
- Standard tab switching (arrow keys within TabsList)

### Color Contrast
- Green checkmark: Meets WCAG AA for normal text
- Icon + text combination ensures redundancy
- Not relying solely on color to convey status

### Status Communication
- Multiple channels: icon, color, text, and position
- Works without color (icon shapes differ)
- Screen readers announce status through ARIA labels

---

## Animation & Transitions

### Progress Bar Fill
- Transition: `transition-all` (on ProgressPrimitive.Indicator)
- Duration: Default (150ms)
- Easing: Default ease
- Triggered on: State changes

### Tab Icon Changes
- No explicit transition (instant swap)
- React handles mounting/unmounting smoothly
- Could add fade-in if desired in future

### Section Status Changes
- Instant update (no animation)
- Clear visual feedback
- Future: Could add checkmark appear animation

---

## States & Variations

### Empty Form (0% Complete)
```
Form Completion                        0/4 sections completed (0%)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
○ General Info   ○ Questions   ○ Targeting   ○ Settings
```

### Title Entered (25% Complete)
```
Form Completion                        1/4 sections completed (25%)
████████░░░░░░░░░░░░░░░░░░░░░░░░
✓ General Info   ○ Questions   ○ Targeting   ○ Settings
```

### Questions Added (50% Complete)
```
Form Completion                        2/4 sections completed (50%)
████████████████░░░░░░░░░░░░░░░░
✓ General Info   ✓ Questions   ○ Targeting   ○ Settings
```

### Targeting Configured (75% Complete)
```
Form Completion                        3/4 sections completed (75%)
████████████████████████░░░░░░░░
✓ General Info   ✓ Questions   ✓ Targeting   ○ Settings
```

### All Complete (100% Complete)
```
Form Completion                        4/4 sections completed (100%)
████████████████████████████████
✓ General Info   ✓ Questions   ✓ Targeting   ✓ Settings
```

---

## Implementation Details

### Component Hierarchy

```
<form>
  ├─ <Alert> (errors/success)
  ├─ <div> (screen reader announcements)
  ├─ <Card> (Progress Indicator) ✨ NEW
  │   └─ <CardContent>
  │       ├─ <div> (header row with text)
  │       ├─ <Progress> (progress bar)
  │       └─ <div> (section checklist grid)
  │           ├─ <div> (General Info)
  │           ├─ <div> (Questions)
  │           ├─ <div> (Targeting)
  │           └─ <div> (Settings)
  ├─ <Tabs>
  │   ├─ <TabsList>
  │   │   ├─ <TabsTrigger> "General Info" + Icon ✨ ENHANCED
  │   │   ├─ <TabsTrigger> "Questions" + Icon ✨ ENHANCED
  │   │   └─ <TabsTrigger> "Targeting & Settings" + Icon ✨ ENHANCED
  │   └─ <TabsContent> (3 tabs)
  └─ <div> (action buttons)
```

### State Dependencies

The progress indicator reacts to these state variables:
- `title` → isGeneralInfoComplete()
- `questions` → isQuestionsComplete()
- `targetingType`, `selectedPanels` → isTargetingComplete()
- `startAt`, `endAt` → isResponseSettingsComplete()

### Computation Cost

- Validation functions: O(n) where n = questions.length
- Typically n < 20, so very fast
- Runs on every render (acceptable performance)
- No memoization needed at current scale

---

## User Experience Flow

### First Visit
1. User lands on form → sees 0% or 25% (settings may be valid)
2. Progress indicator immediately visible
3. All tabs show alert icons
4. Clear what needs to be done

### During Completion
1. User enters title → checkmark appears on General Info
2. Progress bar animates to 25%
3. Section checklist updates in real-time
4. Tab badge changes from alert to checkmark
5. User gets positive reinforcement

### Pre-Submission
1. User sees 4/4 (100%) complete
2. All sections have green checkmarks
3. Confidence to click "Save & Publish"
4. Reduced anxiety about missing fields

### Error Recovery
1. If validation fails, error alert shows
2. Progress indicator helps locate issue
3. User can see which section failed
4. Quick navigation to fix problem

---

## Future Enhancement Ideas

### Interactive Progress Card
- Click section name to jump to that tab
- Highlight current tab in progress card
- Show sub-items (e.g., "2/3 fields complete")

### Enhanced Animations
- Confetti or celebration at 100%
- Smooth progress bar animation
- Checkmark scale-in animation
- Pulse effect on newly completed sections

### Detailed Tooltips
- Hover section name for requirements
- Show specific validation rules
- Example: "Title must be 3-200 characters"

### Collapsible Progress
- Minimize to single line after first complete
- Expand on hover or click
- Save vertical space on long forms

### Progress Persistence
- Save completion state in localStorage
- Show "last saved" timestamp
- Resume from last tab on return

---

## Browser Testing

Tested and working in:
- Chrome 120+ ✓
- Firefox 120+ ✓
- Safari 17+ ✓
- Edge 120+ ✓

Visual consistency across:
- macOS (Chrome, Safari, Firefox)
- Windows (Chrome, Edge, Firefox)
- Mobile browsers (Safari iOS, Chrome Android)

---

## Conclusion

The progress indicator provides clear, accessible, and motivating feedback to users as they complete the questionnaire creation form. The design is:

- **Visually Clear**: Easy to scan and understand at a glance
- **Non-Intrusive**: Present but not overwhelming
- **Accessible**: Works with screen readers and keyboard navigation
- **Responsive**: Adapts gracefully to all screen sizes
- **Performant**: No impact on form responsiveness
- **Consistent**: Follows Shadcn UI design language

The implementation successfully enhances the UX without adding complexity or technical debt.
