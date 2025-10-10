/**
 * @deprecated This component is deprecated as of v0.6.0.
 * Bilingual support has been simplified to English-only for faster MVP development.
 *
 * **Migration Guide:**
 * - Replace `BilingualTextField` with standard `<Textarea>` component
 * - Change `value` prop from `{ en: string; fr: string }` to `string`
 * - Remove language tabs from your UI
 * - Update `onChange` handler to work with plain strings
 *
 * **Example:**
 * ```tsx
 * // OLD (deprecated):
 * <BilingualTextField
 *   value={{ en: 'Hello', fr: 'Bonjour' }}
 *   onChange={(value) => setValue(value)}
 * />
 *
 * // NEW (v0.6.0+):
 * <Textarea
 *   value="Hello"
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 *
 * **Note:** Bilingual support will be reintroduced in Phase 2 (v0.8.0+) as opt-in feature.
 * See docs/prd/PRD-008.md for details.
 *
 * @version 0.6.0 - Deprecated
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface BilingualTextFieldProps {
  label: string;
  value: { en: string; fr: string };
  onChange: (value: { en: string; fr: string }) => void;
  placeholder?: { en: string; fr: string };
  required?: boolean;
}

export function BilingualTextField({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: BilingualTextFieldProps) {
  // Log deprecation warning in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Deprecation Warning] BilingualTextField is deprecated as of v0.6.0. ' +
        'Please use standard Textarea component instead. ' +
        'See component documentation for migration guide. ' +
        'Backward compatibility is maintained but will be removed in v0.8.0.'
      );
    }
  }, []);

  const hasEnglish = value.en.trim().length > 0;
  const hasFrench = value.fr.trim().length > 0;
  const hasError = required && !hasEnglish && !hasFrench;
  const fieldId = React.useId();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label id={`${fieldId}-label`} className="text-sm md:text-base">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </Label>
        <div className="flex gap-2" role="status" aria-live="polite">
          <Badge
            variant={hasEnglish ? "default" : "outline"}
            className="text-xs"
            aria-label={hasEnglish ? "English text provided" : "English text missing"}
          >
            EN {hasEnglish && <Check className="ml-1 h-3 w-3" aria-hidden="true" />}
          </Badge>
          <Badge
            variant={hasFrench ? "default" : "outline"}
            className="text-xs"
            aria-label={hasFrench ? "French text provided" : "French text missing"}
          >
            FR {hasFrench && <Check className="ml-1 h-3 w-3" aria-hidden="true" />}
          </Badge>
        </div>
      </div>
      <Tabs defaultValue="en" className="w-full">
        <TabsList className="grid w-full grid-cols-2" aria-label="Language selection">
          <TabsTrigger
            value="en"
            className="relative min-h-[44px]"
            aria-label={hasEnglish ? "English (completed)" : "English"}
          >
            English
            {hasEnglish && (
              <span
                className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500"
                aria-hidden="true"
              />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="fr"
            className="relative min-h-[44px]"
            aria-label={hasFrench ? "French (completed)" : "French"}
          >
            Français
            {hasFrench && (
              <span
                className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500"
                aria-hidden="true"
              />
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="mt-2">
          <Textarea
            id={`${fieldId}-en`}
            placeholder={placeholder?.en || 'Enter text in English...'}
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            className="min-h-[100px] text-base"
            aria-labelledby={`${fieldId}-label`}
            aria-describedby={hasError ? `${fieldId}-error` : undefined}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-required={required}
          />
        </TabsContent>
        <TabsContent value="fr" className="mt-2">
          <Textarea
            id={`${fieldId}-fr`}
            placeholder={placeholder?.fr || 'Entrez le texte en français...'}
            value={value.fr}
            onChange={(e) => onChange({ ...value, fr: e.target.value })}
            className="min-h-[100px] text-base"
            aria-labelledby={`${fieldId}-label`}
            aria-describedby={hasError ? `${fieldId}-error` : undefined}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-required={required}
          />
        </TabsContent>
      </Tabs>
      {hasError && (
        <p
          id={`${fieldId}-error`}
          className="text-xs text-destructive"
          role="alert"
        >
          At least one language is required
        </p>
      )}
    </div>
  );
}
