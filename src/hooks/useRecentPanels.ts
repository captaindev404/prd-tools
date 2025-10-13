/**
 * useRecentPanels Hook
 *
 * React hook for managing recently used research panels.
 * Provides access to recent panels and operations to update them.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  getRecentPanels,
  addRecentPanel as addRecentPanelToStorage,
  addRecentPanels as addRecentPanelsToStorage,
  clearRecentPanels as clearRecentPanelsFromStorage,
  isRecentPanel as isRecentPanelInStorage,
} from '@/lib/recent-panels-storage';

interface Panel {
  id: string;
  name: string;
  description: string | null;
  _count: {
    memberships: number;
  };
}

interface UseRecentPanelsReturn {
  /** Array of recently used panel IDs, most recent first */
  recentPanelIds: string[];

  /** Array of full panel objects for recently used panels */
  recentPanels: Panel[];

  /** Add a single panel to the recent list */
  addRecentPanel: (panelId: string) => void;

  /** Add multiple panels to the recent list */
  addRecentPanels: (panelIds: string[]) => void;

  /** Clear all recently used panels */
  clearRecentPanels: () => void;

  /** Check if a panel is in the recent list */
  isRecentPanel: (panelId: string) => boolean;

  /** Force refresh of recent panels from storage */
  refreshRecentPanels: () => void;
}

/**
 * Custom hook to manage recently used research panels
 *
 * @param availablePanels - Array of all available panels to filter from
 * @returns Object with recent panel data and operations
 *
 * @example
 * ```tsx
 * const { recentPanels, addRecentPanel } = useRecentPanels(availablePanels);
 *
 * // When user publishes a questionnaire with selected panels
 * addRecentPanels(selectedPanelIds);
 * ```
 */
export function useRecentPanels(availablePanels: Panel[]): UseRecentPanelsReturn {
  const [recentPanelIds, setRecentPanelIds] = useState<string[]>([]);

  // Load recent panels from localStorage on mount
  useEffect(() => {
    const loadRecentPanels = () => {
      const ids = getRecentPanels();
      setRecentPanelIds(ids);
    };

    loadRecentPanels();

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gentil_feedback_recent_panels') {
        loadRecentPanels();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Get full panel objects for recent panel IDs
  const recentPanels = useMemo(() => {
    if (recentPanelIds.length === 0 || availablePanels.length === 0) {
      return [];
    }

    // Filter and sort panels based on recent IDs order
    const panelMap = new Map(availablePanels.map(p => [p.id, p]));
    return recentPanelIds
      .map(id => panelMap.get(id))
      .filter((panel): panel is Panel => panel !== undefined);
  }, [recentPanelIds, availablePanels]);

  // Add a single panel to recent list
  const addRecentPanel = (panelId: string) => {
    addRecentPanelToStorage(panelId);
    // Update local state immediately for optimistic UI
    setRecentPanelIds(getRecentPanels());
  };

  // Add multiple panels to recent list
  const addRecentPanels = (panelIds: string[]) => {
    addRecentPanelsToStorage(panelIds);
    // Update local state immediately for optimistic UI
    setRecentPanelIds(getRecentPanels());
  };

  // Clear all recent panels
  const clearRecentPanels = () => {
    clearRecentPanelsFromStorage();
    setRecentPanelIds([]);
  };

  // Check if a panel is in the recent list
  const isRecentPanel = (panelId: string) => {
    return isRecentPanelInStorage(panelId);
  };

  // Force refresh from storage
  const refreshRecentPanels = () => {
    setRecentPanelIds(getRecentPanels());
  };

  return {
    recentPanelIds,
    recentPanels,
    addRecentPanel,
    addRecentPanels,
    clearRecentPanels,
    isRecentPanel,
    refreshRecentPanels,
  };
}
