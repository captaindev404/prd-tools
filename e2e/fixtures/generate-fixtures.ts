/**
 * Generate Test Fixtures for File Upload E2E Tests
 *
 * This script generates test files for validating file upload functionality.
 * Run with: npx tsx e2e/fixtures/generate-fixtures.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = __dirname;

/**
 * Create a valid PNG image (1x1 red pixel)
 */
function createValidPNG(): Buffer {
  // PNG signature + IHDR chunk + IDAT chunk + IEND chunk
  const pngData = Buffer.from([
    // PNG signature
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    // IHDR chunk (1x1 image, 8-bit RGB)
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde,
    // IDAT chunk (red pixel)
    0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54,
    0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00,
    0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4,
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82,
  ]);
  return pngData;
}

/**
 * Create a valid JPEG image (smallest possible JPEG)
 */
function createValidJPEG(): Buffer {
  // Minimal JPEG (1x1 white pixel)
  const jpegData = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03,
    0x03, 0x03, 0x03, 0x04, 0x03, 0x03, 0x04, 0x05,
    0x08, 0x05, 0x05, 0x04, 0x04, 0x05, 0x0a, 0x07,
    0x07, 0x06, 0x08, 0x0c, 0x0a, 0x0c, 0x0c, 0x0b,
    0x0a, 0x0b, 0x0b, 0x0d, 0x0e, 0x12, 0x10, 0x0d,
    0x0e, 0x11, 0x0e, 0x0b, 0x0b, 0x10, 0x16, 0x10,
    0x11, 0x13, 0x14, 0x15, 0x15, 0x15, 0x0c, 0x0f,
    0x17, 0x18, 0x16, 0x14, 0x18, 0x12, 0x14, 0x15,
    0x14, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
    0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xff, 0xc4, 0x00, 0x14,
    0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3f, 0x00, 0x7f, 0xff, 0xd9,
  ]);
  return jpegData;
}

/**
 * Create a valid PDF document
 */
function createValidPDF(): Buffer {
  // Minimal PDF (empty document)
  const pdfData = Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
305
%%EOF`
  );
  return pdfData;
}

/**
 * Create a large image file (> 10MB for size validation)
 */
function createLargeImage(): Buffer {
  const pngHeader = createValidPNG();
  // Create a 12MB file by repeating data
  const largeSize = 12 * 1024 * 1024;
  const buffer = Buffer.alloc(largeSize);

  // Copy PNG header
  pngHeader.copy(buffer, 0);

  // Fill rest with zeros
  buffer.fill(0, pngHeader.length);

  return buffer;
}

/**
 * Create a file with mismatched extension (.jpg but actually a PNG)
 */
function createSpoofedFile(): Buffer {
  // Return PNG data (will be saved as .jpg.exe)
  return createValidPNG();
}

/**
 * Create an executable file (security test)
 */
function createExecutableFile(): Buffer {
  return Buffer.from('MZ\x90\x00'); // DOS executable header
}

/**
 * Main function to generate all fixtures
 */
function generateFixtures() {
  console.log('Generating test fixtures...\n');

  const fixtures = [
    {
      name: 'test-image.png',
      data: createValidPNG(),
      description: 'Valid 1x1 PNG image (< 1KB)',
    },
    {
      name: 'test-image.jpg',
      data: createValidJPEG(),
      description: 'Valid minimal JPEG image (< 1KB)',
    },
    {
      name: 'test-document.pdf',
      data: createValidPDF(),
      description: 'Valid minimal PDF document (< 1KB)',
    },
    {
      name: 'test-large-image.jpg',
      data: createLargeImage(),
      description: 'Oversized JPEG (> 10MB) for size validation',
    },
    {
      name: 'test-spoofed.jpg.exe',
      data: createSpoofedFile(),
      description: 'Spoofed file with multiple extensions (security test)',
    },
    {
      name: 'test-invalid.exe',
      data: createExecutableFile(),
      description: 'Invalid executable file for type validation',
    },
  ];

  fixtures.forEach((fixture) => {
    const filepath = join(FIXTURES_DIR, fixture.name);
    writeFileSync(filepath, fixture.data);
    console.log(`✓ Created ${fixture.name}`);
    console.log(`  ${fixture.description}`);
    console.log(`  Size: ${(fixture.data.length / 1024).toFixed(2)} KB\n`);
  });

  console.log('All test fixtures generated successfully!');
  console.log(`Location: ${FIXTURES_DIR}\n`);
}

// Run the generator
generateFixtures();
