//
//  InfiniteStoriesApp.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import SwiftUI
import SwiftData

@main
struct InfiniteStoriesApp: App {
    @StateObject private var themeSettings = ThemeSettings.shared
    
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            Hero.self,
            Story.self,
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            print("❌ Failed to create ModelContainer: \(error)")
            
            // Clean up and try with fresh database
            print("⚠️ Cleaning up corrupted database...")
            let fileManager = FileManager.default
            let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
            
            // Remove SwiftData files
            let storeURL = documentsPath.appendingPathComponent("default.store")
            try? fileManager.removeItem(at: storeURL)
            
            let shmURL = documentsPath.appendingPathComponent("default.store-shm")
            try? fileManager.removeItem(at: shmURL)
            
            let walURL = documentsPath.appendingPathComponent("default.store-wal")
            try? fileManager.removeItem(at: walURL)
            
            print("✅ Database cleaned. Creating fresh container...")
            
            // Try again with fresh database
            do {
                return try ModelContainer(for: schema, configurations: [modelConfiguration])
            } catch {
                fatalError("Could not create ModelContainer even after cleanup: \(error)")
            }
        }
    }()

    var body: some Scene {
        WindowGroup {
            // Easy switching between original and improved UI
            Group {
                if AppConfiguration.useImprovedUI {
                    ImprovedContentView()
                } else {
                    ContentView()
                }
            }
            .preferredColorScheme(themeSettings.themePreference.colorScheme)
            .environmentObject(themeSettings)
        }
        .modelContainer(sharedModelContainer)
    }
}
