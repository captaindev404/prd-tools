/**
 * Theme Demo Page
 *
 * Showcases Club Med brand colors and Shadcn UI components
 * Navigate to /theme-demo to view this page
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ThemeDemoPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Odyssey Feedback - Theme Demo</h1>
        <p className="text-muted-foreground">
          Club Med brand colors with Shadcn UI components
        </p>
      </div>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>Club Med color palette (WCAG AA compliant)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-primary" />
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">Club Med Blue</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-accent" />
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">Warm Coral</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-secondary" />
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">Light Blue</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-muted" />
              <p className="text-sm font-medium">Muted</p>
              <p className="text-xs text-muted-foreground">Neutral Gray</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Various button styles and sizes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators and labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input fields and labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Feedback Title</Label>
            <Input id="title" placeholder="Enter your feedback title..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your.email@clubmed.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disabled">Disabled Input</Label>
            <Input id="disabled" disabled value="This field is disabled" />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Submit Feedback</Button>
        </CardFooter>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
          <CardDescription>Sample feedback list</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feedback</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Add dark mode support</TableCell>
                <TableCell>John Doe</TableCell>
                <TableCell>142</TableCell>
                <TableCell>
                  <Badge variant="secondary">In Progress</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Improve mobile navigation</TableCell>
                <TableCell>Jane Smith</TableCell>
                <TableCell>89</TableCell>
                <TableCell>
                  <Badge>New</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Export feedback to CSV</TableCell>
                <TableCell>Mike Johnson</TableCell>
                <TableCell>67</TableCell>
                <TableCell>
                  <Badge variant="outline">Under Review</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Fix login bug on Safari</TableCell>
                <TableCell>Sarah Wilson</TableCell>
                <TableCell>203</TableCell>
                <TableCell>
                  <Badge variant="destructive">Closed</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Text styles and hierarchy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-semibold">Heading 3</h3>
            <h4 className="text-xl font-semibold">Heading 4</h4>
          </div>
          <div className="space-y-2">
            <p className="text-base">
              This is regular body text. It has good contrast and readability.
            </p>
            <p className="text-sm text-muted-foreground">
              This is muted text, used for secondary information.
            </p>
            <p className="text-xs text-muted-foreground">
              This is small text, used for captions and labels.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Note */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>WCAG 2.1 AA Compliance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            All color combinations meet WCAG AA standards with contrast ratios of 4.5:1 or higher.
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Primary Blue on white: 4.56:1 ✓</li>
            <li>Accent Coral on white: 4.52:1 ✓</li>
            <li>Text on background: 15.8:1 ✓</li>
            <li>Dark mode combinations: 6.2:1+ ✓</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
