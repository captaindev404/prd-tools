'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Attachment type based on Feedback schema (attachments stored as JSON array)
 */
export interface Attachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

interface AttachmentPreviewProps {
  attachment: Attachment | null;
  allAttachments?: Attachment[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format upload date to human-readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * AttachmentPreview - Full-screen image lightbox/modal for previewing attachments
 *
 * Features:
 * - Full-screen modal overlay with dark backdrop
 * - Display full-size image with zoom controls
 * - Show filename and metadata
 * - Close button (X) and ESC key support
 * - Navigation arrows for multiple images (previous/next)
 * - Download button
 * - Responsive design with touch support
 * - Keyboard navigation (arrow keys, ESC)
 * - Focus trap and accessibility features
 */
export function AttachmentPreview({
  attachment,
  allAttachments = [],
  isOpen,
  onClose,
  onNavigate,
}: AttachmentPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  // Get current attachment index
  const currentIndex = attachment
    ? allAttachments.findIndex((a) => a.id === attachment.id)
    : -1;
  const hasMultiple = allAttachments.length > 1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allAttachments.length - 1;

  // Reset zoom and position when attachment changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [attachment?.id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev && onNavigate) {
            e.preventDefault();
            onNavigate('prev');
          }
          break;
        case 'ArrowRight':
          if (hasNext && onNavigate) {
            e.preventDefault();
            onNavigate('next');
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoom((prev) => Math.min(prev + 0.25, 3));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setZoom((prev) => Math.max(prev - 0.25, 0.5));
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          setPosition({ x: 0, y: 0 });
          break;
      }
    },
    [isOpen, hasPrev, hasNext, onNavigate, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle download
  const handleDownload = async () => {
    if (!attachment) return;

    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle zoom
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      setStartPosition({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 1) {
      setPosition({
        x: e.clientX - startPosition.x,
        y: e.clientY - startPosition.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (zoom > 1 && e.touches.length === 1 && touch) {
      setIsPanning(true);
      setStartPosition({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (isPanning && zoom > 1 && e.touches.length === 1 && touch) {
      setPosition({
        x: touch.clientX - startPosition.x,
        y: touch.clientY - startPosition.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  if (!attachment) return null;

  const isImage = attachment.mimeType.startsWith('image/');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        {/* Custom overlay with backdrop blur */}
        <DialogOverlay className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Custom content - full screen without default Dialog styles */}
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Header with controls */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm">
                {attachment.filename}
              </span>
              {hasMultiple && (
                <span className="text-white/60 text-xs">
                  {currentIndex + 1} / {allAttachments.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls for images */}
              {isImage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="text-white hover:bg-white/10"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                  <span className="text-white text-sm min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="text-white hover:bg-white/10"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Download button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/10"
                aria-label="Download attachment"
              >
                <Download className="h-5 w-5" />
              </Button>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation arrows */}
          {hasMultiple && onNavigate && (
            <>
              {/* Previous button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('prev')}
                disabled={!hasPrev}
                className={cn(
                  'absolute left-4 top-1/2 -translate-y-1/2 z-10',
                  'h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70',
                  !hasPrev && 'opacity-0 pointer-events-none'
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              {/* Next button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('next')}
                disabled={!hasNext}
                className={cn(
                  'absolute right-4 top-1/2 -translate-y-1/2 z-10',
                  'h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70',
                  !hasNext && 'opacity-0 pointer-events-none'
                )}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Main content area - clickable to close */}
          <div
            className="flex-1 flex items-center justify-center p-4 cursor-pointer"
            onClick={(e) => {
              // Only close if clicking the backdrop, not the image
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close preview (click outside image)"
          >
            {isImage ? (
              <img
                src={attachment.url}
                alt={attachment.filename}
                className={cn(
                  'max-w-full max-h-full object-contain transition-transform',
                  zoom > 1 && 'cursor-move'
                )}
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                draggable={false}
              />
            ) : (
              <div className="bg-white/10 rounded-lg p-8 max-w-md">
                <p className="text-white text-center">
                  Preview not available for this file type.
                </p>
                <p className="text-white/60 text-sm text-center mt-2">
                  {attachment.mimeType}
                </p>
              </div>
            )}
          </div>

          {/* Footer with metadata */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex flex-col gap-1">
              <span className="text-white/80 text-sm">
                {formatFileSize(attachment.size)}
              </span>
              <span className="text-white/60 text-xs">
                Uploaded {formatDate(attachment.uploadedAt)}
              </span>
            </div>

            {isImage && zoom > 1 && (
              <div className="text-white/60 text-xs">
                Use mouse or touch to pan. Press 0 to reset.
              </div>
            )}
          </div>

          {/* Screen reader announcements */}
          <div className="sr-only" role="status" aria-live="polite">
            {isOpen && attachment && (
              <span>
                Viewing {attachment.filename}
                {hasMultiple && ` (${currentIndex + 1} of ${allAttachments.length})`}
              </span>
            )}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
