'use client';

import { PanelCard } from './panel-card';
import { useRouter } from 'next/navigation';

/**
 * Example usage of the PanelCard component.
 *
 * This example demonstrates:
 * - Basic panel card display
 * - Panel card with edit and archive actions
 * - Grid layout for multiple cards
 * - Responsive design behavior
 */
export function PanelCardExample() {
  const router = useRouter();

  // Sample panel data
  const samplePanels = [
    {
      id: 'pan_01HQXYZ123ABC',
      name: 'Mobile App Beta Testers',
      description: 'A panel of users testing the new mobile app features including check-in, payments, and digital key access. We are looking for feedback on usability and performance.',
      memberCount: 24,
      sizeTarget: 30,
      archived: false,
      creator: {
        id: 'usr_01HQXYZ789DEF',
        displayName: 'Sarah Johnson',
        email: 'sarah.johnson@clubmed.com',
        role: 'RESEARCHER' as const,
      },
      createdById: 'usr_01HQXYZ789DEF',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'pan_01HQXYZ456GHI',
      name: 'Housekeeping Staff Feedback',
      description: 'Panel for housekeeping staff to provide feedback on the new room management system.',
      memberCount: 12,
      sizeTarget: 15,
      archived: false,
      creator: {
        id: 'usr_01HQXYZ789DEF',
        displayName: 'Sarah Johnson',
        email: 'sarah.johnson@clubmed.com',
        role: 'RESEARCHER' as const,
      },
      createdById: 'usr_01HQXYZ789DEF',
      createdAt: new Date('2024-02-01'),
    },
    {
      id: 'pan_01HQXYZ789JKL',
      name: 'Archived Test Panel',
      description: 'This panel has been archived after completing the research study.',
      memberCount: 8,
      sizeTarget: 10,
      archived: true,
      creator: {
        id: 'usr_01HQXYZ789MNO',
        displayName: 'Mike Chen',
        email: 'mike.chen@clubmed.com',
        role: 'PM' as const,
      },
      createdById: 'usr_01HQXYZ789MNO',
      createdAt: new Date('2024-01-01'),
    },
  ];

  const handleEdit = (panelId: string) => {
    console.log('Edit panel:', panelId);
    router.push(`/research/panels/${panelId}/edit`);
  };

  const handleArchive = (panelId: string) => {
    console.log('Archive panel:', panelId);
    // In a real app, this would call an API endpoint to archive the panel
    alert(`Archive panel: ${panelId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PanelCard Component Examples</h1>
        <p className="text-muted-foreground">
          Demonstration of the PanelCard component in various configurations
        </p>
      </div>

      {/* Example 1: Basic panel card without actions */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Basic Panel Card (No Actions)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PanelCard panel={samplePanels[0]} />
        </div>
      </section>

      {/* Example 2: Panel card with edit and archive actions */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Panel Card with Edit & Archive Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PanelCard
            panel={samplePanels[1]}
            currentUserId="usr_01HQXYZ789DEF"
            canEdit={true}
            canArchive={true}
            onEdit={handleEdit}
            onArchive={handleArchive}
          />
        </div>
      </section>

      {/* Example 3: Archived panel */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Archived Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PanelCard
            panel={samplePanels[2]}
            currentUserId="usr_01HQXYZ789DEF"
            canEdit={true}
            canArchive={true}
            onEdit={handleEdit}
            onArchive={handleArchive}
          />
        </div>
      </section>

      {/* Example 4: Multiple panels in grid layout */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Grid Layout (Responsive: 1 column on mobile, 2 on tablet, 3 on desktop)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {samplePanels.map((panel) => (
            <PanelCard
              key={panel.id}
              panel={panel}
              currentUserId="usr_01HQXYZ789DEF"
              canEdit={true}
              canArchive={true}
              onEdit={handleEdit}
              onArchive={handleArchive}
            />
          ))}
        </div>
      </section>

      {/* Example 5: Panel without description */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Panel Without Description</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PanelCard
            panel={{
              ...samplePanels[0],
              description: null,
            }}
            canEdit={true}
            onEdit={handleEdit}
          />
        </div>
      </section>

      {/* Documentation */}
      <section className="mt-12 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Component Features</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Panel Name:</strong> Displayed as CardTitle with 2-line clamp for long names
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Description:</strong> Truncated to 120 characters with ellipsis, 2-line clamp
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Creator Name:</strong> Shows display name or email prefix
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Member Count:</strong> Shows count with proper singular/plural
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Archived Badge:</strong> Gray badge with archive icon for archived panels
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Link to Detail:</strong> Entire card is clickable, links to
              /research/panels/[id]
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Edit Button:</strong> Shows only if canEdit=true with permission check
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Archive Button:</strong> Shows only if canArchive=true and panel is not
              archived
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Responsive Design:</strong> Text labels hide on small screens, icons remain
              visible
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Accessibility:</strong> Proper ARIA labels on action buttons
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
