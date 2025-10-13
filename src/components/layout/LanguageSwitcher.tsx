'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { locales, localeNames, localeEmojis, type Locale } from '@/i18n/config';

/**
 * LanguageSwitcher Component
 *
 * Provides a dropdown menu for switching between available locales.
 * The component:
 * - Shows the current locale with flag emoji
 * - Displays all available locales in dropdown
 * - Persists locale selection in URL
 * - Updates all navigation links to use new locale
 *
 * Features:
 * - Client-side locale switching
 * - Maintains current page when switching
 * - Updates URL pathname with new locale
 * - Accessible dropdown with keyboard navigation
 *
 * @example
 * ```tsx
 * import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
 *
 * <LanguageSwitcher />
 * ```
 */
export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Switch to a new locale
   * Updates the URL to use the new locale prefix
   */
  const handleLocaleChange = (newLocale: Locale) => {
    // Don't switch if already on this locale
    if (newLocale === locale) return;

    // Get the pathname without the current locale prefix
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

    // Navigate to the same page with the new locale
    const newPath = `/${newLocale}${pathnameWithoutLocale}`;
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label={t('selectLanguage')}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {localeEmojis[locale]} {localeNames[locale]}
          </span>
          <span className="sm:hidden">
            {localeEmojis[locale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('selectLanguage')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={loc === locale ? 'bg-accent' : ''}
          >
            <span className="mr-2">{localeEmojis[loc]}</span>
            {localeNames[loc]}
            {loc === locale && (
              <span className="ml-auto text-xs text-muted-foreground">
                ({t('currentLanguage')})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
