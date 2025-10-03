'use client';

import React, { useState } from 'react';
import {
  LanguageToggle,
  LanguageToggleCompact,
  Language,
} from './LanguageToggle';
import { QuestionRendererI18n } from './question-renderer-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Example demonstrating LanguageToggle component usage
 */
export function LanguageToggleExample() {
  const [language, setLanguage] = useState<Language>('en');
  const [response, setResponse] = useState<any>(null);

  // Sample question with i18n text
  const sampleQuestion = {
    id: 'q1',
    type: 'nps' as const,
    text: {
      en: 'How likely are you to recommend Club Med to a friend or colleague?',
      fr: 'Dans quelle mesure recommanderiez-vous Club Med à un ami ou un collègue ?',
    },
    required: true,
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Language Toggle Examples</h1>
        <p className="text-muted-foreground">
          Interactive examples of the language toggle component for questionnaire previews
        </p>
      </div>

      {/* Example 1: Standard Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Toggle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Default style with background container
            </p>
            <LanguageToggle value={language} onChange={setLanguage} />
          </div>

          <Separator />

          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Current language: {language.toUpperCase()}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'en'
                ? 'The toggle is set to English'
                : 'Le toggle est réglé sur Français'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Example 2: Toggle with Icon */}
      <Card>
        <CardHeader>
          <CardTitle>Toggle with Globe Icon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              With visual indicator for language context
            </p>
            <LanguageToggle value={language} onChange={setLanguage} showIcon />
          </div>
        </CardContent>
      </Card>

      {/* Example 3: Compact Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Compact Toggle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Minimal design for inline use
            </p>
            <LanguageToggleCompact value={language} onChange={setLanguage} />
          </div>
        </CardContent>
      </Card>

      {/* Example 4: Integration with Question Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Question Preview Integration</CardTitle>
            <LanguageToggle value={language} onChange={setLanguage} showIcon />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuestionRendererI18n
            question={sampleQuestion}
            language={language}
            value={response}
            onChange={setResponse}
          />

          {response !== null && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Response recorded: {response}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example 5: Multiple Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Multiple Independent Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Preview Language</span>
              <LanguageToggleCompact value={language} onChange={setLanguage} />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Export Language</span>
              <LanguageToggle value={language} onChange={setLanguage} />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Email Template Language</span>
              <LanguageToggle value={language} onChange={setLanguage} showIcon />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Notes */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Accessibility Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>
                <strong>ARIA Labels:</strong> Each toggle has descriptive labels for screen readers
                ("English", "French")
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>
                <strong>Keyboard Navigation:</strong> Use Tab to focus, Arrow keys to navigate
                between options, Space/Enter to select
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>
                <strong>Focus Indicators:</strong> Visible ring appears on keyboard focus
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>
                <strong>Visual State:</strong> Active language highlighted with primary color
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>
                <strong>Role Semantics:</strong> Uses proper radiogroup/radio roles for assistive
                technologies
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Usage Notes */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-900 dark:text-purple-100">Usage Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Basic Usage:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                <code>{`const [lang, setLang] = useState<Language>('en');

<LanguageToggle value={lang} onChange={setLang} />`}</code>
              </pre>
            </div>

            <div>
              <p className="font-medium mb-1">With Icon:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                <code>{`<LanguageToggle value={lang} onChange={setLang} showIcon />`}</code>
              </pre>
            </div>

            <div>
              <p className="font-medium mb-1">Compact Variant:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                <code>{`<LanguageToggleCompact value={lang} onChange={setLang} />`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
