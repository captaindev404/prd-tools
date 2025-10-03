# Empty States Visual Reference

## Component Usage Examples

### 1. Basic Empty State (No Action)

```tsx
<EmptyState
  icon={Calendar}
  title="No items available"
  description="There are currently no items to display."
/>
```

**Visual Layout:**
```
┌────────────────────────────────────┐
│                                    │
│            [Calendar Icon]         │
│              h-12 w-12             │
│          text-muted/50             │
│                                    │
│      No items available            │
│        (text-lg, semibold)         │
│                                    │
│  There are currently no items to   │
│           display.                 │
│    (text-sm, muted/80)             │
│                                    │
└────────────────────────────────────┘
```

---

### 2. Single Action Empty State

```tsx
<EmptyState
  icon={MessageSquare}
  title="No feedback yet"
  description="Share your first idea to get started."
  action={{
    label: "Submit Feedback",
    href: "/feedback/new",
    icon: Plus,
  }}
/>
```

**Visual Layout:**
```
┌────────────────────────────────────┐
│                                    │
│        [MessageSquare Icon]        │
│              h-12 w-12             │
│          text-muted/50             │
│                                    │
│        No feedback yet             │
│        (text-lg, semibold)         │
│                                    │
│   Share your first idea to get     │
│            started.                │
│    (text-sm, muted/80)             │
│                                    │
│   ┌──────────────────────┐        │
│   │ [+] Submit Feedback   │        │
│   │   (default variant)   │        │
│   └──────────────────────┘        │
│                                    │
└────────────────────────────────────┘
```

---

### 3. Multiple Actions Empty State

```tsx
<EmptyState
  icon={TrendingUp}
  title="No trending feedback yet"
  description="Be the first to submit feedback and get votes."
  actions={[
    {
      label: "Submit Feedback",
      href: "/feedback/new",
      variant: "default",
      icon: MessageSquare,
    },
    {
      label: "Browse All",
      href: "/feedback",
      variant: "outline",
    },
  ]}
/>
```

**Visual Layout (Desktop):**
```
┌────────────────────────────────────────────────┐
│                                                │
│            [TrendingUp Icon]                   │
│                h-12 w-12                       │
│            text-muted/50                       │
│                                                │
│      No trending feedback yet                  │
│          (text-lg, semibold)                   │
│                                                │
│  Be the first to submit feedback and get votes.│
│          (text-sm, muted/80)                   │
│                                                │
│   ┌───────────────────┐  ┌──────────────┐    │
│   │ [📝] Submit        │  │ Browse All   │    │
│   │    Feedback        │  │  (outline)   │    │
│   └───────────────────┘  └──────────────┘    │
│                                                │
└────────────────────────────────────────────────┘
```

**Visual Layout (Mobile):**
```
┌──────────────────────────┐
│                          │
│    [TrendingUp Icon]     │
│        h-12 w-12         │
│    text-muted/50         │
│                          │
│  No trending feedback    │
│          yet             │
│   (text-lg, semibold)    │
│                          │
│ Be the first to submit   │
│ feedback and get votes.  │
│   (text-sm, muted/80)    │
│                          │
│  ┌──────────────────┐   │
│  │ [📝] Submit      │   │
│  │    Feedback      │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │   Browse All     │   │
│  │   (outline)      │   │
│  └──────────────────┘   │
│                          │
└──────────────────────────┘
```

---

## Real Implementation Examples

### Dashboard - Trending Feedback
```tsx
// src/components/dashboard/trending-feedback.tsx
function EmptyStateTrending() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No trending feedback yet"
      description="Be the first to submit feedback and get votes to see trending ideas here."
      actions={[
        {
          label: 'Submit Feedback',
          href: '/feedback/new',
          variant: 'default',
          icon: MessageSquare,
        },
        {
          label: 'Browse All',
          href: '/feedback',
          variant: 'outline',
        },
      ]}
      size="sm"
    />
  );
}
```

---

