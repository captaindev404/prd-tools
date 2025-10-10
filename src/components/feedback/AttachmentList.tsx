'use client';

import { useState } from 'react';
import { Paperclip, Download, Eye, FileText, File, Image as ImageIcon, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Attachment data structure
 */
export interface Attachment {
  id: string;
  originalName: string;
  storedName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Props for the AttachmentList component
 */
export interface AttachmentListProps {
  attachments: Attachment[];
  onPreview?: (attachment: Attachment) => void;
  className?: string;
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.3 MB", "1.1 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get the appropriate icon for a file based on MIME type
 * @param mimeType - MIME type of the file
 * @returns Lucide icon component
 */
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return ImageIcon;
  }

  if (mimeType.startsWith('text/') || mimeType.includes('document')) {
    return FileText;
  }

  return File;
}

/**
 * Check if a file is an image based on MIME type
 * @param mimeType - MIME type of the file
 * @returns true if the file is an image
 */
function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * ImageLightbox component for viewing images in a modal
 */
interface ImageLightboxProps {
  attachment: Attachment;
  open: boolean;
  onClose: () => void;
}

function ImageLightbox({ attachment, open, onClose }: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {attachment.originalName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(attachment.size)}
          </p>
        </DialogHeader>
        <div className="relative w-full p-6 pt-4">
          <img
            src={attachment.url}
            alt={attachment.originalName}
            className="w-full h-auto max-h-[70vh] object-contain rounded-md"
          />
        </div>
        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.open(attachment.url, '_blank');
            }}
            aria-label={`Download ${attachment.originalName}`}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * AttachmentItem component for displaying a single attachment
 */
interface AttachmentItemProps {
  attachment: Attachment;
  onPreview: (attachment: Attachment) => void;
}

function AttachmentItem({ attachment, onPreview }: AttachmentItemProps) {
  const Icon = getFileIcon(attachment.mimeType);
  const isImg = isImage(attachment.mimeType);

  const handleClick = () => {
    if (isImg) {
      onPreview(attachment);
    } else {
      // Trigger download for non-image files
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${isImg ? 'Preview' : 'Download'} ${attachment.originalName}`}
    >
      <CardContent className="p-4">
        {isImg ? (
          <div className="space-y-3">
            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium truncate" title={attachment.originalName}>
                {attachment.originalName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium truncate" title={attachment.originalName}>
                {attachment.originalName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * AttachmentList component for displaying a list of attachments
 *
 * Features:
 * - Displays attachments in a responsive grid layout
 * - Image files show thumbnail with preview on click
 * - Document files show file icon with download on click
 * - File count badge
 * - Accessible keyboard navigation
 * - Lightbox modal for image preview
 *
 * @example
 * ```tsx
 * <AttachmentList
 *   attachments={[
 *     {
 *       id: 'att_01HX5J3K4M',
 *       originalName: 'screenshot.png',
 *       storedName: 'fb_01HX5J3K4M_screenshot.png',
 *       url: '/uploads/fb_01HX5J3K4M_screenshot.png',
 *       size: 2457600,
 *       mimeType: 'image/png',
 *       uploadedAt: '2025-01-15T10:30:00Z'
 *     }
 *   ]}
 * />
 * ```
 */
export function AttachmentList({ attachments, onPreview, className }: AttachmentListProps) {
  const [lightboxAttachment, setLightboxAttachment] = useState<Attachment | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handlePreview = (attachment: Attachment) => {
    setLightboxAttachment(attachment);
    onPreview?.(attachment);
  };

  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* Attachment count badge */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
          </Badge>
        </div>

        {/* Attachment grid */}
        <div
          className={cn(
            'grid gap-4',
            'grid-cols-1',
            'sm:grid-cols-2',
            'lg:grid-cols-3'
          )}
          role="list"
          aria-label="Attachments"
        >
          {attachments.map((attachment) => (
            <div key={attachment.id} role="listitem">
              <AttachmentItem
                attachment={attachment}
                onPreview={handlePreview}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Image lightbox modal */}
      {lightboxAttachment && (
        <ImageLightbox
          attachment={lightboxAttachment}
          open={!!lightboxAttachment}
          onClose={() => setLightboxAttachment(null)}
        />
      )}
    </>
  );
}
