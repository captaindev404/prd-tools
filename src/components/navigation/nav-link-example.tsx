/**
 * NavLink Component Usage Examples
 *
 * This file demonstrates various ways to use the NavLink component
 * for navigation with active state detection.
 */

import { NavLink } from './nav-link';
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Users,
  Settings,
  FileText,
  BarChart3,
} from 'lucide-react';

/**
 * Example 1: Main Navigation Sidebar
 */
export function MainNavigationExample() {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {/* Dashboard with exact match - only active on /dashboard, not /dashboard/settings */}
      <NavLink href="/dashboard" icon={LayoutDashboard} exactMatch>
        Dashboard
      </NavLink>

      {/* Feedback with prefix match - active on /feedback, /feedback/new, /feedback/123 */}
      <NavLink href="/feedback" icon={MessageSquare}>
        Feedback
      </NavLink>

      {/* Roadmap section */}
      <NavLink href="/roadmap" icon={TrendingUp}>
        Roadmap
      </NavLink>

      {/* Research panels */}
      <NavLink href="/research" icon={Users}>
        Research
      </NavLink>

      {/* Settings */}
      <NavLink href="/settings" icon={Settings}>
        Settings
      </NavLink>
    </nav>
  );
}

/**
 * Example 2: Navigation with Custom Styling
 */
export function StyledNavigationExample() {
  return (
    <nav className="flex flex-col gap-2 p-4">
      <NavLink
        href="/dashboard"
        icon={LayoutDashboard}
        exactMatch
        className="px-3 py-2 rounded-md hover:bg-accent"
      >
        Dashboard
      </NavLink>

      <NavLink
        href="/feedback"
        icon={MessageSquare}
        className="px-3 py-2 rounded-md hover:bg-accent"
      >
        Feedback
      </NavLink>

      <NavLink
        href="/analytics"
        icon={BarChart3}
        className="px-3 py-2 rounded-md hover:bg-accent"
      >
        Analytics
      </NavLink>
    </nav>
  );
}

/**
 * Example 3: Horizontal Navigation (Header)
 */
export function HorizontalNavigationExample() {
  return (
    <nav className="flex items-center gap-6 px-6 py-4 border-b">
      <NavLink href="/dashboard" icon={LayoutDashboard} exactMatch>
        Dashboard
      </NavLink>

      <NavLink href="/feedback" icon={MessageSquare}>
        Feedback
      </NavLink>

      <NavLink href="/roadmap" icon={TrendingUp}>
        Roadmap
      </NavLink>

      <NavLink href="/research" icon={Users}>
        Research
      </NavLink>
    </nav>
  );
}

/**
 * Example 4: Navigation Without Icons
 */
export function TextOnlyNavigationExample() {
  return (
    <nav className="flex flex-col gap-1 p-4">
      <NavLink href="/dashboard" exactMatch>
        Dashboard
      </NavLink>

      <NavLink href="/feedback">
        Feedback
      </NavLink>

      <NavLink href="/roadmap">
        Roadmap
      </NavLink>

      <NavLink href="/research">
        Research Panels
      </NavLink>

      <NavLink href="/settings">
        Settings
      </NavLink>
    </nav>
  );
}

/**
 * Example 5: Nested Navigation with Sections
 */
export function NestedNavigationExample() {
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Main Section */}
      <div>
        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Main
        </h3>
        <nav className="flex flex-col gap-1">
          <NavLink href="/dashboard" icon={LayoutDashboard} exactMatch>
            Dashboard
          </NavLink>
          <NavLink href="/feedback" icon={MessageSquare}>
            Feedback
          </NavLink>
        </nav>
      </div>

      {/* Product Section */}
      <div>
        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Product
        </h3>
        <nav className="flex flex-col gap-1">
          <NavLink href="/roadmap" icon={TrendingUp}>
            Roadmap
          </NavLink>
          <NavLink href="/features" icon={FileText}>
            Features
          </NavLink>
        </nav>
      </div>

      {/* Research Section */}
      <div>
        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Research
        </h3>
        <nav className="flex flex-col gap-1">
          <NavLink href="/research" icon={Users}>
            Panels
          </NavLink>
          <NavLink href="/research/questionnaires" icon={FileText}>
            Questionnaires
          </NavLink>
          <NavLink href="/research/sessions" icon={Users}>
            Sessions
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

/**
 * Example 6: Mobile Navigation (Vertical Stack)
 */
export function MobileNavigationExample() {
  return (
    <nav className="flex flex-col w-full">
      <NavLink
        href="/dashboard"
        icon={LayoutDashboard}
        exactMatch
        className="px-4 py-3 border-b hover:bg-accent"
      >
        Dashboard
      </NavLink>

      <NavLink
        href="/feedback"
        icon={MessageSquare}
        className="px-4 py-3 border-b hover:bg-accent"
      >
        Feedback
      </NavLink>

      <NavLink
        href="/roadmap"
        icon={TrendingUp}
        className="px-4 py-3 border-b hover:bg-accent"
      >
        Roadmap
      </NavLink>

      <NavLink
        href="/research"
        icon={Users}
        className="px-4 py-3 border-b hover:bg-accent"
      >
        Research
      </NavLink>

      <NavLink
        href="/settings"
        icon={Settings}
        className="px-4 py-3 hover:bg-accent"
      >
        Settings
      </NavLink>
    </nav>
  );
}

/**
 * Example 7: Tab-Style Navigation
 */
export function TabNavigationExample() {
  return (
    <nav className="flex items-center gap-1 border-b">
      <NavLink
        href="/feedback"
        exactMatch
        className="px-4 py-3 border-b-2 border-transparent data-[active=true]:border-primary"
      >
        All Feedback
      </NavLink>

      <NavLink
        href="/feedback/my"
        className="px-4 py-3 border-b-2 border-transparent data-[active=true]:border-primary"
      >
        My Feedback
      </NavLink>

      <NavLink
        href="/feedback/following"
        className="px-4 py-3 border-b-2 border-transparent data-[active=true]:border-primary"
      >
        Following
      </NavLink>
    </nav>
  );
}