### Dashboard - Recent Activity
```tsx
// src/components/dashboard/recent-activity.tsx
<EmptyState
  icon={Activity}
  title="No recent activity"
  description="Get started with Odyssey Feedback by submitting ideas or voting on existing feedback."
  actions={[
    {
      label: 'Submit Feedback',
      href: '/feedback/new',
      variant: 'default',
      icon: MessageSquare,
    },
    {
      label: 'Browse Ideas',
      href: '/feedback',
      variant: 'outline',
    },
  ]}
  size="sm"
/>
```

---

### Feedback List Page
```tsx
// src/app/feedback/page.tsx
<div className="border-2 border-dashed rounded-lg">
  <EmptyState
    icon={MessageSquare}
    title="No feedback found"
    description="Try adjusting your filters or be the first to submit feedback to help shape our products."
    action={{
      label: 'Submit Feedback',
      href: '/feedback/new',
      variant: 'default',
      icon: Plus,
    }}
  />
</div>
```

---

### Roadmap Page (Full Empty)
```tsx
// src/app/roadmap/page.tsx
{items.length === 0 && (
  <EmptyState
    icon={Calendar}
    title="No roadmap items yet"
    description={
      canCreate
        ? 'Get started by creating your first roadmap item to communicate upcoming features.'
        : 'Check back soon for updates to the product roadmap. New features and improvements are always in the works!'
    }
    action={
      canCreate
        ? {
            label: 'Create Roadmap Item',
            href: '/roadmap/new',
            variant: 'default',
            icon: Plus,
          }
        : undefined
    }
  />
)}
```

---

### Roadmap Page (Column Empty)
```tsx
// src/app/roadmap/page.tsx
<div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4">
  <div className="text-center py-4">
    <Calendar className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
    <p className="text-sm text-muted-foreground">
      No items in this stage
    </p>
  </div>
</div>
```

---

### Features Page
```tsx
// src/app/features/page.tsx
<div className="border-2 border-dashed rounded-lg">
  <EmptyState
    icon={Layers}
    title="No features found"
    description={
      canCreateFeature
        ? 'Try adjusting your filters or create the first feature to organize feedback.'
        : 'Try adjusting your filters to find features. Check back soon for updates!'
    }
    action={
      canCreateFeature
        ? {
            label: 'Create Feature',
            href: '/features/new',
            variant: 'default',
            icon: Plus,
          }
        : undefined
    }
  />
</div>
```

---

## Size Variants

### Small (`size="sm"`)
```tsx
<EmptyState
  icon={MessageSquare}
  title="No feedback"
  description="Submit your first idea."
  size="sm"
/>
```
- **Container**: py-6 sm:py-8
- **Icon**: h-10 w-10 sm:h-12 sm:w-12
- **Title**: text-base sm:text-lg
- **Description**: text-xs sm:text-sm
- **Use Case**: Dashboard cards, compact sections

---

### Medium (`size="md"`) - Default
```tsx
<EmptyState
  icon={MessageSquare}
  title="No feedback found"
  description="Try adjusting your filters or submit feedback."
  size="md"
/>
```
- **Container**: py-8 sm:py-12
- **Icon**: h-12 w-12
- **Title**: text-lg sm:text-xl
- **Description**: text-sm
- **Use Case**: Standard pages, list views

---

### Large (`size="lg"`)
```tsx
<EmptyState
  icon={MessageSquare}
  title="Welcome to Odyssey Feedback"
  description="Start sharing your ideas to help shape our products."
  size="lg"
/>
```
- **Container**: py-12 sm:py-16
- **Icon**: h-14 w-14 sm:h-16 sm:w-16
- **Title**: text-xl sm:text-2xl
- **Description**: text-sm sm:text-base
- **Use Case**: Hero sections, onboarding, major empty states

---

## Icon Library

### Recommended Icons by Context

| Context | Icon | Reason |
|---------|------|--------|
| Feedback | `MessageSquare` | Represents comments/ideas |
| Features | `Layers` | Represents modular components |
| Roadmap | `Calendar` | Represents timeline/planning |
| Trending | `TrendingUp` | Represents popularity |
| Activity | `Activity` | Represents user actions |
| Votes | `ThumbsUp` | Represents engagement |
| Search | `Search` | Represents filtering |
| Users | `Users` | Represents people |
| Notifications | `Bell` | Represents alerts |
| Analytics | `BarChart3` | Represents data |

