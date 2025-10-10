/**
 * File Cleanup Utility
 *
 * Provides utilities for cleaning up orphaned temporary files
 * that were uploaded but never attached to feedback items.
 *
 * Features:
 * - Scans temporary upload directory
 * - Deletes files older than configurable threshold (default: 24 hours)
 * - Logs cleanup activity
 * - Safe error handling (continues on individual file errors)
 * - Can be run as cron job or via API endpoint
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { TEMP_UPLOAD_PATH } from './file-upload';

/**
 * Configuration for file cleanup
 */
export interface CleanupConfig {
  maxAgeHours?: number; // Default: 24 hours
  dryRun?: boolean; // If true, don't delete files, just report what would be deleted
  verbose?: boolean; // If true, log each file processed
}

/**
 * Result of cleanup operation
 */
export interface CleanupResult {
  success: boolean;
  filesScanned: number;
  filesDeleted: number;
  totalBytesFreed: number;
  errors: Array<{ file: string; error: string }>;
  deletedFiles: string[]; // List of deleted filenames
  duration: number; // Duration in milliseconds
}

/**
 * Clean up orphaned temporary files older than specified age
 *
 * @param config - Cleanup configuration
 * @returns Cleanup result with statistics
 *
 * @example
 * // Clean up files older than 1 hour
 * const result = await cleanupOrphanedFiles({ maxAgeHours: 1 });
 * console.log(`Deleted ${result.filesDeleted} files, freed ${result.totalBytesFreed} bytes`);
 *
 * @example
 * // Dry run - see what would be deleted without actually deleting
 * const result = await cleanupOrphanedFiles({ maxAgeHours: 24, dryRun: true });
 * console.log('Would delete:', result.deletedFiles);
 */
export async function cleanupOrphanedFiles(
  config: CleanupConfig = {}
): Promise<CleanupResult> {
  const startTime = Date.now();
  const { maxAgeHours = 24, dryRun = false, verbose = false } = config;

  const result: CleanupResult = {
    success: true,
    filesScanned: 0,
    filesDeleted: 0,
    totalBytesFreed: 0,
    errors: [],
    deletedFiles: [],
    duration: 0,
  };

  try {
    // Ensure temp directory exists
    try {
      await fs.access(TEMP_UPLOAD_PATH);
    } catch {
      // Temp directory doesn't exist - nothing to clean
      if (verbose) {
        console.log('Temp upload directory does not exist, nothing to clean');
      }
      result.duration = Date.now() - startTime;
      return result;
    }

    // Read all files in temp directory
    let files: string[];
    try {
      files = await fs.readdir(TEMP_UPLOAD_PATH);
    } catch (error) {
      result.success = false;
      result.errors.push({
        file: TEMP_UPLOAD_PATH,
        error: `Failed to read directory: ${error}`,
      });
      result.duration = Date.now() - startTime;
      return result;
    }

    if (verbose) {
      console.log(`Found ${files.length} files in temp directory`);
    }

    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    // Process each file
    for (const file of files) {
      result.filesScanned++;

      const filePath = path.join(TEMP_UPLOAD_PATH, file);

      try {
        // Get file stats
        const stats = await fs.stat(filePath);

        // Skip if not a file (e.g., directory)
        if (!stats.isFile()) {
          if (verbose) {
            console.log(`Skipping ${file} (not a file)`);
          }
          continue;
        }

        // Calculate file age
        const fileAge = now - stats.mtimeMs;

        if (verbose) {
          const ageHours = (fileAge / (60 * 60 * 1000)).toFixed(2);
          console.log(`File ${file}: age ${ageHours} hours, size ${stats.size} bytes`);
        }

        // Delete if older than threshold
        if (fileAge > maxAgeMs) {
          if (dryRun) {
            // Dry run - just log what would be deleted
            if (verbose) {
              console.log(`Would delete: ${file} (${stats.size} bytes)`);
            }
            result.filesDeleted++;
            result.totalBytesFreed += stats.size;
            result.deletedFiles.push(file);
          } else {
            // Actually delete the file
            try {
              await fs.unlink(filePath);
              result.filesDeleted++;
              result.totalBytesFreed += stats.size;
              result.deletedFiles.push(file);

              if (verbose) {
                console.log(`Deleted: ${file} (${stats.size} bytes)`);
              }
            } catch (deleteError) {
              // Log error but continue with other files
              const errorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError);
              result.errors.push({
                file,
                error: `Failed to delete: ${errorMsg}`,
              });

              if (verbose) {
                console.error(`Failed to delete ${file}:`, errorMsg);
              }
            }
          }
        }
      } catch (statError) {
        // Log error but continue with other files
        const errorMsg = statError instanceof Error ? statError.message : String(statError);
        result.errors.push({
          file,
          error: `Failed to stat file: ${errorMsg}`,
        });

        if (verbose) {
          console.error(`Failed to stat ${file}:`, errorMsg);
        }
      }
    }

    // Set success flag based on whether we had critical errors
    result.success = result.errors.length === 0;
  } catch (error) {
    // Unexpected error
    result.success = false;
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push({
      file: 'N/A',
      error: `Unexpected error: ${errorMsg}`,
    });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Log cleanup result in a human-readable format
 *
 * @param result - Cleanup result
 */
export function logCleanupResult(result: CleanupResult): void {
  console.log('\n===== File Cleanup Report =====');
  console.log(`Status: ${result.success ? 'SUCCESS' : 'COMPLETED WITH ERRORS'}`);
  console.log(`Files scanned: ${result.filesScanned}`);
  console.log(`Files deleted: ${result.filesDeleted}`);
  console.log(`Space freed: ${formatBytes(result.totalBytesFreed)}`);
  console.log(`Duration: ${result.duration}ms`);

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  if (result.deletedFiles.length > 0 && result.deletedFiles.length <= 10) {
    console.log('\nDeleted files:');
    result.deletedFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  }

  console.log('==============================\n');
}

/**
 * Schedule automatic cleanup to run periodically
 *
 * @param intervalHours - How often to run cleanup (default: 1 hour)
 * @param maxAgeHours - Maximum age of files to keep (default: 24 hours)
 * @returns Cleanup interval handle (can be used to clear interval)
 *
 * @example
 * // Run cleanup every hour for files older than 24 hours
 * const handle = scheduleCleanup();
 *
 * // Run cleanup every 30 minutes for files older than 1 hour
 * const handle = scheduleCleanup(0.5, 1);
 *
 * // Stop scheduled cleanup
 * clearInterval(handle);
 */
export function scheduleCleanup(
  intervalHours: number = 1,
  maxAgeHours: number = 24
): NodeJS.Timeout {
  const intervalMs = intervalHours * 60 * 60 * 1000;

  console.log(
    `Scheduling file cleanup: every ${intervalHours} hour(s), max age ${maxAgeHours} hour(s)`
  );

  // Run immediately on schedule
  cleanupOrphanedFiles({ maxAgeHours, verbose: false })
    .then(result => {
      if (result.filesDeleted > 0 || result.errors.length > 0) {
        logCleanupResult(result);
      }
    })
    .catch(error => {
      console.error('Scheduled cleanup failed:', error);
    });

  // Schedule recurring cleanup
  return setInterval(() => {
    cleanupOrphanedFiles({ maxAgeHours, verbose: false })
      .then(result => {
        // Only log if we actually deleted files or had errors
        if (result.filesDeleted > 0 || result.errors.length > 0) {
          logCleanupResult(result);
        }
      })
      .catch(error => {
        console.error('Scheduled cleanup failed:', error);
      });
  }, intervalMs);
}
