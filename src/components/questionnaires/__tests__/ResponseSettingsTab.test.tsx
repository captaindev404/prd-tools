import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseSettingsTab, ResponseSettings } from '../ResponseSettingsTab';

describe('ResponseSettingsTab', () => {
  const defaultSettings: ResponseSettings = {
    anonymous: false,
    responseLimit: 'once',
    startAt: null,
    endAt: null,
    maxTotalResponses: null,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Anonymous Responses', () => {
    it('renders anonymous checkbox', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/allow anonymous responses/i)).toBeInTheDocument();
    });

    it('displays help text for anonymous mode', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/when enabled, respondent names will not be recorded/i)
      ).toBeInTheDocument();
    });

    it('calls onChange when anonymous checkbox is toggled', async () => {
      const user = userEvent.setup();
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      const checkbox = screen.getByLabelText(/allow anonymous responses/i);
      await user.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultSettings,
        anonymous: true,
      });
    });
  });

  describe('Response Limit', () => {
    it('renders response limit dropdown', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/response limit per user/i)).toBeInTheDocument();
    });

    it('displays correct help text for "once" limit', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/users can respond only once to this questionnaire/i)
      ).toBeInTheDocument();
    });

    it('displays correct help text for "unlimited" limit', () => {
      render(
        <ResponseSettingsTab
          settings={{ ...defaultSettings, responseLimit: 'unlimited' }}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/users can respond multiple times without restrictions/i)
      ).toBeInTheDocument();
    });

    it('displays correct help text for "daily" limit', () => {
      render(
        <ResponseSettingsTab
          settings={{ ...defaultSettings, responseLimit: 'daily' }}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/users can respond once per day/i)
      ).toBeInTheDocument();
    });

    it('displays correct help text for "weekly" limit', () => {
      render(
        <ResponseSettingsTab
          settings={{ ...defaultSettings, responseLimit: 'weekly' }}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/users can respond once per week/i)
      ).toBeInTheDocument();
    });
  });

  describe('Schedule Settings', () => {
    it('renders start date picker', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    });

    it('renders end date picker', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it('displays validation error when end date is before start date', () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-10');

      render(
        <ResponseSettingsTab
          settings={{
            ...defaultSettings,
            startAt: startDate,
            endAt: endDate,
          }}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
    });

    it('does not display validation error when dates are valid', () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-20');

      render(
        <ResponseSettingsTab
          settings={{
            ...defaultSettings,
            startAt: startDate,
            endAt: endDate,
          }}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText(/end date must be after start date/i)).not.toBeInTheDocument();
    });

    it('displays placeholder text when no start date is set', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/start immediately upon publishing/i)).toBeInTheDocument();
    });

    it('displays placeholder text when no end date is set', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/no end date/i)).toBeInTheDocument();
    });
  });

  describe('Maximum Total Responses', () => {
    it('renders max responses input', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByLabelText(/maximum total responses/i)
      ).toBeInTheDocument();
    });

    it('calls onChange when max responses value changes', async () => {
      const user = userEvent.setup();
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/maximum total responses/i);
      await user.clear(input);
      await user.type(input, '100');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          ...defaultSettings,
          maxTotalResponses: 100,
        });
      });
    });

    it('displays help text for max responses', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/leave empty for unlimited responses/i)
      ).toBeInTheDocument();
    });

    it('displays external error for max responses', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
          errors={{ maxTotalResponses: 'Must be positive' }}
        />
      );

      expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
    });
  });

  describe('Settings Summary', () => {
    it('renders settings summary section', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/settings summary/i)).toBeInTheDocument();
    });

    it('displays anonymous status in summary', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/responses will include user names/i)
      ).toBeInTheDocument();
    });

    it('displays anonymous enabled status in summary', () => {
      render(
        <ResponseSettingsTab
          settings={{ ...defaultSettings, anonymous: true }}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/anonymous responses enabled/i)
      ).toBeInTheDocument();
    });

    it('displays response limit in summary', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/once per user/i)).toBeInTheDocument();
    });

    it('displays active period in summary with no dates', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/immediately upon publishing/i)).toBeInTheDocument();
      expect(screen.getByText(/no end date/i)).toBeInTheDocument();
    });

    it('displays max responses cap in summary when set', () => {
      render(
        <ResponseSettingsTab
          settings={{ ...defaultSettings, maxTotalResponses: 500 }}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/500 responses/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for all inputs', () => {
      render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/allow anonymous responses/i)).toHaveAttribute('aria-describedby');
      expect(screen.getByLabelText(/response limit per user/i)).toHaveAttribute('aria-describedby');
      expect(screen.getByLabelText(/start date/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/maximum total responses/i)).toHaveAttribute('aria-describedby');
    });

    it('marks error alert with proper role', () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-10');

      render(
        <ResponseSettingsTab
          settings={{
            ...defaultSettings,
            startAt: startDate,
            endAt: endDate,
          }}
          onChange={mockOnChange}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/end date must be after start date/i);
    });
  });

  describe('Integration', () => {
    it('updates all settings correctly in sequence', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ResponseSettingsTab
          settings={defaultSettings}
          onChange={mockOnChange}
        />
      );

      // Toggle anonymous
      const checkbox = screen.getByLabelText(/allow anonymous responses/i);
      await user.click(checkbox);

      const newSettings1 = mockOnChange.mock.calls[0][0];
      expect(newSettings1.anonymous).toBe(true);

      // Update max responses
      rerender(
        <ResponseSettingsTab
          settings={newSettings1}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/maximum total responses/i);
      await user.clear(input);
      await user.type(input, '250');

      await waitFor(() => {
        const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
        expect(lastCall.maxTotalResponses).toBe(250);
      });
    });
  });
});
