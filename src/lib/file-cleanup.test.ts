/**
 * Tests for file-cleanup.ts
 *
 * Test suite for orphaned file cleanup utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  cleanupOrphanedFiles,
  formatBytes,
  CleanupConfig,
  CleanupResult,
} from './file-cleanup';
import { TEMP_UPLOAD_PATH } from './file-upload';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    unlink: vi.fn(),
  },
}));

describe('file-cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanupOrphanedFiles', () => {
    it('should return empty result when temp directory does not exist', async () => {
      // Mock directory not existing
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      const result = await cleanupOrphanedFiles();

      expect(result.success).toBe(true);
      expect(result.filesScanned).toBe(0);
      expect(result.filesDeleted).toBe(0);
      expect(result.totalBytesFreed).toBe(0);
    });

    it('should scan and delete old files', async () => {
      const now = Date.now();
      const oldFileTime = now - (25 * 60 * 60 * 1000); // 25 hours ago

      // Mock directory exists
      vi.mocked(fs.access).mockResolvedValue(undefined);

      // Mock readdir
      vi.mocked(fs.readdir).mockResolvedValue(['old-file.jpg', 'recent-file.png'] as any);

      // Mock stat for files
      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        const filename = path.basename(filePath);
        if (filename === 'old-file.jpg') {
          return {
            isFile: () => true,
            mtimeMs: oldFileTime,
            size: 1024 * 500, // 500KB
          } as any;
        } else {
          return {
            isFile: () => true,
            mtimeMs: now - (1 * 60 * 60 * 1000), // 1 hour ago
            size: 1024 * 300, // 300KB
          } as any;
        }
      });

      // Mock unlink
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const result = await cleanupOrphanedFiles({ maxAgeHours: 24 });

      expect(result.success).toBe(true);
      expect(result.filesScanned).toBe(2);
      expect(result.filesDeleted).toBe(1);
      expect(result.totalBytesFreed).toBe(1024 * 500);
      expect(result.deletedFiles).toEqual(['old-file.jpg']);
    });

    it('should handle dry run mode', async () => {
      const now = Date.now();
      const oldFileTime = now - (25 * 60 * 60 * 1000); // 25 hours ago

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue(['old-file.jpg'] as any);
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        mtimeMs: oldFileTime,
        size: 1024 * 500,
      } as any);

      const result = await cleanupOrphanedFiles({
        maxAgeHours: 24,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.filesDeleted).toBe(1);
      expect(result.deletedFiles).toEqual(['old-file.jpg']);
      expect(fs.unlink).not.toHaveBeenCalled(); // Should not delete in dry run
    });

    it('should continue on file deletion errors', async () => {
      const now = Date.now();
      const oldFileTime = now - (25 * 60 * 60 * 1000);

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue(['file1.jpg', 'file2.png'] as any);
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        mtimeMs: oldFileTime,
        size: 1024,
      } as any);

      // Mock first delete succeeds, second fails
      vi.mocked(fs.unlink)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Permission denied'));

      const result = await cleanupOrphanedFiles({ maxAgeHours: 24 });

      expect(result.success).toBe(false); // Has errors
      expect(result.filesScanned).toBe(2);
      expect(result.filesDeleted).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('file2.png');
    });

    it('should skip non-file entries', async () => {
      const now = Date.now();

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue(['file.jpg', 'subdir'] as any);
      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        const filename = path.basename(filePath);
        if (filename === 'subdir') {
          return {
            isFile: () => false, // Directory
            mtimeMs: now,
            size: 0,
          } as any;
        } else {
          return {
            isFile: () => true,
            mtimeMs: now - (25 * 60 * 60 * 1000),
            size: 1024,
          } as any;
        }
      });

      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const result = await cleanupOrphanedFiles({ maxAgeHours: 24 });

      expect(result.filesScanned).toBe(2);
      expect(result.filesDeleted).toBe(1);
      expect(result.deletedFiles).toEqual(['file.jpg']);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1023)).toBe('1023 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });
  });
});
