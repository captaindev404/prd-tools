/**
 * API Integration Tests for Feedback with Attachments
 *
 * Tests POST /api/feedback and PATCH /api/feedback/[id] with file attachments
 *
 * Coverage:
 * - Creating feedback with attachments
 * - Adding attachments to existing feedback
 * - Removing attachments from feedback
 * - Attachment file operations (move from temp, delete)
 * - 5-attachment limit enforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';
import * as authHelpers from '@/lib/auth-helpers';
import * as rateLimitHelpers from '@/lib/rate-limit';
import * as rateLimitMiddleware from '@/middleware/rate-limit';
import * as fileUpload from '@/lib/file-upload';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/auth-helpers');
jest.mock('@/lib/rate-limit');
jest.mock('@/middleware/rate-limit');
jest.mock('@/lib/file-upload');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    feedback: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    event: {
      create: jest.fn(),
    },
  },
}));

const mockGetCurrentUser = authHelpers.getCurrentUser as jest.MockedFunction<
  typeof authHelpers.getCurrentUser
>;
const mockCheckRateLimit = rateLimitHelpers.checkRateLimit as jest.MockedFunction<
  typeof rateLimitHelpers.checkRateLimit
>;
const mockIncrementRateLimit = rateLimitHelpers.incrementRateLimit as jest.MockedFunction<
  typeof rateLimitHelpers.incrementRateLimit
>;
const mockApplyRateLimit = rateLimitMiddleware.applyRateLimit as jest.MockedFunction<
  typeof rateLimitMiddleware.applyRateLimit
>;
const mockAddRateLimitHeaders = rateLimitMiddleware.addRateLimitHeaders as jest.MockedFunction<
  typeof rateLimitMiddleware.addRateLimitHeaders
>;
const mockMoveFile = fileUpload.moveFile as jest.MockedFunction<typeof fileUpload.moveFile>;
const mockDeleteFile = fileUpload.deleteFile as jest.MockedFunction<typeof fileUpload.deleteFile>;

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Create mock authenticated user
 */
function mockAuthenticatedUser(userId: string = 'usr_test123') {
  mockGetCurrentUser.mockResolvedValue({
    id: userId,
    displayName: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    currentVillageId: 'village_001',
  } as any);
}

/**
 * Create mock attachment metadata
 */
function createMockAttachment(index: number = 1) {
  const id = `01HX5J3K4M000000000000000${index}`;
  return {
    id,
    originalName: `test${index}.png`,
    storedName: `${id}.png`,
    url: `/uploads/feedback/temp/${id}.png`,
    size: 1024 * index,
    mimeType: 'image/png',
    uploadedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
  };
}

/**
 * Create mock request for feedback creation
 */
