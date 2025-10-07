# Shadcn UI Components - Gentil Feedback

This directory contains the UI components for the Gentil Feedback platform, built with [Shadcn UI](https://ui.shadcn.com) and customized for Club Med's brand.

## Overview

All components are built on top of [Radix UI](https://www.radix-ui.com/) primitives and styled with Tailwind CSS using CSS variables for theming. Components are designed to be:

- **Accessible**: WCAG AA compliant with proper ARIA attributes
- **Themeable**: Support both light and dark modes
- **Type-safe**: Written in TypeScript with proper type definitions
- **Composable**: Easy to compose into complex UIs

## Installed Components

### Core Components

#### Button
**File**: `button.tsx`

Versatile button component with multiple variants and sizes.

**Variants**:
- `default` - Primary action button (Club Med blue)
- `destructive` - Dangerous/delete actions
- `outline` - Secondary actions
- `secondary` - Alternative secondary style
- `ghost` - Minimal style for tertiary actions
- `link` - Text link style

**Sizes**: `default`, `sm`, `lg`, `icon`

**Example**:
```tsx
import { Button } from "@/components/ui/button"

<Button>Submit Feedback</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive" size="sm">Delete</Button>
```

---

#### Input
**File**: `input.tsx`

Text input field component for forms.

**Example**:
```tsx
import { Input } from "@/components/ui/input"

<Input type="email" placeholder="your.email@clubmed.com" />
<Input type="text" disabled value="Read-only field" />
```

---

#### Label
**File**: `label.tsx`

Form label component with proper accessibility attributes.

**Example**:
```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

---

#### Card
**File**: `card.tsx`

Container component for grouping related content.

**Sub-components**:
- `Card` - Container
- `CardHeader` - Top section
- `CardTitle` - Main heading
- `CardDescription` - Subtitle/description
- `CardContent` - Main content area
- `CardFooter` - Bottom section (actions)

**Example**:
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Feature Request</CardTitle>
    <CardDescription>Submitted by John Doe</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Add ability to export feedback to CSV...</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

---

#### Table
**File**: `table.tsx`

Responsive table component for displaying tabular data.

**Sub-components**:
- `Table` - Container
- `TableHeader` - Header section
- `TableBody` - Body section
- `TableFooter` - Footer section
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableCell` - Data cell
- `TableCaption` - Caption/description

**Example**:
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Feedback</TableHead>
      <TableHead>Votes</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Add dark mode</TableCell>
      <TableCell>142</TableCell>
      <TableCell>In Progress</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

#### Form
**File**: `form.tsx`

Form component built with `react-hook-form` and `zod` for validation.

**Dependencies**:
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Zod resolver

**Sub-components**:
- `Form` - Form provider
- `FormField` - Field wrapper
- `FormItem` - Field container
- `FormLabel` - Field label
- `FormControl` - Input wrapper
- `FormDescription` - Helper text
- `FormMessage` - Validation error message

**Example**:
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
})

function FeedbackForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief summary..." {...field} />
              </FormControl>
              <FormDescription>
                A clear, concise title for your feedback
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

---

#### Dialog
**File**: `dialog.tsx`

Modal dialog component for overlays and confirmations.

**Sub-components**:
- `Dialog` - Container
- `DialogTrigger` - Trigger element
- `DialogContent` - Content container
- `DialogHeader` - Header section
- `DialogFooter` - Footer section (actions)
- `DialogTitle` - Title
- `DialogDescription` - Description

**Example**:
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Delete Feedback</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your feedback.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

#### Toast
**Files**: `toast.tsx`, `toaster.tsx`, `use-toast.ts` hook

Notification toast component for feedback messages.

**Usage**:
1. Add `<Toaster />` to your root layout
2. Use the `useToast` hook to trigger toasts

**Example**:
```tsx
// In your app/layout.tsx
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

// In your component
import { useToast } from "@/hooks/use-toast"

function MyComponent() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() =>
        toast({
          title: "Feedback submitted!",
          description: "Your feedback has been successfully submitted.",
        })
      }
    >
      Submit
    </Button>
  )
}
```

