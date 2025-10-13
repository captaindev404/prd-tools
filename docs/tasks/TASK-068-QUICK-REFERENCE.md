# TASK-068: i18n Quick Reference

Quick reference guide for using internationalization in Gentil Feedback.

## Basic Usage

### In Any Component

```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('feedback');

  return <h1>{t('title')}</h1>;
}
```

### With Variables

```tsx
const t = useTranslations('dashboard');

<h1>{t('welcome', { name: 'John' })}</h1>
```

## Navigation

```tsx
import { Link, useRouter } from '@/lib/i18n/navigation';

// Link component
<Link href="/dashboard">Dashboard</Link>

// Programmatic
const router = useRouter();
router.push('/feedback');
```

## Common Patterns

### Form Labels
```tsx
const t = useTranslations('feedback.form');

<label>{t('titleLabel')}</label>
<input placeholder={t('titlePlaceholder')} />
<p className="help">{t('titleHelp')}</p>
```

### Buttons
```tsx
const t = useTranslations('common');

<button>{t('save')}</button>
<button>{t('cancel')}</button>
<button>{t('delete')}</button>
```

### Error Messages
```tsx
const t = useTranslations('errors');

<p className="error">{t('generic')}</p>
<p className="error">{t('network')}</p>
```

### Validation
```tsx
const t = useTranslations('validation');

{errors.title && <p>{t('required')}</p>}
{errors.email && <p>{t('email')}</p>}
{errors.password && <p>{t('minLength', { min: 8 })}</p>}
```

## Available Namespaces

- `common` - Universal UI (save, cancel, etc.)
- `nav` - Navigation items
- `breadcrumbs` - Breadcrumb labels
- `auth` - Authentication pages
- `dashboard` - Dashboard page
- `feedback` - Feedback system
- `features` - Feature catalog
- `roadmap` - Roadmap items
- `panels` - Research panels
- `questionnaires` - Questionnaires
- `sessions` - User testing sessions
- `analytics` - Analytics
- `moderation` - Moderation
- `admin` - Admin panel
- `settings` - Settings
- `notifications` - Notifications
- `errors` - Error messages
- `validation` - Validation messages

## Language Switcher

```tsx
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

<LanguageSwitcher />
```

## Get Current Locale

```tsx
import { useLocale } from 'next-intl';

const locale = useLocale(); // "en" or "fr"
```

## Validation

```bash
# Check translation coverage
npm run i18n:validate

# Generate detailed report
npm run i18n:report
```

## Adding New Translations

1. Add to `/src/messages/en.json`
2. Add to `/src/messages/fr.json`
3. Run `npm run i18n:validate`
4. Use in components

## Demo

Visit the demo page to see all features:
- `/en/examples/i18n-demo`
- `/fr/examples/i18n-demo`

## Full Documentation

See `/docs/I18N_GUIDE.md` for complete documentation.