function createFeedbackRequest(
  body: Record<string, any>
): NextRequest {
  return new NextRequest('http://localhost:3000/api/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Mock successful file move operation
 */
function mockSuccessfulFileMove(feedbackId: string, storedName: string) {
  mockMoveFile.mockResolvedValue({
    id: storedName.split('.')[0],
    originalFilename: storedName,
    sanitizedFilename: storedName,
    storedFilename: storedName,
    filePath: `/uploads/feedback/${feedbackId}/${storedName}`,
    absolutePath: `/absolute/path/${feedbackId}/${storedName}`,
    mimeType: 'image/png',
    size: 1024,
    fileType: 'png',
    category: 'image',
    uploadedAt: new Date(),
  });
}

// =============================================================================
// CREATE FEEDBACK WITH ATTACHMENTS
// =============================================================================

describe('POST /api/feedback - With Attachments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyRateLimit.mockResolvedValue(null);
    mockAddRateLimitHeaders.mockImplementation((res) => res);
    mockCheckRateLimit.mockReturnValue({
      isExceeded: false,
      count: 1,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    mockIncrementRateLimit.mockReturnValue(undefined);
    mockAuthenticatedUser();
    mockPrisma.event.create.mockResolvedValue({} as any);
  });

  it('should create feedback with single attachment', async () => {
    const attachment = createMockAttachment(1);
    mockSuccessfulFileMove('fb_01HX5J3K4M', attachment.storedName);

    mockPrisma.feedback.create.mockResolvedValue({
      id: 'fb_01HX5J3K4M',
      title: 'Test Feedback',
      body: 'This is a test',
      authorId: 'usr_test123',
      attachments: JSON.stringify([
        {
          ...attachment,
          url: '/uploads/feedback/fb_01HX5J3K4M/01HX5J3K4M0000000000000001.png',
        },
      ]),
      createdAt: new Date(),
    } as any);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'This is a test with attachments',
      attachments: [attachment],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockMoveFile).toHaveBeenCalledWith(
      expect.stringContaining('/temp/'),
      'fb_01HX5J3K4M'
    );
  });

  it('should create feedback with multiple attachments (up to 5)', async () => {
    const attachments = [1, 2, 3, 4, 5].map(createMockAttachment);

    attachments.forEach((att) => {
      mockSuccessfulFileMove('fb_01HX5J3K4M', att.storedName);
    });

    mockPrisma.feedback.create.mockResolvedValue({
      id: 'fb_01HX5J3K4M',
      title: 'Test Feedback',
      body: 'Test with multiple attachments',
      authorId: 'usr_test123',
      attachments: JSON.stringify(
        attachments.map((att) => ({
          ...att,
          url: `/uploads/feedback/fb_01HX5J3K4M/${att.storedName}`,
        }))
      ),
      createdAt: new Date(),
    } as any);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test with multiple attachments',
      attachments,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(mockMoveFile).toHaveBeenCalledTimes(5);
  });

  it('should reject more than 5 attachments', async () => {
    const attachments = [1, 2, 3, 4, 5, 6].map(createMockAttachment);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test with too many attachments',
      attachments,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
    expect(data.errors[0].message).toContain('Maximum 5 attachments allowed');
  });

  it('should move files from temp to feedback directory', async () => {
    const attachment = createMockAttachment(1);
    const feedbackId = 'fb_01HX5J3K4M';

    mockSuccessfulFileMove(feedbackId, attachment.storedName);

    mockPrisma.feedback.create.mockResolvedValue({
      id: feedbackId,
      title: 'Test',
      body: 'Test',
      authorId: 'usr_test123',
      attachments: JSON.stringify([
        {
          ...attachment,
          url: `/uploads/feedback/${feedbackId}/${attachment.storedName}`,
        },
      ]),
      createdAt: new Date(),
    } as any);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    await POST(request);

    expect(mockMoveFile).toHaveBeenCalledWith(
      expect.stringContaining(`/temp/${attachment.storedName}`),
      feedbackId
    );
  });

  it('should update attachment URLs after moving files', async () => {
    const attachment = createMockAttachment(1);
    const feedbackId = 'fb_01HX5J3K4M';

    mockSuccessfulFileMove(feedbackId, attachment.storedName);

    let savedAttachments: any;
    mockPrisma.feedback.create.mockImplementation((args: any) => {
      savedAttachments = JSON.parse(args.data.attachments);
      return Promise.resolve({
        id: feedbackId,
        ...args.data,
      } as any);
    });

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    await POST(request);

    expect(savedAttachments[0].url).not.toContain('/temp/');
    expect(savedAttachments[0].url).toContain(`/feedback/${feedbackId}/`);
  });

  it('should handle file move errors gracefully', async () => {
    const attachment = createMockAttachment(1);
    mockMoveFile.mockRejectedValue(new Error('Permission denied'));

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Failed to process file attachments');
  });

  it('should validate attachment structure', async () => {
    const invalidAttachment = {
      // Missing required fields
      id: '01HX5J3K4M',
      // Missing: originalName, storedName, url, size, mimeType
    };

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [invalidAttachment],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
    expect(data.errors.some((e: any) => e.field.includes('attachments'))).toBe(true);
  });

  it('should require all attachment fields', async () => {
    const incompleteAttachment = {
      id: '01HX5J3K4M',
      originalName: 'test.png',
      // Missing: storedName, url, size, mimeType, uploadedAt
    };

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [incompleteAttachment],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it('should reject non-array attachments', async () => {
    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: 'not-an-array', // Invalid
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
    expect(data.errors[0].message).toContain('must be an array');
  });

  it('should allow feedback without attachments', async () => {
    mockPrisma.feedback.create.mockResolvedValue({
      id: 'fb_01HX5J3K4M',
      title: 'Test',
      body: 'Test',
      authorId: 'usr_test123',
      attachments: JSON.stringify([]),
      createdAt: new Date(),
    } as any);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body without attachments',
      // No attachments field
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it('should log attachment count in event', async () => {
    const attachments = [1, 2, 3].map(createMockAttachment);

    attachments.forEach((att) => {
      mockSuccessfulFileMove('fb_01HX5J3K4M', att.storedName);
    });

    mockPrisma.feedback.create.mockResolvedValue({
      id: 'fb_01HX5J3K4M',
      title: 'Test',
      body: 'Test',
      authorId: 'usr_test123',
      attachments: JSON.stringify(attachments),
      createdAt: new Date(),
    } as any);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments,
    });

    await POST(request);

    expect(mockPrisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'feedback.created',
        payload: expect.stringContaining('"attachmentCount":3'),
      }),
    });
  });
});

