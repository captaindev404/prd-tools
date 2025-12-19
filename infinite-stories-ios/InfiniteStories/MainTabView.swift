//
//  MainTabView.swift
//  InfiniteStories
//
//  Root TabView container with 4 tabs leveraging iOS 26 Liquid Glass tab bars.
//

import SwiftUI

/// Tab identifiers for the app's main navigation
enum AppTab: Int, CaseIterable, Identifiable {
    case home = 0
    case library = 1
    case journey = 2
    case settings = 3

    var id: Int { rawValue }

    var title: String {
        switch self {
        case .home: return "Home"
        case .library: return "Library"
        case .journey: return "Journey"
        case .settings: return "Settings"
        }
    }

    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .library: return "books.vertical.fill"
        case .journey: return "chart.line.uptrend.xyaxis"
        case .settings: return "gearshape.fill"
        }
    }
}

// MARK: - Main Tab View

struct MainTabView: View {
    @State private var selectedTab: AppTab = .home
    @Namespace private var tabNamespace
    @EnvironmentObject private var themeSettings: ThemeSettings
    @EnvironmentObject private var authState: AuthStateManager

    var body: some View {
        TabView(selection: $selectedTab) {
            // Home Tab
            HomeTabView()
                .tabItem {
                    Label(AppTab.home.title, systemImage: AppTab.home.icon)
                        .accessibilityLabel("\(AppTab.home.title) tab")
                }
                .tag(AppTab.home)

            // Library Tab
            LibraryTabView()
                .tabItem {
                    Label(AppTab.library.title, systemImage: AppTab.library.icon)
                        .accessibilityLabel("\(AppTab.library.title) tab")
                }
                .tag(AppTab.library)

            // Journey Tab
            JourneyTabView()
                .tabItem {
                    Label(AppTab.journey.title, systemImage: AppTab.journey.icon)
                        .accessibilityLabel("\(AppTab.journey.title) tab")
                }
                .tag(AppTab.journey)

            // Settings Tab
            SettingsTabView()
                .tabItem {
                    Label(AppTab.settings.title, systemImage: AppTab.settings.icon)
                        .accessibilityLabel("\(AppTab.settings.title) tab")
                }
                .tag(AppTab.settings)
        }
        .glassTabBar()
        .glassTabMorphing(namespace: tabNamespace, selectedTab: selectedTab)
        .tint(.accentColor)
    }
}

// MARK: - Home Tab View

/// Wrapper for the Home tab content with its own NavigationStack
struct HomeTabView: View {
    var body: some View {
        NavigationStack {
            HomeContentView()
        }
    }
}

// MARK: - Library Tab View

/// Wrapper for the Library tab content with its own NavigationStack
struct LibraryTabView: View {
    var body: some View {
        NavigationStack {
            ImprovedStoryLibraryView()
                .glassNavigation()
        }
    }
}

// MARK: - Journey Tab View

/// Wrapper for the Journey tab content with its own NavigationStack
struct JourneyTabView: View {
    var body: some View {
        ReadingJourneyTabContent()
    }
}

// MARK: - Settings Tab View

/// Wrapper for the Settings tab content with its own NavigationStack
struct SettingsTabView: View {
    @EnvironmentObject private var themeSettings: ThemeSettings
    @EnvironmentObject private var authState: AuthStateManager

    var body: some View {
        SettingsTabContent()
            .environmentObject(themeSettings)
            .environmentObject(authState)
    }
}

// MARK: - Preview

#Preview {
    MainTabView()
        .environmentObject(ThemeSettings.shared)
        .environmentObject(AuthStateManager())
}
