/**
 * FileUpload Component - Usage Examples
 *
 * This file demonstrates various use cases and configurations for the FileUpload component.
 * You can copy these examples directly into your forms or feedback components.
 */

'use client';

import * as React from 'react';
import { FileUpload, UploadedFile } from './FileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Example 1: Basic Usage
 * Simple file upload with default settings
 */
export function BasicFileUploadExample() {
  const handleFileChange = (files: UploadedFile[]) => {
    console.log('Uploaded files:', files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic File Upload</CardTitle>
        <CardDescription>
          Default configuration: max 5 files, 10MB per file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload onChange={handleFileChange} />
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: Custom Limits
 * Restrict to 3 files and 5MB per file
 */
export function CustomLimitsExample() {
  const handleFileChange = (files: UploadedFile[]) => {
    console.log('Uploaded files:', files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom File Limits</CardTitle>
        <CardDescription>
          Maximum 3 files, 5MB per file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload
          onChange={handleFileChange}
          maxFiles={3}
          maxSize={5 * 1024 * 1024} // 5MB
        />
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: Images Only
 * Restrict to image files only
 */
export function ImagesOnlyExample() {
  const handleFileChange = (files: UploadedFile[]) => {
    console.log('Uploaded images:', files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images Only</CardTitle>
        <CardDescription>
          Only image files are allowed (jpg, png, gif, webp)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload
          onChange={handleFileChange}
          allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Documents Only
 * Restrict to PDF and Office documents
 */
export function DocumentsOnlyExample() {
  const handleFileChange = (files: UploadedFile[]) => {
    console.log('Uploaded documents:', files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents Only</CardTitle>
        <CardDescription>
          PDF, Word, Excel, and text files only
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload
          onChange={handleFileChange}
          allowedTypes={[
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
          ]}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Example 5: Disabled State
 * Show upload component in disabled state
 */
export function DisabledExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Disabled Upload</CardTitle>
        <CardDescription>
          Upload component in disabled state
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload disabled />
      </CardContent>
    </Card>
  );
}

/**
 * Example 6: Integration with Form
 * Use FileUpload in a feedback form with React Hook Form
 */
export function FeedbackFormExample() {
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = {
      title: 'My Feedback',
      description: 'This is my feedback',
      attachments: uploadedFiles,
    };

    console.log('Submitting feedback with attachments:', formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Form with Attachments</CardTitle>
        <CardDescription>
          Complete form example with file upload
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Attachments (Optional)</label>
            <p className="mb-2 text-xs text-muted-foreground">
              Add screenshots or documents to support your feedback
            </p>
            <FileUpload
              onChange={setUploadedFiles}
              maxFiles={3}
              allowedTypes={[
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
              ]}
            />
          </div>

          <Button type="submit">Submit Feedback</Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Example 7: With Error Handling
 * Demonstrate error states and handling
 */
export function ErrorHandlingExample() {
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = (files: UploadedFile[]) => {
    setError(null);
    console.log('Files uploaded successfully:', files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Handling</CardTitle>
        <CardDescription>
          Try uploading files that exceed limits or wrong types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload
          onChange={handleFileChange}
          maxFiles={2}
          maxSize={2 * 1024 * 1024} // 2MB
          allowedTypes={['image/jpeg', 'image/png']}
        />
        {error && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Demo Page - Shows all examples
 */
export default function FileUploadDemo() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold">FileUpload Component</h1>
        <p className="mt-2 text-muted-foreground">
          Drag and drop file upload component with progress tracking, validation, and accessibility
        </p>
      </div>

      <BasicFileUploadExample />
      <CustomLimitsExample />
      <ImagesOnlyExample />
      <DocumentsOnlyExample />
      <DisabledExample />
      <FeedbackFormExample />
      <ErrorHandlingExample />
    </div>
  );
}
