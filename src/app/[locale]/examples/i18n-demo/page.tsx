import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * i18n Demo Page
 *
 * Demonstrates internationalization features:
 * - Translation usage in server components
 * - Language switcher
 * - i18n-aware navigation
 * - Translation variables
 */
export default function I18nDemoPage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">{t('language.selectLanguage')}</h1>
        <LanguageSwitcher />
      </div>

      {/* Common Translations */}
      <Card>
        <CardHeader>
          <CardTitle>Common Translations</CardTitle>
          <CardDescription>
            Frequently used UI elements from the common namespace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Button>{t('common.save')}</Button>
            <Button variant="outline">{t('common.cancel')}</Button>
            <Button variant="destructive">{t('common.delete')}</Button>
          </div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>

      {/* Navigation Translations */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
          <CardDescription>
            Main navigation items with i18n-aware routing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <nav className="flex flex-wrap gap-4">
            <Link href="/dashboard" className="text-primary hover:underline">
              {t('nav.dashboard')}
            </Link>
            <Link href="/feedback" className="text-primary hover:underline">
              {t('nav.feedback')}
            </Link>
            <Link href="/features" className="text-primary hover:underline">
              {t('nav.features')}
            </Link>
            <Link href="/roadmap" className="text-primary hover:underline">
              {t('nav.roadmap')}
            </Link>
            <Link href="/research" className="text-primary hover:underline">
              {t('nav.research')}
            </Link>
          </nav>
        </CardContent>
      </Card>

      {/* Translation with Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Translation Variables</CardTitle>
          <CardDescription>
            Translations with dynamic content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-lg font-medium">
              {t('dashboard.welcome', { name: 'Claude' })}
            </p>
            <p className="text-muted-foreground">
              {t('dashboard.welcomeMessage')}
            </p>
          </div>
          <div>
            <p>{t('feedback.vote.voteCount', { count: 42 })}</p>
            <p>{t('panels.memberCount', { count: 15 })}</p>
            <p>{t('questionnaires.responseCount', { count: 128 })}</p>
          </div>
        </CardContent>
      </Card>

      {/* Feature-Specific Translations */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Translations</CardTitle>
          <CardDescription>
            Translations organized by feature area
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">{t('feedback.title')}</h3>
            <ul className="text-sm space-y-1">
              <li>{t('feedback.newFeedback')}</li>
              <li>{t('feedback.myFeedback')}</li>
              <li>{t('feedback.submitFeedback')}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t('research.title')}</h3>
            <ul className="text-sm space-y-1">
              <li>{t('panels.title')}</li>
              <li>{t('questionnaires.title')}</li>
              <li>{t('sessions.title')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Status and State Translations */}
      <Card>
        <CardHeader>
          <CardTitle>States and Statuses</CardTitle>
          <CardDescription>
            Translated status labels for feedback, features, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Feedback States:</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-secondary rounded text-sm">
                {t('feedback.states.new')}
              </span>
              <span className="px-2 py-1 bg-secondary rounded text-sm">
                {t('feedback.states.triaged')}
              </span>
              <span className="px-2 py-1 bg-secondary rounded text-sm">
                {t('feedback.states.in_roadmap')}
              </span>
              <span className="px-2 py-1 bg-secondary rounded text-sm">
                {t('feedback.states.closed')}
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Feature Statuses:</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-secondary rounded text-sm">
                {t('features.statuses.idea')}
              </span>
              <span className="px-2 py-1 bg-secondary rounded text-sm">
                {t('features.statuses.in_progress')}
              </span>
              <span className="px-2 py-1 bg-secondary rounded text-sm">
                {t('features.statuses.released')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Translations */}
      <Card>
        <CardHeader>
          <CardTitle>Form Labels</CardTitle>
          <CardDescription>
            Translated form fields and validation messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('feedback.form.titleLabel')}
            </label>
            <input
              type="text"
              placeholder={t('feedback.form.titlePlaceholder')}
              className="w-full p-2 border rounded"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('feedback.form.titleHelp')}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('feedback.form.bodyLabel')}
            </label>
            <textarea
              placeholder={t('feedback.form.bodyPlaceholder')}
              className="w-full p-2 border rounded"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('feedback.form.bodyHelp')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Messages</CardTitle>
          <CardDescription>
            Reusable validation error messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-destructive">
          <p>{t('validation.required')}</p>
          <p>{t('validation.email')}</p>
          <p>{t('validation.minLength', { min: 8 })}</p>
          <p>{t('validation.maxLength', { max: 120 })}</p>
        </CardContent>
      </Card>

      {/* Error Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Error Messages</CardTitle>
          <CardDescription>
            System error messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-destructive">
          <p>{t('errors.generic')}</p>
          <p>{t('errors.network')}</p>
          <p>{t('errors.unauthorized')}</p>
          <p>{t('errors.notFound')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