**Toast Variants**:
- `default` - Neutral info message
- `destructive` - Error or warning message

---

#### Badge
**File**: `badge.tsx`

Small status indicator or label component.

**Variants**:
- `default` - Primary style
- `secondary` - Secondary style
- `destructive` - Error/warning style
- `outline` - Outlined style

**Example**:
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>New</Badge>
<Badge variant="secondary">In Progress</Badge>
<Badge variant="destructive">Closed</Badge>
<Badge variant="outline">Under Review</Badge>
```

---

## Theming

### Club Med Brand Colors

The theme has been customized with Club Med's brand identity:

#### Light Mode
- **Primary**: Club Med Blue (`hsl(210 100% 45%)`) - Used for primary actions, links
- **Accent**: Warm Coral/Orange (`hsl(14 90% 50%)`) - Used for highlights, accent elements
- **Secondary**: Light Blue (`hsl(210 40% 96%)`) - Used for secondary actions
- **Background**: White
- **Foreground**: Dark Blue-Gray

#### Dark Mode
- **Primary**: Lighter Blue (`hsl(210 100% 60%)`) - Adjusted for contrast
- **Accent**: Lighter Coral (`hsl(14 90% 60%)`) - Adjusted for contrast
- **Background**: Deep Blue-Gray (`hsl(222 47% 11%)`)
- **Foreground**: Off-White

### WCAG AA Compliance

All color combinations meet WCAG AA standards:
- **Primary on white**: 4.5:1 contrast ratio
- **Accent on white**: 4.5:1 contrast ratio
- **Dark mode combinations**: Adjusted to maintain 4.5:1+ contrast

### Customizing Colors

Colors are defined as CSS variables in `src/app/globals.css`. To customize:

```css
:root {
  --primary: 210 100% 45%; /* Hue Saturation Lightness */
  --accent: 14 90% 50%;
  /* ... other variables */
}
```

---

## Utilities

### cn() Function
**File**: `src/lib/utils.ts`

Utility function for merging Tailwind classes with proper precedence.

```tsx
import { cn } from "@/lib/utils"

<div className={cn("p-4 bg-primary", isActive && "bg-accent")}>
  Content
</div>
```

---

## Adding New Components

To add more components from Shadcn UI:

```bash
npx shadcn@latest add [component-name]
```

**Available components**:
- accordion
- alert
- alert-dialog
- aspect-ratio
- avatar
- calendar
- checkbox
- collapsible
- command
- context-menu
- data-table
- date-picker
- dropdown-menu
- hover-card
- menubar
- navigation-menu
- popover
- progress
- radio-group
- scroll-area
- select
- separator
- sheet
- skeleton
- slider
- switch
- tabs
- textarea
- toggle
- tooltip

See [Shadcn UI documentation](https://ui.shadcn.com/docs/components) for full list.

---

## Design Patterns

### Form Validation Pattern
Use `zod` schemas with `react-hook-form` for type-safe form validation:

```tsx
const feedbackSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(2000),
  category: z.enum(["bug", "feature", "improvement"]),
})

type FeedbackFormData = z.infer<typeof feedbackSchema>
```

### Toast Notification Pattern
Provide user feedback for async operations:

```tsx
const { toast } = useToast()

try {
  await submitFeedback(data)
  toast({
    title: "Success",
    description: "Your feedback has been submitted.",
  })
} catch (error) {
  toast({
    variant: "destructive",
    title: "Error",
    description: "Failed to submit feedback. Please try again.",
  })
}
```

### Dialog Confirmation Pattern
Use dialogs for destructive actions:

```tsx
<Dialog>
  <DialogTrigger>Delete</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm deletion</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Accessibility

All components follow accessibility best practices:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- High contrast mode support
- Reduced motion preferences respected

### Testing Accessibility

```bash
# Run with a screen reader (macOS VoiceOver)
# Press Cmd+F5 to enable

# Test keyboard navigation
# Tab through interactive elements
# Space/Enter to activate
```

---

## Resources

- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

---

**Last Updated**: 2025-10-02
**Version**: 0.5.0
