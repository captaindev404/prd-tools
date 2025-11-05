//
//  DataMigrationHelper.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import Foundation
import SwiftData

struct DataMigrationHelper {
    
    /// Clears the SwiftData store - use with caution as this will delete all data
    static func clearDataStore() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let storePath = documentsPath.appendingPathComponent("default.store")
        let shmPath = documentsPath.appendingPathComponent("default.store-shm")
        let walPath = documentsPath.appendingPathComponent("default.store-wal")
        
        do {
            try? FileManager.default.removeItem(at: storePath)
            try? FileManager.default.removeItem(at: shmPath)
            try? FileManager.default.removeItem(at: walPath)
            print("✅ SwiftData store cleared successfully")
        } catch {
            print("❌ Failed to clear SwiftData store: \(error)")
        }
    }
    
    /// Creates a backup of the current data store
    static func backupDataStore() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let storePath = documentsPath.appendingPathComponent("default.store")
        let backupPath = documentsPath.appendingPathComponent("default.store.backup")
        
        do {
            if FileManager.default.fileExists(atPath: storePath.path) {
                try? FileManager.default.removeItem(at: backupPath) // Remove old backup
                try FileManager.default.copyItem(at: storePath, to: backupPath)
                print("✅ Data store backed up successfully")
            }
        } catch {
            print("❌ Failed to backup data store: \(error)")
        }
    }
    
    /// Attempts to fix migration issues by updating existing records
    static func fixMigrationIssues(context: ModelContext) {
        do {
            // Fix Story records
            let storyDescriptor = FetchDescriptor<Story>()
            let stories = try context.fetch(storyDescriptor)
            
            for story in stories {
                // Ensure lastModified is set
                if story.lastModified < story.createdAt {
                    story.lastModified = story.createdAt
                }
                // audioNeedsRegeneration will use its default value
            }
            
            try context.save()
            print("✅ Migration fixes applied successfully")
            
        } catch {
            print("❌ Failed to apply migration fixes: \(error)")
        }
    }
    
    /// Check if we need to perform migration
    static func needsMigration() -> Bool {
        // Check if the app was previously installed by looking for the data store
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let storePath = documentsPath.appendingPathComponent("default.store")
        
        // If store exists but doesn't have our migration marker, we need migration
        let migrationMarkerPath = documentsPath.appendingPathComponent(".migration_v2_complete")
        
        return FileManager.default.fileExists(atPath: storePath.path) && 
               !FileManager.default.fileExists(atPath: migrationMarkerPath.path)
    }
    
    /// Mark migration as complete
    static func markMigrationComplete() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let migrationMarkerPath = documentsPath.appendingPathComponent(".migration_v2_complete")

        FileManager.default.createFile(atPath: migrationMarkerPath.path, contents: nil, attributes: nil)
        print("✅ Migration marked as complete")
    }

    /// Fix illustration paths that contain duplicate directory paths
    static func fixIllustrationPaths(context: ModelContext) {
        do {
            let illustrationDescriptor = FetchDescriptor<StoryIllustration>()
            let illustrations = try context.fetch(illustrationDescriptor)

            var fixedCount = 0
            for illustration in illustrations {
                guard let imagePath = illustration.imagePath else { continue }

                // Check if path contains duplicate "StoryIllustrations"
                if imagePath.contains("StoryIllustrations") {
                    // Extract just the filename (the last component)
                    let components = imagePath.components(separatedBy: "/")
                    if let filename = components.last, filename.hasPrefix("illustration_") {
                        print("🔧 Fixing path: \(imagePath)")
                        print("   → Filename: \(filename)")
                        illustration.imagePath = filename
                        fixedCount += 1
                    }
                }
            }

            if fixedCount > 0 {
                try context.save()
                print("✅ Fixed \(fixedCount) illustration paths")
            } else {
                print("ℹ️ No illustration paths needed fixing")
            }

        } catch {
            print("❌ Failed to fix illustration paths: \(error)")
        }
    }
}