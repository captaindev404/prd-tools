'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe } from 'lucide-react';

/**
 * Language toggle component for questionnaire preview
 *
 * Features:
 * - EN/FR language switching
 * - Accessible with ARIA labels
 * - Keyboard navigation (Tab, Arrow keys)
 * - Visual indicator for active language
 * - Compact inline design
 */

export type Language = 'en' | 'fr';

interface LanguageToggleProps {
  /**
   * Current selected language
   */
  value: Language;

  /**
   * Callback when language changes
   */
  onChange: (language: Language) => void;

  /**
   * Optional additional CSS classes
   */
  className?: string;

  /**
   * Show globe icon before toggle
   * @default false
   */
  showIcon?: boolean;
}

export function LanguageToggle({
  value,
  onChange,
  className,
  showIcon = false,
}: LanguageToggleProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 ${className || ''}`}
      role="group"
      aria-label="Language selection"
    >
      {showIcon && (
        <Globe
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      )}

      <Tabs
        value={value}
        onValueChange={(newValue) => onChange(newValue as Language)}
        className="w-auto"
      >
        <TabsList className="h-8 p-0.5" aria-label="Select language">
          <TabsTrigger
            value="en"
            className="text-xs px-3 py-1 h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            aria-label="English"
          >
            EN
          </TabsTrigger>
          <TabsTrigger
            value="fr"
            className="text-xs px-3 py-1 h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            aria-label="French"
          >
            FR
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

/**
 * Compact variant without background container
 */
export function LanguageToggleCompact({
  value,
  onChange,
  className,
}: Omit<LanguageToggleProps, 'showIcon'>) {
  return (
    <div
      className={`inline-flex items-center gap-1 ${className || ''}`}
      role="radiogroup"
      aria-label="Language selection"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'en'}
        aria-label="English"
        onClick={() => onChange('en')}
        className={`
          px-2 py-1 text-xs font-medium rounded transition-colors
          ${value === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        `}
      >
        EN
      </button>

      <span className="text-muted-foreground/30" aria-hidden="true">
        |
      </span>

      <button
        type="button"
        role="radio"
        aria-checked={value === 'fr'}
        aria-label="French"
        onClick={() => onChange('fr')}
        className={`
          px-2 py-1 text-xs font-medium rounded transition-colors
          ${value === 'fr'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        `}
      >
        FR
      </button>
    </div>
  );
}
