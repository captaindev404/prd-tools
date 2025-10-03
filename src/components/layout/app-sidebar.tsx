'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  LayoutGrid,
  Map,
  Settings,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Users,
  ClipboardList,
  Video,
  ShieldCheck,
  BarChart3,
  Building2,
  UserCog,
} from 'lucide-react';
import { Role } from '@prisma/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/**
 * Navigation Item Type Definition
 */
type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: Role[];
  badge?: string;
  subItems?: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
};

/**
 * Navigation Section Type
 */
type NavSection = {
  title: string;
  items: NavItem[];
};

/**
 * Navigation Configuration
 * Defines the complete sidebar structure with role-based access control
 */
const navigationConfig: NavSection[] = [
  {
    title: 'PRODUCT',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        allowedRoles: [Role.USER, Role.PM, Role.PO, Role.RESEARCHER, Role.ADMIN, Role.MODERATOR],
      },
      {
        title: 'Feedback',
        href: '/feedback',
        icon: MessageSquare,
        allowedRoles: [Role.USER, Role.PM, Role.PO, Role.RESEARCHER, Role.ADMIN, Role.MODERATOR],
      },
      {
        title: 'Features',
        href: '/features',
        icon: LayoutGrid,
        allowedRoles: [Role.PM, Role.PO, Role.ADMIN],
      },
      {
        title: 'Roadmap',
        href: '/roadmap',
        icon: Map,
        allowedRoles: [Role.USER, Role.PM, Role.PO, Role.RESEARCHER, Role.ADMIN, Role.MODERATOR],
      },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      {
        title: 'Research',
        href: '/research/sessions',
        icon: FlaskConical,
        allowedRoles: [Role.RESEARCHER, Role.PM, Role.PO, Role.ADMIN],
        subItems: [
          {
            title: 'Sessions',
            href: '/research/sessions',
            icon: Video,
          },
          {
            title: 'Panels',
            href: '/research/panels',
            icon: Users,
          },
          {
            title: 'Questionnaires',
            href: '/research/questionnaires',
            icon: ClipboardList,
          },
        ],
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        allowedRoles: [Role.PM, Role.PO, Role.RESEARCHER, Role.ADMIN],
      },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      {
        title: 'Moderation',
        href: '/moderation',
        icon: ShieldCheck,
        allowedRoles: [Role.MODERATOR, Role.ADMIN],
      },
      {
        title: 'Admin Panel',
        href: '/admin',
        icon: UserCog,
        allowedRoles: [Role.ADMIN],
        subItems: [
          {
            title: 'Users',
            href: '/admin/users',
            icon: Users,
          },
          {
            title: 'Villages',
            href: '/admin/villages',
            icon: Building2,
          },
        ],
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        allowedRoles: [Role.USER, Role.PM, Role.PO, Role.RESEARCHER, Role.ADMIN, Role.MODERATOR],
      },
    ],
  },
];

/**
 * Props for AppSidebar
 */
interface AppSidebarProps {
  userRole: Role;
}

/**
 * AppSidebar Component
 *
 * Main navigation sidebar for the Odyssey Feedback platform.
 * Features:
 * - Role-based navigation filtering
 * - Collapsible sections for hierarchical navigation
 * - Active state highlighting
 * - Responsive design with mobile support
 * - Accessible keyboard navigation
 *
 * @param userRole - Current user's role for filtering navigation items
 */
export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  // Initialize open sections based on active route and localStorage
  React.useEffect(() => {
    const initialOpenSections: Record<string, boolean> = {};

    navigationConfig.forEach((section) => {
      section.items.forEach((item) => {
        if (item.subItems) {
          // Check localStorage first
          const storageKey = `sidebar-${item.href.replace('/', '')}-expanded`;
          const storedValue = localStorage.getItem(storageKey);

          if (storedValue !== null) {
            // Use stored value if available
            initialOpenSections[item.href] = storedValue === 'true';
          } else {
            // Fall back to active route detection
            const isActive =
              pathname === item.href ||
              item.subItems.some((subItem) => pathname.startsWith(subItem.href));
            initialOpenSections[item.href] = isActive;
          }
        }
      });
    });

    setOpenSections(initialOpenSections);
  }, [pathname]);

  /**
   * Filter navigation items based on user role
   */
  const filterByRole = (items: NavItem[]): NavItem[] => {
    return items.filter((item) => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.includes(userRole);
    });
  };

  /**
   * Toggle section open/close state and persist to localStorage
   */
  const toggleSection = (href: string) => {
    setOpenSections((prev) => {
      const newState = !prev[href];
      const storageKey = `sidebar-${href.replace('/', '')}-expanded`;
      localStorage.setItem(storageKey, String(newState));
      return {
        ...prev,
        [href]: newState,
      };
    });
  };

  /**
   * Check if a route is active
   */
  const isActive = (href: string, subItems?: NavItem['subItems']) => {
    if (pathname === href) return true;
    if (subItems) {
      return subItems.some((subItem) => pathname.startsWith(subItem.href));
    }
    return pathname.startsWith(href) && href !== '/dashboard';
  };

  return (
    <Sidebar>
      <SidebarContent>
        {navigationConfig.map((section) => {
          const filteredItems = filterByRole(section.items);

          // Don't render empty sections
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const ItemIcon = item.icon;
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isItemActive = isActive(item.href, item.subItems);
                    const isOpen = openSections[item.href];

                    if (hasSubItems) {
                      return (
                        <Collapsible
                          key={item.href}
                          open={isOpen}
                          onOpenChange={() => toggleSection(item.href)}
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                className={cn(
                                  'w-full',
                                  isItemActive && 'bg-accent text-accent-foreground'
                                )}
                              >
                                <ItemIcon className="h-4 w-4" />
                                <span>{item.title}</span>
                                {item.badge && (
                                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                                    {item.badge}
                                  </span>
                                )}
                                {isOpen ? (
                                  <ChevronDown className="ml-auto h-4 w-4 transition-transform" />
                                ) : (
                                  <ChevronRight className="ml-auto h-4 w-4 transition-transform" />
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subItems?.map((subItem) => {
                                  const SubIcon = subItem.icon;
                                  const isSubItemActive = pathname.startsWith(subItem.href);

                                  return (
                                    <SidebarMenuSubItem key={subItem.href}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={isSubItemActive}
                                      >
                                        <Link href={subItem.href}>
                                          {SubIcon && <SubIcon className="h-4 w-4" />}
                                          <span>{subItem.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isItemActive}>
                          <Link href={item.href}>
                            <ItemIcon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}