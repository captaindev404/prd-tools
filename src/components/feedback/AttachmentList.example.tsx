/**
 * AttachmentList Component - Usage Examples
 *
 * This file demonstrates various usage patterns for the AttachmentList component.
 */

import { AttachmentList, Attachment } from './AttachmentList';

// Example 1: Basic usage with mixed file types
export function BasicExample() {
  const attachments: Attachment[] = [
    {
      id: 'att_01HX5J3K4M',
      originalName: 'screenshot.png',
      storedName: 'fb_01HX5J3K4M_screenshot.png',
      url: '/uploads/fb_01HX5J3K4M_screenshot.png',
      size: 2457600, // 2.3 MB
      mimeType: 'image/png',
      uploadedAt: '2025-01-15T10:30:00Z',
    },
    {
      id: 'att_01HX5J3K5N',
      originalName: 'requirements.pdf',
      storedName: 'fb_01HX5J3K4M_requirements.pdf',
      url: '/uploads/fb_01HX5J3K4M_requirements.pdf',
      size: 1153433, // 1.1 MB
      mimeType: 'application/pdf',
      uploadedAt: '2025-01-15T10:31:00Z',
    },
    {
      id: 'att_01HX5J3K6P',
      originalName: 'mockup.jpg',
      storedName: 'fb_01HX5J3K4M_mockup.jpg',
      url: '/uploads/fb_01HX5J3K4M_mockup.jpg',
      size: 3221225, // 3.1 MB
      mimeType: 'image/jpeg',
      uploadedAt: '2025-01-15T10:32:00Z',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Feedback: Improve checkout flow</h2>
      <p className="text-muted-foreground mb-6">
        The current checkout process has too many steps and confuses users...
      </p>
      <AttachmentList attachments={attachments} />
    </div>
  );
}

// Example 2: Images only (screenshot gallery)
export function ImageGalleryExample() {
  const imageAttachments: Attachment[] = [
    {
      id: 'att_01HX5J3K7Q',
      originalName: 'step-1.png',
      storedName: 'fb_01HX5J3K4M_step-1.png',
      url: '/uploads/fb_01HX5J3K4M_step-1.png',
      size: 1843200,
      mimeType: 'image/png',
      uploadedAt: '2025-01-15T10:30:00Z',
    },
    {
      id: 'att_01HX5J3K8R',
      originalName: 'step-2.png',
      storedName: 'fb_01HX5J3K4M_step-2.png',
      url: '/uploads/fb_01HX5J3K4M_step-2.png',
      size: 1920000,
      mimeType: 'image/png',
      uploadedAt: '2025-01-15T10:31:00Z',
    },
    {
      id: 'att_01HX5J3K9S',
      originalName: 'step-3.png',
      storedName: 'fb_01HX5J3K4M_step-3.png',
      url: '/uploads/fb_01HX5J3K4M_step-3.png',
      size: 2048000,
      mimeType: 'image/png',
      uploadedAt: '2025-01-15T10:32:00Z',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">UI Bug Report</h2>
      <p className="text-muted-foreground mb-6">
        Screenshots showing the button misalignment issue...
      </p>
      <AttachmentList attachments={imageAttachments} />
    </div>
  );
}

// Example 3: Documents only
export function DocumentListExample() {
  const documentAttachments: Attachment[] = [
    {
      id: 'att_01HX5J3KAT',
      originalName: 'user-research-findings.pdf',
      storedName: 'fb_01HX5J3K4M_research.pdf',
      url: '/uploads/fb_01HX5J3K4M_research.pdf',
      size: 5242880, // 5 MB
      mimeType: 'application/pdf',
      uploadedAt: '2025-01-15T10:30:00Z',
    },
    {
      id: 'att_01HX5J3KBU',
      originalName: 'interview-transcript.txt',
      storedName: 'fb_01HX5J3K4M_transcript.txt',
      url: '/uploads/fb_01HX5J3K4M_transcript.txt',
      size: 102400, // 100 KB
      mimeType: 'text/plain',
      uploadedAt: '2025-01-15T10:31:00Z',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Research Feedback</h2>
      <p className="text-muted-foreground mb-6">
        Based on user interviews conducted last week...
      </p>
      <AttachmentList attachments={documentAttachments} />
    </div>
  );
}

// Example 4: With custom preview handler
export function CustomPreviewExample() {
  const attachments: Attachment[] = [
    {
      id: 'att_01HX5J3KCV',
      originalName: 'error-screenshot.png',
      storedName: 'fb_01HX5J3K4M_error.png',
      url: '/uploads/fb_01HX5J3K4M_error.png',
      size: 1536000,
      mimeType: 'image/png',
      uploadedAt: '2025-01-15T10:30:00Z',
    },
  ];

  const handlePreview = (attachment: Attachment) => {
    console.log('Custom preview handler called:', attachment);
    // Could trigger analytics, custom modal, etc.
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Error Report</h2>
      <AttachmentList attachments={attachments} onPreview={handlePreview} />
    </div>
  );
}

// Example 5: Empty state (no attachments)
export function EmptyStateExample() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Feedback without attachments</h2>
      <p className="text-muted-foreground mb-6">
        This feedback has no attachments. The component won't render anything.
      </p>
      <AttachmentList attachments={[]} />
      <p className="text-sm text-muted-foreground mt-4">
        (Nothing rendered above - component returns null for empty arrays)
      </p>
    </div>
  );
}

// Example 6: Single attachment
export function SingleAttachmentExample() {
  const attachments: Attachment[] = [
    {
      id: 'att_01HX5J3KDW',
      originalName: 'diagram.png',
      storedName: 'fb_01HX5J3K4M_diagram.png',
      url: '/uploads/fb_01HX5J3K4M_diagram.png',
      size: 2097152, // 2 MB
      mimeType: 'image/png',
      uploadedAt: '2025-01-15T10:30:00Z',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Feature Request</h2>
      <p className="text-muted-foreground mb-6">
        Here's a diagram showing the proposed workflow...
      </p>
      <AttachmentList attachments={attachments} />
    </div>
  );
}

// Example 7: Integration in feedback detail page
export function FeedbackDetailPageExample() {
  const feedback = {
    id: 'fb_01HX5J3K4M',
    title: 'Add dark mode to mobile app',
    body: 'Many users have requested a dark mode option for better visibility at night...',
    author: { displayName: 'Marie Dubois' },
    createdAt: '2025-01-15T10:30:00Z',
    state: 'new',
    voteCount: 24,
  };

  const attachments: Attachment[] = [
    {
      id: 'att_01HX5J3KEX',
      originalName: 'dark-mode-mockup.png',
      storedName: 'fb_01HX5J3K4M_mockup.png',
      url: '/uploads/fb_01HX5J3K4M_mockup.png',
      size: 2621440,
      mimeType: 'image/png',
      uploadedAt: '2025-01-15T10:30:00Z',
    },
    {
      id: 'att_01HX5J3KFY',
      originalName: 'color-palette.pdf',
      storedName: 'fb_01HX5J3K4M_palette.pdf',
      url: '/uploads/fb_01HX5J3K4M_palette.pdf',
      size: 524288,
      mimeType: 'application/pdf',
      uploadedAt: '2025-01-15T10:31:00Z',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Feedback header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{feedback.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>by {feedback.author.displayName}</span>
          <span>•</span>
          <span>24 votes</span>
        </div>
      </div>

      {/* Feedback body */}
      <div className="prose prose-slate max-w-none">
        <p>{feedback.body}</p>
      </div>

      {/* Attachments section */}
      <div className="border-t pt-6">
        <AttachmentList attachments={attachments} />
      </div>

      {/* Comments section would go here */}
    </div>
  );
}
