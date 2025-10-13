/**
 * Recently Used Panels Storage
 *
 * Manages localStorage persistence for recently used research panels.
 * Tracks last 5 panels used by the current user.
 */

const STORAGE_KEY = 'gentil_feedback_recent_panels';
const MAX_RECENT_PANELS = 5;

export interface RecentPanelEntry {
  panelId: string;
  timestamp: number;
}

/**
 * Get recently used panel IDs from localStorage
 * @returns Array of panel IDs, most recent first
 */
export function getRecentPanels(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const entries: RecentPanelEntry[] = JSON.parse(stored);

    // Validate structure
    if (!Array.isArray(entries)) {
      console.warn('Invalid recent panels data structure, resetting');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Return just the panel IDs, sorted by timestamp (most recent first)
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(entry => entry.panelId)
      .slice(0, MAX_RECENT_PANELS);
  } catch (error) {
    console.error('Error reading recent panels from localStorage:', error);
    return [];
  }
}

/**
 * Add a panel to the recently used list
 * @param panelId - Panel ID to add
 */
export function addRecentPanel(panelId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!panelId || typeof panelId !== 'string') {
    console.warn('Invalid panel ID provided to addRecentPanel');
    return;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let entries: RecentPanelEntry[] = stored ? JSON.parse(stored) : [];

    // Validate structure
    if (!Array.isArray(entries)) {
      entries = [];
    }

    // Remove existing entry for this panel (if any)
    entries = entries.filter(entry => entry.panelId !== panelId);

    // Add new entry at the beginning
    entries.unshift({
      panelId,
      timestamp: Date.now(),
    });

    // Keep only the most recent MAX_RECENT_PANELS entries
    entries = entries.slice(0, MAX_RECENT_PANELS);

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving recent panel to localStorage:', error);
  }
}

/**
 * Add multiple panels to the recently used list
 * @param panelIds - Array of panel IDs to add
 */
export function addRecentPanels(panelIds: string[]): void {
  if (!Array.isArray(panelIds) || panelIds.length === 0) {
    return;
  }

  // Add panels in reverse order so the first one in the array is most recent
  for (let i = panelIds.length - 1; i >= 0; i--) {
    const panelId = panelIds[i];
    if (panelId) {
      addRecentPanel(panelId);
    }
  }
}

/**
 * Clear all recently used panels
 */
export function clearRecentPanels(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recent panels from localStorage:', error);
  }
}

/**
 * Check if a panel is in the recently used list
 * @param panelId - Panel ID to check
 * @returns true if panel is in recent list
 */
export function isRecentPanel(panelId: string): boolean {
  const recentIds = getRecentPanels();
  return recentIds.includes(panelId);
}
