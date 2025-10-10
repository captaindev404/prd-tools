/**
 * QuestionnaireCreateForm - Integration Test Suite
 *
 * This file contains comprehensive integration tests for the complete
 * questionnaire creation form submission flow.
 *
 * Test Coverage:
 * - Complete form filling workflow
 * - Draft save functionality
 * - Publish functionality
 * - Validation error handling
 * - API integration
 * - Success/error feedback
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionnaireCreateForm } from '../questionnaire-create-form';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
    pathname: '/research/questionnaires/new',
    query: {},
    asPath: '/research/questionnaires/new',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/research/questionnaires/new',
}));

// Mock data
const mockPanels = [
  {
    id: 'pan_01HX5J3K4M',
    name: 'Beta Testers',
    description: 'Early adopters testing new features',
    _count: {
      memberships: 25,
    },
  },
  {
    id: 'pan_01HX5J3K5N',
    name: 'Power Users',
    description: 'Frequent users with advanced needs',
    _count: {
      memberships: 50,
    },
  },
];

describe('QuestionnaireCreateForm - Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockPush.mockClear();
    mockRefresh.mockClear();
    mockBack.mockClear();

    // Default mock for audience stats API (called on mount)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ estimatedReach: 1250 }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Form Filling Workflow', () => {
    it('should allow filling all form fields and adding questions', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill title
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Q4 2024 Guest Experience Survey');
      expect(titleInput).toHaveValue('Q4 2024 Guest Experience Survey');

      // Navigate to Questions tab
      const questionsTab = screen.getByRole('tab', { name: /questions/i });
      await user.click(questionsTab);

      // Add a Likert question
      const addQuestionButton = screen.getByRole('button', { name: /add question/i });
      await user.click(addQuestionButton);

      // Verify question was added
      expect(screen.getByText(/question 1 - likert/i)).toBeInTheDocument();

      // Fill question text
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'How satisfied are you with our service?');

      // Navigate to Targeting tab
      const targetingTab = screen.getByRole('tab', { name: /targeting & settings/i });
      await user.click(targetingTab);

      // Select all users
      expect(screen.getByDisplayValue('All Users')).toBeInTheDocument();

      // Verify form state is maintained
      const generalTab = screen.getByRole('tab', { name: /general info/i });
      await user.click(generalTab);
      expect(titleInput).toHaveValue('Q4 2024 Guest Experience Survey');
    });

    it('should support adding multiple question types', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Navigate to Questions tab
      const questionsTab = screen.getByRole('tab', { name: /questions/i });
      await user.click(questionsTab);

      // Add Likert question
      await user.click(screen.getByRole('button', { name: /add question/i }));

      // Change type to NPS and add
      const questionTypeSelect = screen.getByRole('combobox', { name: /select question type/i });
      await user.click(questionTypeSelect);
      await user.click(screen.getByRole('option', { name: /nps/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));

      // Change type to MCQ and add
      await user.click(questionTypeSelect);
      await user.click(screen.getByRole('option', { name: /multiple choice \(single\)/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));

      // Verify all questions are added
      expect(screen.getByText(/question 1 - likert/i)).toBeInTheDocument();
      expect(screen.getByText(/question 2 - nps/i)).toBeInTheDocument();
      expect(screen.getByText(/question 3 - mcq_single/i)).toBeInTheDocument();
    });

    it('should allow configuring MCQ options', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Navigate to Questions tab
      await user.click(screen.getByRole('tab', { name: /questions/i }));

      // Select MCQ type and add
      const questionTypeSelect = screen.getByRole('combobox', { name: /select question type/i });
      await user.click(questionTypeSelect);
      await user.click(screen.getByRole('option', { name: /multiple choice \(single\)/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));

      // Fill MCQ options
      const optionsTextarea = screen.getByPlaceholderText(/option 1/i);
      await user.type(optionsTextarea, 'Excellent\nGood\nAverage\nPoor');

      // Verify options are entered
      expect(optionsTextarea).toHaveValue('Excellent\nGood\nAverage\nPoor');
    });

    it('should allow selecting specific panels for targeting', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Navigate to Targeting tab
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));

      // Change targeting to specific panels
      const targetingSelect = screen.getByRole('combobox', { name: /select target audience/i });
      await user.click(targetingSelect);
      await user.click(screen.getByRole('option', { name: /specific panels/i }));

      // Select panels
      const betaTestersCheckbox = screen.getByLabelText(/beta testers/i);
      await user.click(betaTestersCheckbox);
      expect(betaTestersCheckbox).toBeChecked();

      const powerUsersCheckbox = screen.getByLabelText(/power users/i);
      await user.click(powerUsersCheckbox);
      expect(powerUsersCheckbox).toBeChecked();
    });
  });

  describe('Draft Save Functionality', () => {
    it('should save questionnaire as draft successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'qnn_01HX5J3K4M',
          title: 'Test Survey',
          status: 'draft',
        },
      };

      // Reset fetch to chain responses: first for audience stats, second for create
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill minimum required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add a question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Click Save as Draft
      const saveButton = screen.getByRole('button', { name: /save as draft/i });
      await user.click(saveButton);

      // Verify loading state
      expect(screen.getByText(/saving draft/i)).toBeInTheDocument();

      // Wait for API call
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const createCall = calls.find(call => call[0] === '/api/questionnaires' && call[1]?.method === 'POST');
        expect(createCall).toBeDefined();
      });

      // Verify request body
      const calls = (global.fetch as jest.Mock).mock.calls;
      const createCall = calls.find(call => call[0] === '/api/questionnaires' && call[1]?.method === 'POST');
      const requestBody = JSON.parse(createCall[1].body);
      expect(requestBody).toMatchObject({
        title: 'Test Survey',
        questions: expect.arrayContaining([
          expect.objectContaining({
            text: 'Test question?', // English-only format (v0.6.0+)
          }),
        ]),
      });

      // Verify redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/research/questionnaires/qnn_01HX5J3K4M');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should handle draft save with all targeting options', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'qnn_01HX5J3K4M',
          title: 'Panel Survey',
          status: 'draft',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 25 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Panel Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Set targeting to specific panels
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));
      const targetingSelect = screen.getByRole('combobox', { name: /select target audience/i });
      await user.click(targetingSelect);
      await user.click(screen.getByRole('option', { name: /specific panels/i }));

      // Select a panel
      await user.click(screen.getByLabelText(/beta testers/i));

      // Save as draft
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify request body includes targeting
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const createCall = calls.find(call => call[0] === '/api/questionnaires' && call[1]?.method === 'POST');
        expect(createCall).toBeDefined();
        const requestBody = JSON.parse(createCall[1].body);
        expect(requestBody.targeting).toMatchObject({
          type: 'specific_panels',
          panelIds: ['pan_01HX5J3K4M'],
        });
      });
    });

    it('should handle draft save with response settings', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'qnn_01HX5J3K4M',
          title: 'Survey with Settings',
          status: 'draft',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Survey with Settings');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Configure response settings
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));

      // Enable anonymous responses
      await user.click(screen.getByLabelText(/allow anonymous responses/i));

      // Set response limit
      const responseLimitSelect = screen.getByLabelText(/response limit per user/i);
      await user.click(responseLimitSelect);
      await user.click(screen.getByRole('option', { name: /once only/i }));

      // Set max responses
      await user.type(screen.getByLabelText(/maximum total responses/i), '100');

      // Save as draft
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify request body includes settings
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const createCall = calls.find(call => call[0] === '/api/questionnaires' && call[1]?.method === 'POST');
        expect(createCall).toBeDefined();
        const requestBody = JSON.parse(createCall[1].body);
        expect(requestBody).toMatchObject({
          anonymous: true,
          responseLimit: 1,
          maxResponses: 100,
        });
      });
    });
  });

  describe('Publish Functionality', () => {
    it('should publish questionnaire successfully', async () => {
      const createResponse = {
        success: true,
        data: {
          id: 'qnn_01HX5J3K4M',
          title: 'Published Survey',
          status: 'draft',
        },
      };

      const publishResponse = {
        success: true,
        data: {
          id: 'qnn_01HX5J3K4M',
          status: 'published',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => publishResponse,
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Published Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Click Save & Publish
      await user.click(screen.getByRole('button', { name: /save & publish/i }));

      // Verify publish dialog opens
      expect(screen.getByText(/ready to publish/i)).toBeInTheDocument();

      // Confirm publish
      const confirmButton = screen.getByRole('button', { name: /confirm & publish/i });
      await user.click(confirmButton);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/publishing/i)).toBeInTheDocument();
      });

      // Wait for API calls
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const publishCall = calls.find(call => call[0]?.includes('/publish'));
        expect(publishCall).toBeDefined();
      });

      // Verify create API call
      const calls = (global.fetch as jest.Mock).mock.calls;
      const createCall = calls.find(call => call[0] === '/api/questionnaires' && call[1]?.method === 'POST');
      expect(createCall).toBeDefined();

      // Verify publish API call
      const publishCall = calls.find(call => call[0]?.includes('/publish'));
      expect(publishCall[0]).toBe('/api/questionnaires/qnn_01HX5J3K4M/publish');
      expect(publishCall[1].method).toBe('POST');

      // Verify redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/research/questionnaires/qnn_01HX5J3K4M');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should show validation checklist in publish dialog', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Click Save & Publish
      await user.click(screen.getByRole('button', { name: /save & publish/i }));

      // Verify checklist items are shown
      expect(screen.getByText(/title is set/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one question added/i)).toBeInTheDocument();
      expect(screen.getByText(/targeting configured/i)).toBeInTheDocument();
    });

    it('should handle publish failure gracefully', async () => {
      const createResponse = {
        success: true,
        data: {
          id: 'qnn_01HX5J3K4M',
          title: 'Test Survey',
          status: 'draft',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            message: 'Questionnaire must have at least one question',
          }),
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Click Save & Publish
      await user.click(screen.getByRole('button', { name: /save & publish/i }));

      // Confirm publish
      const confirmButton = screen.getByRole('button', { name: /confirm & publish/i });
      await user.click(confirmButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/created as draft, but failed to publish/i)).toBeInTheDocument();
      });

      // Verify still redirects to questionnaire page
      expect(mockPush).toHaveBeenCalledWith('/research/questionnaires/qnn_01HX5J3K4M');
    });
  });

  describe('Validation Error Handling', () => {
    it('should show error when submitting with empty title', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Try to save without title
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();

      // Verify no API call was made
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error when title is too short', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Enter short title
      await user.type(screen.getByLabelText(/title/i), 'ab');

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
    });

    it('should show error when title is too long', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Enter long title (>200 chars)
      const longTitle = 'a'.repeat(201);
      await user.type(screen.getByLabelText(/title/i), longTitle);

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      expect(screen.getByText(/title must not exceed 200 characters/i)).toBeInTheDocument();
    });

    it('should show error when no questions are added', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill title only
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      expect(screen.getByText(/at least one question is required/i)).toBeInTheDocument();
    });

    it('should show error when question has no text', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill title
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question but don't fill text
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      expect(screen.getByText(/question 1 must have text in at least one language/i)).toBeInTheDocument();
    });

    it('should show error when MCQ has less than 2 options', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill title
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add MCQ question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      const questionTypeSelect = screen.getByRole('combobox', { name: /select question type/i });
      await user.click(questionTypeSelect);
      await user.click(screen.getByRole('option', { name: /multiple choice \(single\)/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));

      // Fill question text but only one option
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      const optionsTextarea = screen.getByPlaceholderText(/option 1/i);
      await user.type(optionsTextarea, 'Only one option');

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      expect(screen.getByText(/question 1.*must have at least 2 options/i)).toBeInTheDocument();
    });

    it('should show error when specific panels selected but no panels chosen', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Set targeting to specific panels but don't select any
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));
      const targetingSelect = screen.getByRole('combobox', { name: /select target audience/i });
      await user.click(targetingSelect);
      await user.click(screen.getByRole('option', { name: /specific panels/i }));

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      expect(screen.getByText(/at least one panel must be selected/i)).toBeInTheDocument();
    });

    it('should show error when end date is before start date', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Set dates with end before start
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));
      await user.type(screen.getByLabelText(/start date/i), '2024-12-31T10:00');
      await user.type(screen.getByLabelText(/end date/i), '2024-12-30T10:00');

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
    });

    it('should focus error alert for accessibility', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Try to save without title
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Wait for error to show
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
      });
    });
  });

  describe('API Integration and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Verify form is not disabled after error
      const saveButton = screen.getByRole('button', { name: /save as draft/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should handle API validation errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            message: 'A questionnaire with this title already exists',
          }),
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Duplicate Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify API error message
      await waitFor(() => {
        expect(screen.getByText(/a questionnaire with this title already exists/i)).toBeInTheDocument();
      });
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            message: 'Internal server error',
          }),
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Try to save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Audience Size Calculation', () => {
    it('should fetch and display audience size for all users', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ estimatedReach: 1250 }),
      });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Navigate to targeting tab
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));

      // Wait for audience size to load
      await waitFor(() => {
        expect(screen.getByText(/estimated reach:/i)).toBeInTheDocument();
        expect(screen.getByText(/1,250/)).toBeInTheDocument();
      });

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/questionnaires/audience-stats',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ targetingType: 'all_users' }),
        })
      );
    });

    it('should update audience size when panels are selected', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 25 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 70 }),
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Navigate to targeting tab
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));

      // Change to specific panels
      const targetingSelect = screen.getByRole('combobox', { name: /select target audience/i });
      await user.click(targetingSelect);
      await user.click(screen.getByRole('option', { name: /specific panels/i }));

      // Select first panel
      await user.click(screen.getByLabelText(/beta testers/i));

      // Wait for updated audience size
      await waitFor(() => {
        expect(screen.getByText(/25/)).toBeInTheDocument();
      });

      // Select second panel
      await user.click(screen.getByLabelText(/power users/i));

      // Wait for updated audience size (combined)
      await waitFor(() => {
        expect(screen.getByText(/70/)).toBeInTheDocument();
      });
    });

    it('should show loading state while calculating audience size', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        }), 100))
      );

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Navigate to targeting tab
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));

      // Verify loading state
      expect(screen.getByText(/calculating audience size/i)).toBeInTheDocument();

      // Wait for size to load
      await waitFor(() => {
        expect(screen.getByText(/1,250/)).toBeInTheDocument();
      });
    });

    it('should handle audience calculation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to calculate audience size' }),
      });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Navigate to targeting tab
      await user.click(screen.getByRole('tab', { name: /targeting & settings/i }));

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText(/failed to calculate audience size/i)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts and Accessibility', () => {
    it('should save draft on Ctrl+Enter', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'qnn_01HX5J3K4M',
          title: 'Test Survey',
          status: 'draft',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Press Ctrl+Enter
      const form = screen.getByRole('form', { name: /create questionnaire form/i });
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Verify save was triggered
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should have proper ARIA labels and roles', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Verify form role
      expect(screen.getByRole('form', { name: /create questionnaire form/i })).toBeInTheDocument();

      // Verify tab navigation
      expect(screen.getByRole('tab', { name: /general info/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /questions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /targeting & settings/i })).toBeInTheDocument();

      // Verify required field indicators
      const titleLabel = screen.getByText(/title/i);
      expect(titleLabel.querySelector('[aria-label="required"]')).toBeInTheDocument();
    });

    it('should announce loading states to screen readers', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'qnn_01HX5J3K4M',
          title: 'Test Survey',
          status: 'draft',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');

      // Add question
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');

      // Click save
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify screen reader announcement
      expect(screen.getByText(/saving questionnaire as draft/i)).toBeInTheDocument();
    });
  });

  describe('Cancel and Navigation', () => {
    it('should go back when cancel button is clicked', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Click cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Verify router.back() was called
      expect(mockBack).toHaveBeenCalled();
    });

    it('should disable cancel button while submitting', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ estimatedReach: 1250 }),
        })
        .mockImplementationOnce(
          () => new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, data: { id: 'qnn_01HX5J3K4M' } }),
          }), 100))
        );

      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Test Survey');
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));
      const questionTextInputs = screen.getAllByPlaceholderText(/enter your question in english/i);
      await user.type(questionTextInputs[0], 'Test question?');
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Verify cancel is disabled
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Preview Functionality', () => {
    it('should open preview modal when preview button is clicked', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Add a question first
      await user.click(screen.getByRole('tab', { name: /questions/i }));
      await user.click(screen.getByRole('button', { name: /add question/i }));

      // Click preview
      await user.click(screen.getByRole('button', { name: /preview/i }));

      // Verify modal opens
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should disable preview button when no questions', async () => {
      render(<QuestionnaireCreateForm availablePanels={mockPanels} />);

      // Verify preview is disabled
      const previewButton = screen.getByRole('button', { name: /preview/i });
      expect(previewButton).toBeDisabled();
    });
  });
});
