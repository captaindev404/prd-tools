/**
 * Typed navigation utilities with i18n support
 *
 * These utilities provide i18n-aware navigation throughout the app.
 * Import from next-intl/navigation directly for the latest API.
 *
 * @example
 * ```tsx
 * import { Link, useRouter, usePathname } from 'next-intl/navigation';
 *
 * // Use Link component (automatically handles locale)
 * <Link href="/dashboard">Dashboard</Link>
 *
 * // Use router for programmatic navigation
 * const router = useRouter();
 * router.push('/feedback/new');
 *
 * // Get current pathname (without locale prefix)
 * const pathname = usePathname();
 * ```
 */

// Re-export from next-intl/navigation
export { Link, useRouter, usePathname, redirect } from 'next-intl/navigation';
