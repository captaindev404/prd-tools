'use client';

/**
 * Example: How to integrate ResponseSettingsTab into questionnaire-create-form.tsx
 *
 * This file demonstrates the integration pattern for using the ResponseSettingsTab component
 * in the questionnaire create form.
 */

import { useState } from 'react';
import { ResponseSettingsTab, ResponseSettings } from './ResponseSettingsTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ResponseSettingsTabExample() {
  // Replace the existing individual state variables with a single ResponseSettings object
  const [responseSettings, setResponseSettings] = useState<ResponseSettings>({
    anonymous: false,
    responseLimit: 'once',
    startAt: null,
    endAt: null,
    maxTotalResponses: null,
  });

  // When submitting the form, transform the responseSettings to match API format:
  const transformForAPI = () => {
    return {
      anonymous: responseSettings.anonymous,
      // Transform responseLimit to match API expectations
      responseLimit: responseSettings.responseLimit === 'unlimited' ? 0 :
                     responseSettings.responseLimit === 'once' ? 1 :
                     responseSettings.responseLimit === 'daily' ? 1 :
                     responseSettings.responseLimit === 'weekly' ? 7 : 0,
      startAt: responseSettings.startAt ? responseSettings.startAt.toISOString() : null,
      endAt: responseSettings.endAt ? responseSettings.endAt.toISOString() : null,
      maxResponses: responseSettings.maxTotalResponses,
    };
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Response Settings Integration Example</h2>
        <p className="text-muted-foreground">
          This example shows how to use the ResponseSettingsTab component in your questionnaire form.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Response Settings</CardTitle>
          <CardDescription>
            Configure how responses are collected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponseSettingsTab
            settings={responseSettings}
            onChange={setResponseSettings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Settings (Debug)</CardTitle>
          <CardDescription>
            JSON representation of the current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(responseSettings, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Format (Debug)</CardTitle>
          <CardDescription>
            How the settings would be sent to the API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(transformForAPI(), null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Integration Steps:
 *
 * 1. Import the ResponseSettingsTab component:
 *    import { ResponseSettingsTab, ResponseSettings } from './ResponseSettingsTab';
 *
 * 2. Replace individual state variables with ResponseSettings object:
 *    // OLD:
 *    const [anonymous, setAnonymous] = useState(false);
 *    const [responseLimit, setResponseLimit] = useState('unlimited');
 *    const [startAt, setStartAt] = useState('');
 *    const [endAt, setEndAt] = useState('');
 *    const [maxResponses, setMaxResponses] = useState<string | number>('');
 *
 *    // NEW:
 *    const [responseSettings, setResponseSettings] = useState<ResponseSettings>({
 *      anonymous: false,
 *      responseLimit: 'once',
 *      startAt: null,
 *      endAt: null,
 *      maxTotalResponses: null,
 *    });
 *
 * 3. Update validation logic in validateForm():
 *    // Date validation
 *    if (responseSettings.startAt && responseSettings.endAt) {
 *      if (responseSettings.startAt >= responseSettings.endAt) {
 *        return 'End date must be after start date';
 *      }
 *    }
 *
 *    // Max responses validation
 *    if (responseSettings.maxTotalResponses && responseSettings.maxTotalResponses <= 0) {
 *      return 'Maximum responses must be a positive number';
 *    }
 *
 * 4. Replace the existing Response Settings Card in the form:
 *    <Card>
 *      <CardHeader>
 *        <CardTitle>Response Settings</CardTitle>
 *        <CardDescription>
 *          Configure how responses are collected
 *        </CardDescription>
 *      </CardHeader>
 *      <CardContent>
 *        <ResponseSettingsTab
 *          settings={responseSettings}
 *          onChange={setResponseSettings}
 *        />
 *      </CardContent>
 *    </Card>
 *
 * 5. Update the handleSubmit function to use responseSettings:
 *    const createData = {
 *      title: title.trim(),
 *      questions: transformedQuestions,
 *      targeting: {
 *        type: targetingType,
 *        panelIds: targetingType === 'specific_panels' ? selectedPanels : [],
 *        villageIds: [],
 *        roles: [],
 *      },
 *      anonymous: responseSettings.anonymous,
 *      responseLimit: responseSettings.responseLimit === 'unlimited' ? 0 :
 *                     responseSettings.responseLimit === 'once' ? 1 :
 *                     responseSettings.responseLimit === 'daily' ? 1 :
 *                     responseSettings.responseLimit === 'weekly' ? 7 : 0,
 *      startAt: responseSettings.startAt ? responseSettings.startAt.toISOString() : null,
 *      endAt: responseSettings.endAt ? responseSettings.endAt.toISOString() : null,
 *      maxResponses: responseSettings.maxTotalResponses,
 *    };
 */
