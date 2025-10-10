/**
 * AttachmentPreview Component Tests
 *
 * Tests for the AttachmentPreview lightbox component including:
 * - Rendering and visibility
 * - Keyboard navigation
 * - Zoom controls
 * - Download functionality
 * - Accessibility
 * - Multiple image navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttachmentPreview, Attachment } from './AttachmentPreview';

const mockAttachment: Attachment = {
  id: 'att_01JDQK0E6PXWZYHVF6QNMR8QTZ',
  url: 'https://example.com/image.png',
  filename: 'test-image.png',
  size: 245678,
  mimeType: 'image/png',
  uploadedAt: '2025-01-15T10:30:00Z',
};

const mockAttachments: Attachment[] = [
  mockAttachment,
  {
    id: 'att_01JDQK0E6PXWZYHVF6QNMR8QUA',
    url: 'https://example.com/image2.jpg',
    filename: 'second-image.jpg',
    size: 189234,
    mimeType: 'image/jpeg',
    uploadedAt: '2025-01-15T10:32:00Z',
  },
  {
    id: 'att_01JDQK0E6PXWZYHVF6QNMR8QUB',
    url: 'https://example.com/image3.png',
    filename: 'third-image.png',
    size: 312456,
    mimeType: 'image/png',
    uploadedAt: '2025-01-15T10:35:00Z',
  },
];

describe('AttachmentPreview', () => {
  const mockOnClose = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('test-image.png')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    it('should not render when attachment is null', () => {
      render(
        <AttachmentPreview
          attachment={null}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display image with correct src and alt', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const image = screen.getByAltText('test-image.png');
      expect(image).toHaveAttribute('src', 'https://example.com/image.png');
    });

    it('should display file metadata', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/239.92 KB/)).toBeInTheDocument();
      expect(screen.getByText(/Uploaded/)).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('Close preview');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when ESC key is pressed', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should prevent body scroll when open', () => {
      const { rerender } = render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Zoom Controls', () => {
    it('should display zoom controls for images', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should increase zoom when zoom in button is clicked', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const zoomInButton = screen.getByLabelText('Zoom in');
      fireEvent.click(zoomInButton);

      expect(screen.getByText('125%')).toBeInTheDocument();
    });

    it('should decrease zoom when zoom out button is clicked', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const zoomInButton = screen.getByLabelText('Zoom in');
      const zoomOutButton = screen.getByLabelText('Zoom out');

      fireEvent.click(zoomInButton);
      fireEvent.click(zoomOutButton);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should increase zoom with + key', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(window, { key: '+' });

      expect(screen.getByText('125%')).toBeInTheDocument();
    });

    it('should decrease zoom with - key', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '-' });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should reset zoom with 0 key', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '0' });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should not zoom beyond max (3x)', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const zoomInButton = screen.getByLabelText('Zoom in');

      // Click 10 times to try to exceed max
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomInButton);
      }

      expect(screen.getByText('300%')).toBeInTheDocument();
    });

    it('should not zoom below min (0.5x)', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const zoomOutButton = screen.getByLabelText('Zoom out');

      // Click 10 times to try to go below min
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomOutButton);
      }

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should show navigation arrows when there are multiple attachments', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[1]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('should show current position in gallery', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[1]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should call onNavigate with "prev" when previous button is clicked', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[1]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      const prevButton = screen.getByLabelText('Previous image');
      fireEvent.click(prevButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('prev');
    });

    it('should call onNavigate with "next" when next button is clicked', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[1]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('next');
    });

    it('should navigate with arrow keys', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[1]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(mockOnNavigate).toHaveBeenCalledWith('prev');

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(mockOnNavigate).toHaveBeenCalledWith('next');
    });

    it('should disable previous button on first image', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[0]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      const prevButton = screen.getByLabelText('Previous image');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last image', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[2]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      const nextButton = screen.getByLabelText('Next image');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Download Functionality', () => {
    it('should have a download button', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Download attachment')).toBeInTheDocument();
    });

    it('should trigger download when download button is clicked', async () => {
      // Mock fetch and URL.createObjectURL
      global.fetch = vi.fn(() =>
        Promise.resolve({
          blob: () => Promise.resolve(new Blob()),
        } as Response)
      );
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      render(
        <AttachmentPreview
          attachment={mockAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const downloadButton = screen.getByLabelText('Download attachment');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(mockAttachment.url);
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  describe('Non-Image Files', () => {
    it('should show fallback message for non-image files', () => {
      const pdfAttachment: Attachment = {
        ...mockAttachment,
        mimeType: 'application/pdf',
        filename: 'document.pdf',
      };

      render(
        <AttachmentPreview
          attachment={pdfAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Preview not available for this file type.')).toBeInTheDocument();
      expect(screen.getByText('application/pdf')).toBeInTheDocument();
    });

    it('should not show zoom controls for non-image files', () => {
      const pdfAttachment: Attachment = {
        ...mockAttachment,
        mimeType: 'application/pdf',
      };

      render(
        <AttachmentPreview
          attachment={pdfAttachment}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByLabelText('Zoom in')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Zoom out')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all interactive elements', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[1]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByLabelText('Close preview')).toBeInTheDocument();
      expect(screen.getByLabelText('Download attachment')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('should announce attachment information to screen readers', () => {
      render(
        <AttachmentPreview
          attachment={mockAttachments[1]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent('Viewing second-image.jpg (2 of 3)');
    });
  });

  describe('Zoom State Reset', () => {
    it('should reset zoom and position when attachment changes', () => {
      const { rerender } = render(
        <AttachmentPreview
          attachment={mockAttachments[0]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      // Zoom in
      const zoomInButton = screen.getByLabelText('Zoom in');
      fireEvent.click(zoomInButton);
      expect(screen.getByText('125%')).toBeInTheDocument();

      // Change attachment
      rerender(
        <AttachmentPreview
          attachment={mockAttachments[1]}
          allAttachments={mockAttachments}
          isOpen={true}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
        />
      );

      // Zoom should be reset
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});
