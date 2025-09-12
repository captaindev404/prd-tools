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
            fatalError("Could not create ModelContainer: \(error)")
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