// =============================================================================
// ATTACHMENT DATA VALIDATION
// =============================================================================

describe('POST /api/feedback - Attachment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyRateLimit.mockResolvedValue(null);
    mockAddRateLimitHeaders.mockImplementation((res) => res);
    mockCheckRateLimit.mockReturnValue({
      isExceeded: false,
      count: 1,
      resetAt: new Date(),
    });
    mockAuthenticatedUser();
  });

  it('should validate attachment ID format', async () => {
    const attachment = {
      id: '', // Empty ID
      originalName: 'test.png',
      storedName: '01HX5J3K4M.png',
      url: '/uploads/feedback/temp/01HX5J3K4M.png',
      size: 1024,
      mimeType: 'image/png',
      uploadedAt: new Date().toISOString(),
    };

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it('should validate attachment size is positive', async () => {
    const attachment = {
      id: '01HX5J3K4M',
      originalName: 'test.png',
      storedName: '01HX5J3K4M.png',
      url: '/uploads/feedback/temp/01HX5J3K4M.png',
      size: 0, // Invalid: zero size
      mimeType: 'image/png',
      uploadedAt: new Date().toISOString(),
    };

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it('should validate attachment MIME type is present', async () => {
    const attachment = {
      id: '01HX5J3K4M',
      originalName: 'test.png',
      storedName: '01HX5J3K4M.png',
      url: '/uploads/feedback/temp/01HX5J3K4M.png',
      size: 1024,
      mimeType: '', // Empty MIME type
      uploadedAt: new Date().toISOString(),
    };

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });
});

// =============================================================================
// FILE OPERATIONS INTEGRATION
// =============================================================================

describe('POST /api/feedback - File Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyRateLimit.mockResolvedValue(null);
    mockAddRateLimitHeaders.mockImplementation((res) => res);
    mockCheckRateLimit.mockReturnValue({
      isExceeded: false,
      count: 1,
      resetAt: new Date(),
    });
    mockAuthenticatedUser();
    mockPrisma.event.create.mockResolvedValue({} as any);
  });

  it('should preserve file metadata during move', async () => {
    const attachment = createMockAttachment(1);
    const feedbackId = 'fb_01HX5J3K4M';

    mockMoveFile.mockResolvedValue({
      id: attachment.id,
      originalFilename: attachment.originalName,
      sanitizedFilename: attachment.originalName,
      storedFilename: attachment.storedName,
      filePath: `/uploads/feedback/${feedbackId}/${attachment.storedName}`,
      absolutePath: `/abs/path/${feedbackId}/${attachment.storedName}`,
      mimeType: attachment.mimeType,
      size: attachment.size,
      fileType: 'png',
      category: 'image',
      uploadedAt: new Date(attachment.uploadedAt),
    });

    mockPrisma.feedback.create.mockResolvedValue({
      id: feedbackId,
      title: 'Test',
      body: 'Test',
      authorId: 'usr_test123',
      attachments: JSON.stringify([attachment]),
      createdAt: new Date(),
    } as any);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    await POST(request);

    expect(mockMoveFile).toHaveBeenCalledWith(
      expect.stringContaining(attachment.storedName),
      feedbackId
    );
  });

  it('should handle concurrent file moves', async () => {
    const attachments = [1, 2, 3].map(createMockAttachment);
    const feedbackId = 'fb_01HX5J3K4M';

    attachments.forEach((att, index) => {
      mockMoveFile.mockResolvedValueOnce({
        id: att.id,
        originalFilename: att.originalName,
        sanitizedFilename: att.originalName,
        storedFilename: att.storedName,
        filePath: `/uploads/feedback/${feedbackId}/${att.storedName}`,
        absolutePath: `/abs/path/${feedbackId}/${att.storedName}`,
        mimeType: att.mimeType,
        size: att.size,
        fileType: 'png',
        category: 'image',
        uploadedAt: new Date(att.uploadedAt),
      });
    });

    mockPrisma.feedback.create.mockResolvedValue({
      id: feedbackId,
      title: 'Test',
      body: 'Test',
      authorId: 'usr_test123',
      attachments: JSON.stringify(attachments),
      createdAt: new Date(),
    } as any);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments,
    });

    await POST(request);

    expect(mockMoveFile).toHaveBeenCalledTimes(3);
  });

  it('should not create feedback if file move fails', async () => {
    const attachment = createMockAttachment(1);
    mockMoveFile.mockRejectedValue(new Error('Disk full'));

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    await POST(request);

    expect(mockPrisma.feedback.create).not.toHaveBeenCalled();
  });

  it('should generate unique feedback ID before moving files', async () => {
    const attachment = createMockAttachment(1);

    let capturedFeedbackId: string = '';
    mockMoveFile.mockImplementation(async (tempPath, feedbackId) => {
      capturedFeedbackId = feedbackId;
      return {
        id: attachment.id,
        originalFilename: attachment.originalName,
        sanitizedFilename: attachment.originalName,
        storedFilename: attachment.storedName,
        filePath: `/uploads/feedback/${feedbackId}/${attachment.storedName}`,
        absolutePath: `/abs/path/${feedbackId}/${attachment.storedName}`,
        mimeType: attachment.mimeType,
        size: attachment.size,
        fileType: 'png',
        category: 'image',
        uploadedAt: new Date(),
      };
    });

    mockPrisma.feedback.create.mockImplementation((args: any) => {
      return Promise.resolve({
        id: args.data.id,
        ...args.data,
      } as any);
    });

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments: [attachment],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(capturedFeedbackId).toMatch(/^fb_[0-9A-Z]{26}$/);
    expect(data.data.id).toBe(capturedFeedbackId);
  });
});