---

## Color Palette

### Text Colors
- **Title**: `text-muted-foreground` (gray-600)
- **Description**: `text-muted-foreground/80` (gray-600 at 80% opacity)
- **Icon**: `text-muted-foreground/50` (gray-600 at 50% opacity)

### Button Colors
- **Primary**: `variant="default"` (blue background, white text)
- **Secondary**: `variant="outline"` (white background, border, gray text)
- **Tertiary**: `variant="ghost"` (transparent background, gray text)

---

## Accessibility Checklist

- ✅ **ARIA Attributes**: `role="status"` and `aria-live="polite"` on container
- ✅ **Semantic HTML**: Proper heading hierarchy (h3 for title)
- ✅ **Keyboard Navigation**: All buttons are keyboard accessible
- ✅ **Touch Targets**: Minimum 44px height on mobile (min-h-[44px])
- ✅ **Screen Readers**: Icon has `aria-hidden="true"` to avoid redundancy
- ✅ **Focus Indicators**: Clear focus rings on interactive elements
- ✅ **Color Contrast**: Meets WCAG AA standards (4.5:1 for text)

---

## Best Practices

### DO ✅
- Use action-oriented, encouraging language
- Provide clear next steps via CTAs
- Maintain consistent icon size (h-12 w-12)
- Use muted colors to reduce visual weight
- Center-align all content
- Support responsive layouts
- Include conditional actions based on user role

### DON'T ❌
- Use negative language ("No data", "Empty", "Nothing")
- Display without providing context or actions
- Override icon size inconsistently
- Use bright/saturated colors
- Left-align empty state content
- Forget mobile optimization
- Show actions users can't perform

---

## Copy Writing Guidelines

### Formula: Context + Encouragement + Action

#### Bad Examples
- ❌ "No data"
- ❌ "Empty list"
- ❌ "Nothing to show"
- ❌ "0 items found"

#### Good Examples
- ✅ "No feedback yet. Be the first to share your ideas!"
- ✅ "No trending items. Check back soon for popular feedback!"
- ✅ "No recent activity. Get started by submitting feedback!"
- ✅ "No features found. Try adjusting your filters!"

---

## Testing Checklist

### Visual Testing
- [ ] Icon displays at correct size (h-12 w-12)
- [ ] Icon color is muted (text-muted-foreground/50)
- [ ] Title is clearly visible (semibold)
- [ ] Description is readable (muted, not too faint)
- [ ] Buttons are properly sized (min-h-44px on mobile)
- [ ] Layout is centered

### Responsive Testing
- [ ] Mobile view: buttons stack vertically
- [ ] Desktop view: buttons display side-by-side
- [ ] Text wraps appropriately on narrow screens
- [ ] No horizontal scrolling

### Accessibility Testing
- [ ] Keyboard: Tab through all interactive elements
- [ ] Screen reader: Announces content properly
- [ ] Focus: Clear focus indicators visible
- [ ] Touch: All targets are at least 44px tall on mobile

### Functional Testing
- [ ] CTAs navigate to correct pages
- [ ] Conditional actions show/hide based on role
- [ ] Empty state replaces with data seamlessly (no layout shift)
- [ ] Component renders correctly in all contexts

---

## Maintenance Notes

### When to Update
- New section added → Create appropriate empty state
- User feedback on clarity → Refine copy
- Brand guidelines change → Update colors/styling
- New features added → Add role-based conditionals

### Version History
- **v1.0** (2025-10-03): Initial implementation
  - Reusable EmptyState component
  - 6 dashboard/page empty states
  - 3 size variants (sm, md, lg)
  - Full accessibility support

---

**Component Location**: `src/components/ui/empty-state.tsx`
**Documentation**: TASK-152-EMPTY-STATES-COMPLETION.md
**Design System**: Shadcn UI + Tailwind CSS
**Icons**: Lucide React
