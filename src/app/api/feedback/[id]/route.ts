import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redactPII } from '@/lib/pii-redact';
import { getCurrentUser, canEditFeedback } from '@/lib/auth-helpers';
import { handleApiError, ApiErrors } from '@/lib/api-errors';
import type { UpdateFeedbackInput, Attachment } from '@/types/feedback';
import { moveFile, deleteFile, FILE_UPLOAD_LIMITS } from '@/lib/file-upload';
import * as path from 'path';

/**
 * GET /api/feedback/[id] - Get single feedback item with full details
 *
 * Returns:
 * - Feedback with author details
 * - Feature information
 * - Vote count and weight
 * - Duplicate information
 * - All votes with user info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { id: feedbackId } = await params;

    // Fetch feedback with all relations
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
        feature: {
          select: {
            id: true,
            title: true,
            area: true,
            status: true,
          },
        },
        village: {
          select: {
            id: true,
            name: true,
          },
        },
        duplicateOf: {
          select: {
            id: true,
            title: true,
          },
        },
        duplicates: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!feedback) {
      throw ApiErrors.notFound('Feedback', 'Feedback item not found');
    }

    // Calculate vote statistics
    const voteStats = await prisma.vote.aggregate({
      where: { feedbackId: feedback.id },
      _sum: {
        weight: true,
        decayedWeight: true,
      },
      _count: true,
    });

    // Check if current user has voted (if authenticated)
    const user = await getCurrentUser();
    let userHasVoted = false;
    if (user) {
      const userVote = await prisma.vote.findUnique({
        where: {
          feedbackId_userId: {
            feedbackId: feedback.id,
            userId: user.id,
          },
        },
      });
      userHasVoted = !!userVote;
    }

    return NextResponse.json({
      ...feedback,
      voteCount: voteStats._count || 0,
      voteWeight: voteStats._sum.decayedWeight || 0,
      userHasVoted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/feedback/[id] - Edit feedback
 *
 * Authorization:
 * - User is author AND within 15-minute edit window
 * - OR user has PM/PO/ADMIN role
 *
 * Request body:
 * - title?: string (8-120 chars)
 * - body?: string (20-5000 chars)
 * - attachments?: Array<Attachment> (new attachments to add, enforces max 5 total)
 * - attachmentsToRemove?: string[] (attachment IDs to remove)
 *
 * Features:
 * - PII redaction applied to updates
 * - Validation for length constraints
 * - File attachment management (add/remove within edit window)
 * - Enforces max 5 attachments total
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to edit feedback');
    }

    const { id: feedbackId } = await params;

    // Fetch existing feedback
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
        authorId: true,
        editWindowEndsAt: true,
        title: true,
        body: true,
        attachments: true,
      },
    });

    if (!existingFeedback) {
      throw ApiErrors.notFound('Feedback', 'Feedback item not found');
    }

    // Check authorization
    if (!canEditFeedback(user, existingFeedback)) {
      const message = user.id === existingFeedback.authorId
        ? 'The edit window for this feedback has expired'
        : 'You do not have permission to edit this feedback';
      throw ApiErrors.forbidden(message);
    }

    // Parse and validate request body
    let body: UpdateFeedbackInput;
    try {
      body = await request.json();
    } catch (error) {
      throw ApiErrors.badRequest('Invalid JSON in request body');
    }

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        errors.push({ field: 'title', message: 'Title must be a string' });
      } else if (body.title.length < 8) {
        errors.push({ field: 'title', message: 'Title must be at least 8 characters' });
      } else if (body.title.length > 120) {
        errors.push({ field: 'title', message: 'Title must not exceed 120 characters' });
      }
    }

    if (body.body !== undefined) {
      if (typeof body.body !== 'string') {
        errors.push({ field: 'body', message: 'Body must be a string' });
      } else if (body.body.length < 20) {
        errors.push({ field: 'body', message: 'Body must be at least 20 characters' });
      } else if (body.body.length > 5000) {
        errors.push({ field: 'body', message: 'Body must not exceed 5000 characters' });
      }
    }

    // Parse existing attachments
    let currentAttachments: Attachment[] = [];
    try {
      currentAttachments = existingFeedback.attachments
        ? JSON.parse(existingFeedback.attachments)
        : [];
    } catch (error) {
      console.error('Failed to parse existing attachments:', error);
      currentAttachments = [];
    }

    // Validate attachmentsToRemove if provided
    if (body.attachmentsToRemove !== undefined) {
      if (!Array.isArray(body.attachmentsToRemove)) {
        errors.push({
          field: 'attachmentsToRemove',
          message: 'attachmentsToRemove must be an array',
        });
      } else {
        // Validate that all IDs exist in current attachments
        body.attachmentsToRemove.forEach((id, index) => {
          if (typeof id !== 'string') {
            errors.push({
              field: `attachmentsToRemove[${index}]`,
              message: 'Attachment ID must be a string',
            });
          } else if (!currentAttachments.some(a => a.id === id)) {
            errors.push({
              field: `attachmentsToRemove[${index}]`,
              message: `Attachment with ID ${id} not found`,
            });
          }
        });
      }
    }

    // Validate new attachments if provided
    if (body.attachments !== undefined) {
      if (!Array.isArray(body.attachments)) {
        errors.push({
          field: 'attachments',
          message: 'Attachments must be an array',
        });
      } else {
        // Calculate total attachments after add/remove
        const attachmentsToRemove = body.attachmentsToRemove || [];
        const remainingCount = currentAttachments.length - attachmentsToRemove.length;
        const totalAfterUpdate = remainingCount + body.attachments.length;

        if (totalAfterUpdate > FILE_UPLOAD_LIMITS.MAX_FILES) {
          errors.push({
            field: 'attachments',
            message: `Total attachments cannot exceed ${FILE_UPLOAD_LIMITS.MAX_FILES}. Current: ${currentAttachments.length}, removing: ${attachmentsToRemove.length}, adding: ${body.attachments.length}`,
          });
        }

        // Validate each attachment structure
        body.attachments.forEach((attachment, index) => {
          if (!attachment.id || typeof attachment.id !== 'string') {
            errors.push({
              field: `attachments[${index}].id`,
              message: 'Attachment ID is required',
            });
          }
          if (!attachment.originalName || typeof attachment.originalName !== 'string') {
            errors.push({
              field: `attachments[${index}].originalName`,
              message: 'Attachment originalName is required',
            });
          }
          if (!attachment.storedName || typeof attachment.storedName !== 'string') {
            errors.push({
              field: `attachments[${index}].storedName`,
              message: 'Attachment storedName is required',
            });
          }
          if (!attachment.url || typeof attachment.url !== 'string') {
            errors.push({
              field: `attachments[${index}].url`,
              message: 'Attachment URL is required',
            });
          }
          if (typeof attachment.size !== 'number' || attachment.size <= 0) {
            errors.push({
              field: `attachments[${index}].size`,
              message: 'Attachment size must be a positive number',
            });
          }
          if (!attachment.mimeType || typeof attachment.mimeType !== 'string') {
            errors.push({
              field: `attachments[${index}].mimeType`,
              message: 'Attachment mimeType is required',
            });
          }
        });
      }
    }

    if (errors.length > 0) {
      throw ApiErrors.validationError(errors, 'Please check your input and try again');
    }

    // Prepare update data with PII redaction
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = redactPII(body.title);
    }

    if (body.body !== undefined) {
      updateData.body = redactPII(body.body);
    }

    // Process attachment changes
    let updatedAttachments = [...currentAttachments];
    const deletedFilePaths: string[] = [];

    // Remove attachments
    if (body.attachmentsToRemove && body.attachmentsToRemove.length > 0) {
      body.attachmentsToRemove.forEach(idToRemove => {
        const attachmentToRemove = updatedAttachments.find(a => a.id === idToRemove);
        if (attachmentToRemove) {
          // Build file path from URL
          // URL format: /uploads/feedback/{feedbackId}/{storedName}
          const filePath = path.join(
            process.cwd(),
            'public',
            'uploads',
            'feedback',
            feedbackId,
            attachmentToRemove.storedName
          );
          deletedFilePaths.push(filePath);

          // Remove from array
          updatedAttachments = updatedAttachments.filter(a => a.id !== idToRemove);
        }
      });
    }

    // Add new attachments
    if (body.attachments && body.attachments.length > 0) {
      try {
        for (const attachment of body.attachments) {
          // Move file from temp to feedback directory
          const tempPath = path.join(
            process.cwd(),
            'public',
            'uploads',
            'feedback',
            'temp',
            attachment.storedName
          );

          const movedFile = await moveFile(tempPath, feedbackId);

          // Add to attachments array
          updatedAttachments.push({
            id: attachment.id,
            originalName: attachment.originalName,
            storedName: attachment.storedName,
            url: movedFile.filePath, // Updated URL with feedbackId
            size: attachment.size,
            mimeType: attachment.mimeType,
            uploadedAt: attachment.uploadedAt || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to process new attachments:', error);
        throw ApiErrors.badRequest(
          `Failed to process file attachments: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update attachments field if any changes were made
    if (body.attachments || body.attachmentsToRemove) {
      updateData.attachments = JSON.stringify(updatedAttachments);
    }

    // Update feedback
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
        feature: {
          select: {
            id: true,
            title: true,
            area: true,
          },
        },
      },
    });

    // Delete removed attachment files (async, don't wait)
    if (deletedFilePaths.length > 0) {
      Promise.all(deletedFilePaths.map(fp => deleteFile(fp)))
        .then(results => {
          const deletedCount = results.filter(Boolean).length;
          console.log(`Deleted ${deletedCount}/${deletedFilePaths.length} attachment files`);
        })
        .catch(error => {
          console.error('Error deleting attachment files:', error);
        });
    }

    // Log event
    await prisma.event.create({
      data: {
        type: 'feedback.updated',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId: updatedFeedback.id,
          updatedFields: Object.keys(updateData),
          attachmentsAdded: body.attachments?.length || 0,
          attachmentsRemoved: body.attachmentsToRemove?.length || 0,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/feedback/[id] - Delete feedback (GDPR cascade delete)
 *
 * Authorization:
 * - User is author AND within 15-minute edit window
 * - OR user has ADMIN role
 *
 * Features:
 * - GDPR-compliant cascade delete
 * - Deletes all physical attachment files from filesystem
 * - Cascades to votes (handled by Prisma onDelete: Cascade)
 * - Logs deletion to audit log
 * - Graceful error handling (continues even if some files can't be deleted)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to delete feedback');
    }

    const { id: feedbackId } = await params;

    // Fetch existing feedback with attachments
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
        authorId: true,
        editWindowEndsAt: true,
        title: true,
        attachments: true,
      },
    });

    if (!existingFeedback) {
      throw ApiErrors.notFound('Feedback', 'Feedback item not found');
    }

    // Check authorization
    // Only author within edit window OR ADMIN can delete
    const isAuthor = user.id === existingFeedback.authorId;
    const isAdmin = user.role === 'ADMIN';
    const withinEditWindow = existingFeedback.editWindowEndsAt
      ? new Date() < new Date(existingFeedback.editWindowEndsAt)
      : false;

    if (!isAdmin && (!isAuthor || !withinEditWindow)) {
      const message = isAuthor
        ? 'The edit window for this feedback has expired. Only administrators can delete feedback after the edit window.'
        : 'You do not have permission to delete this feedback';
      throw ApiErrors.forbidden(message);
    }

    // Parse attachments to get file paths
    let attachments: Attachment[] = [];
    try {
      attachments = existingFeedback.attachments
        ? JSON.parse(existingFeedback.attachments)
        : [];
    } catch (error) {
      console.error('Failed to parse attachments:', error);
      // Continue with deletion even if parsing fails
    }

    // Build file paths for deletion
    const filePaths: string[] = attachments.map(attachment => {
      // URL format: /uploads/feedback/{feedbackId}/{storedName}
      return path.join(
        process.cwd(),
        'public',
        'uploads',
        'feedback',
        feedbackId,
        attachment.storedName
      );
    });

    // Delete feedback from database
    // Votes will be automatically deleted due to onDelete: Cascade in schema
    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    // Delete attachment files (async, graceful error handling)
    let deletedFilesCount = 0;
    let failedFilesCount = 0;

    if (filePaths.length > 0) {
      const deleteResults = await Promise.allSettled(
        filePaths.map(fp => deleteFile(fp))
      );

      deleteResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          deletedFilesCount++;
        } else {
          failedFilesCount++;
          console.warn(
            `Failed to delete attachment file: ${filePaths[index]}`,
            result.status === 'rejected' ? result.reason : 'File not found'
          );
        }
      });

      console.log(
        `Deleted ${deletedFilesCount}/${filePaths.length} attachment files for feedback ${feedbackId}`
      );
    }

    // Log deletion event
    await prisma.event.create({
      data: {
        type: 'feedback.deleted',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId,
          feedbackTitle: existingFeedback.title,
          attachmentsDeleted: deletedFilesCount,
          attachmentsFailed: failedFilesCount,
          deletedBy: user.id,
          deletedByRole: user.role,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
      data: {
        id: feedbackId,
        attachmentsDeleted: deletedFilesCount,
        attachmentsFailed: failedFilesCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
