'use client';

import { useState } from 'react';
import { AttachmentPreview, Attachment } from './AttachmentPreview';
import { Button } from '@/components/ui/button';

/**
 * Example usage of AttachmentPreview component
 *
 * This demonstrates:
 * 1. Single image preview
 * 2. Multiple image gallery with navigation
 * 3. Integration with feedback attachments
 */

// Mock attachment data
const mockAttachments: Attachment[] = [
  {
    id: 'att_01JDQK0E6PXWZYHVF6QNMR8QTZ',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
    filename: 'screenshot-login-page.png',
    size: 245678,
    mimeType: 'image/png',
    uploadedAt: '2025-01-15T10:30:00Z',
  },
  {
    id: 'att_01JDQK0E6PXWZYHVF6QNMR8QUA',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920',
    filename: 'mobile-app-error.jpg',
    size: 189234,
    mimeType: 'image/jpeg',
    uploadedAt: '2025-01-15T10:32:00Z',
  },
  {
    id: 'att_01JDQK0E6PXWZYHVF6QNMR8QUB',
    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920',
    filename: 'ui-mockup.png',
    size: 312456,
    mimeType: 'image/png',
    uploadedAt: '2025-01-15T10:35:00Z',
  },
];

export function AttachmentPreviewExample() {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenPreview = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Optionally reset selection after animation completes
    setTimeout(() => setSelectedAttachment(null), 200);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedAttachment) return;

    const currentIndex = mockAttachments.findIndex((a) => a.id === selectedAttachment.id);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else {
      newIndex = currentIndex < mockAttachments.length - 1 ? currentIndex + 1 : currentIndex;
    }

    const nextAttachment = mockAttachments[newIndex];
    if (nextAttachment) {
      setSelectedAttachment(nextAttachment);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">AttachmentPreview Component</h1>
      <p className="text-muted-foreground mb-8">
        Click on any attachment to preview it in full screen
      </p>

      {/* Example 1: Image grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Image Gallery</h2>
        <div className="grid grid-cols-3 gap-4">
          {mockAttachments.map((attachment) => (
            <button
              key={attachment.id}
              onClick={() => handleOpenPreview(attachment)}
              className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group"
            >
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-xs truncate">{attachment.filename}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Example 2: List view with buttons */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Attachment List</h2>
        <div className="space-y-2">
          {mockAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{attachment.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {(attachment.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <Button onClick={() => handleOpenPreview(attachment)} variant="outline" size="sm">
                Preview
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Example 3: Single image preview */}
      {mockAttachments[0] && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Image</h2>
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
            <img
              src={mockAttachments[0].url}
              alt={mockAttachments[0].filename}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                const attachment = mockAttachments[0];
                if (attachment) handleOpenPreview(attachment);
              }}
            />
            <Button
              onClick={() => {
                const attachment = mockAttachments[0];
                if (attachment) handleOpenPreview(attachment);
              }}
              className="absolute bottom-4 right-4"
              size="sm"
            >
              View Full Size
            </Button>
          </div>
        </div>
      )}

      {/* The preview modal */}
      <AttachmentPreview
        attachment={selectedAttachment}
        allAttachments={mockAttachments}
        isOpen={isOpen}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />

      {/* Usage instructions */}
      <div className="mt-12 p-6 border border-border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li><kbd className="px-2 py-1 bg-background rounded">ESC</kbd> - Close preview</li>
          <li><kbd className="px-2 py-1 bg-background rounded">←</kbd> / <kbd className="px-2 py-1 bg-background rounded">→</kbd> - Navigate between images</li>
          <li><kbd className="px-2 py-1 bg-background rounded">+</kbd> / <kbd className="px-2 py-1 bg-background rounded">-</kbd> - Zoom in/out</li>
          <li><kbd className="px-2 py-1 bg-background rounded">0</kbd> - Reset zoom and position</li>
        </ul>
        <h3 className="font-semibold mt-4 mb-2">Features</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>✓ Full-screen modal overlay with dark backdrop</li>
          <li>✓ Zoom controls (0.5x - 3x)</li>
          <li>✓ Pan/drag when zoomed in</li>
          <li>✓ Navigation arrows for multiple images</li>
          <li>✓ Download button</li>
          <li>✓ Touch support for mobile devices</li>
          <li>✓ Accessible with ARIA labels and keyboard navigation</li>
        </ul>
      </div>
    </div>
  );
}
