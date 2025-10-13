# Internationalization (i18n) Guide

This guide explains how to use internationalization in the Gentil Feedback platform.

## Overview

The platform supports two languages:
- **English** (en) - Default
- **French** (fr)

We use [next-intl](https://next-intl-docs.vercel.app/) for internationalization, which provides:
- Type-safe translations
- Automatic locale routing
- Server and client component support
- Dynamic language switching
- Translation validation

## Table of Contents

1. [Quick Start](#quick-start)
2. [Using Translations](#using-translations)
3. [Navigation](#navigation)
4. [Language Switching](#language-switching)
5. [Adding New Translations](#adding-new-translations)
6. [Validation](#validation)
7. [Best Practices](#best-practices)

## Quick Start

### In Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyServerComponent() {
  const t = useTranslations('feedback');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### In Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyClientComponent() {
  const t = useTranslations('feedback');

  return (
    <button>{t('submitFeedback')}</button>
  );
}
```

## Using Translations

### Basic Translation

```tsx
const t = useTranslations('common');

// Simple translation
t('save') // "Save" or "Enregistrer"

// Nested translation
const t = useTranslations('feedback.form');
t('titleLabel') // "Feedback Title" or "Titre du retour"
```

### Translations with Variables

```tsx
const t = useTranslations('dashboard');

// Using variables
t('welcome', { name: 'John' }) // "Welcome, John" or "Bienvenue, John"

// Using count
const t = useTranslations('feedback.vote');
t('voteCount', { count: 5 }) // "5 votes"
```

### Getting Current Locale

```tsx
import { useLocale } from 'next-intl';

export function MyComponent() {
  const locale = useLocale(); // "en" or "fr"

  return <div>Current language: {locale}</div>;
}
```

## Navigation

### Using i18n-Aware Link Component

Always use the i18n-aware Link component from `@/lib/i18n/navigation`:

```tsx
import { Link } from '@/lib/i18n/navigation';

export function Navigation() {
  return (
    <nav>
      {/* Automatically handles locale prefix */}
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/feedback">Feedback</Link>
      <Link href="/features">Features</Link>
    </nav>
  );
}
```

### Programmatic Navigation

```tsx
'use client';

import { useRouter } from '@/lib/i18n/navigation';

export function MyComponent() {
  const router = useRouter();

  const handleClick = () => {
    // Automatically handles locale prefix
    router.push('/feedback/new');
  };

  return <button onClick={handleClick}>Create Feedback</button>;
}
```

### Getting Current Pathname

```tsx
'use client';

import { usePathname } from '@/lib/i18n/navigation';

export function MyComponent() {
  const pathname = usePathname(); // "/feedback" (without locale prefix)

  return <div>Current page: {pathname}</div>;
}
```

## Language Switching

### Using the LanguageSwitcher Component

The platform includes a built-in `LanguageSwitcher` component:

```tsx
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

export function Header() {
  return (
    <header>
      <nav>{/* ... */}</nav>
      <LanguageSwitcher />
    </header>
  );
}
```

### Custom Language Switching

```tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export function CustomLanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: 'en' | 'fr') => {
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    router.push(`/${newLocale}${pathnameWithoutLocale}`);
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLanguage(e.target.value as 'en' | 'fr')}
    >
      <option value="en">English</option>
      <option value="fr">Français</option>
    </select>
  );
}
```

## Adding New Translations

### 1. Add to English File

Edit `/src/messages/en.json`:

```json
{
  "myNewFeature": {
    "title": "My New Feature",
    "description": "This is a description",
    "button": "Click Here"
  }
}
```

### 2. Add to French File

Edit `/src/messages/fr.json`:

```json
{
  "myNewFeature": {
    "title": "Ma nouvelle fonctionnalité",
    "description": "Ceci est une description",
    "button": "Cliquez ici"
  }
}
```

### 3. Use in Components

```tsx
const t = useTranslations('myNewFeature');

return (
  <div>
    <h1>{t('title')}</h1>
    <p>{t('description')}</p>
    <button>{t('button')}</button>
  </div>
);
```

## Validation

### Validate Translation Completeness

Run the validation script to check for missing translations:

```bash
# Check translation coverage
npx tsx scripts/validate-translations.ts

# Generate detailed report
npx tsx scripts/validate-translations.ts --report
```

The script will:
- Compare English and French translation files
- Report missing keys
- Report extra keys
- Show translation coverage percentage

### Add to package.json Scripts

```json
{
  "scripts": {
    "validate-translations": "tsx scripts/validate-translations.ts",
    "translations:report": "tsx scripts/validate-translations.ts --report"
  }
}
```

## Best Practices

### 1. Organize Translations by Feature

```json
{
  "feedback": {
    "title": "Feedback",
    "form": {
      "titleLabel": "Title",
      "bodyLabel": "Description"
    }
  },
  "features": {
    "title": "Features",
    "form": {
      "nameLabel": "Name"
    }
  }
}
```

### 2. Use Descriptive Keys

```tsx
// ❌ Bad - unclear what this is
t('text1')

// ✅ Good - clear and descriptive
t('feedback.form.titlePlaceholder')
```

### 3. Handle Plurals Properly

```json
{
  "items": "item | items",
  "voteCount": "{count} vote | {count} votes"
}
```

```tsx
// Use with count
t('voteCount', { count: votes })
```

### 4. Keep Translations in Sync

Always update both language files when adding new features:

```bash
# Before committing, validate translations
npm run validate-translations
```

### 5. Use Type-Safe Translation Keys

TypeScript will provide autocomplete for translation keys:

```tsx
// ✅ TypeScript will catch typos
t('feedback.title') // ✓
t('feedback.titel') // ✗ Error: Key doesn't exist
```

### 6. Don't Hardcode Text

```tsx
// ❌ Bad - hardcoded text
<button>Submit</button>

// ✅ Good - translated
<button>{t('common.submit')}</button>
```

### 7. Use Common Translations

For frequently used terms, use the `common` namespace:

```tsx
const t = useTranslations('common');

t('save')
t('cancel')
t('delete')
t('edit')
t('loading')
```

## Translation Structure

### Available Namespaces

- `common` - Common UI elements (save, cancel, etc.)
- `nav` - Navigation items
- `breadcrumbs` - Breadcrumb labels
- `auth` - Authentication pages
- `dashboard` - Dashboard page
- `feedback` - Feedback system
- `features` - Feature catalog
- `roadmap` - Roadmap items
- `research` - Research overview
- `panels` - Research panels
- `questionnaires` - Questionnaires
- `sessions` - User testing sessions
- `analytics` - Analytics dashboard
- `moderation` - Moderation queue
- `admin` - Admin panel
- `settings` - Settings page
- `notifications` - Notifications
- `errors` - Error messages
- `validation` - Validation messages
- `language` - Language switcher
- `emails` - Email templates

## Email Templates

Email templates also support i18n. Use the locale parameter when sending emails:

```tsx
import { getTranslations } from 'next-intl/server';

async function sendEmail(userId: string, locale: 'en' | 'fr') {
  const t = await getTranslations({ locale, namespace: 'emails.questionnaire' });

  const subject = t('subject', { name: 'User Survey' });
  const body = t('body');

  // Send email with translated content
  await sendMail({
    to: userEmail,
    subject,
    html: body,
  });
}
```

## Server-Side Translations

For server components and API routes:

```tsx
import { getTranslations } from 'next-intl/server';

export async function MyServerComponent({
  params
}: {
  params: { locale: string }
}) {
  const t = await getTranslations('feedback');

  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  );
}
```

## Troubleshooting

### Translation Not Showing

1. Check if the key exists in both language files
2. Verify the namespace is correct
3. Run `npm run validate-translations` to check for issues

### Language Not Switching

1. Ensure middleware is configured correctly in `src/middleware.ts`
2. Check that URLs include the locale prefix (e.g., `/en/dashboard`)
3. Verify cookies are being set

### Type Errors

1. Restart TypeScript server in your IDE
2. Rebuild the project: `npm run build`
3. Check that translation files are valid JSON

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Translation Files](/src/messages/)
- [Validation Script](/scripts/validate-translations.ts)