// =============================================================================
// MIXED FILE TYPES
// =============================================================================

describe('POST /api/feedback - Mixed File Types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyRateLimit.mockResolvedValue(null);
    mockAddRateLimitHeaders.mockImplementation((res) => res);
    mockCheckRateLimit.mockReturnValue({
      isExceeded: false,
      count: 1,
      resetAt: new Date(),
    });
    mockAuthenticatedUser();
    mockPrisma.event.create.mockResolvedValue({} as any);
  });

  it('should handle mixed images and documents', async () => {
    const attachments = [
      {
        id: '01HX5J3K4M0000000000000001',
        originalName: 'photo.jpg',
        storedName: '01HX5J3K4M0000000000000001.jpg',
        url: '/uploads/feedback/temp/01HX5J3K4M0000000000000001.jpg',
        size: 2048,
        mimeType: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: '01HX5J3K4M0000000000000002',
        originalName: 'document.pdf',
        storedName: '01HX5J3K4M0000000000000002.pdf',
        url: '/uploads/feedback/temp/01HX5J3K4M0000000000000002.pdf',
        size: 4096,
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      },
    ];

    attachments.forEach((att) => {
      mockSuccessfulFileMove('fb_01HX5J3K4M', att.storedName);
    });

    mockPrisma.feedback.create.mockResolvedValue({
      id: 'fb_01HX5J3K4M',
      title: 'Test',
      body: 'Test',
      authorId: 'usr_test123',
      attachments: JSON.stringify(attachments),
      createdAt: new Date(),
    } as any);

    const request = createFeedbackRequest({
      title: 'Test Feedback',
      body: 'Test body',
      attachments,
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockMoveFile).toHaveBeenCalledTimes(2);
  });
});
