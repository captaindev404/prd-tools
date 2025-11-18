//
//  FeatureFlags.swift
//  InfiniteStories
//
//  Feature flags for gradual rollout of backend API integration
//

import Foundation
import SwiftUI

/// Feature flags for controlling new functionality rollout
enum FeatureFlags {
    /// Use backend API for all operations (vs direct OpenAI)
    /// - Always enabled in Phase 5+
    /// - Backend API is now the only supported mode
    static var useBackendAPI: Bool {
        return true // Always enabled - backend API is required
    }

    /// Enable cloud sync with backend
    /// - Always enabled in production
    /// - Configurable in DEBUG for testing
    static var enableCloudSync: Bool {
        #if DEBUG
        return UserDefaults.standard.object(forKey: "enableCloudSync") as? Bool ?? true
        #else
        return true // Always enabled in production
        #endif
    }

    /// Enable automatic background sync
    /// - Always enabled in production
    /// - Configurable in DEBUG for testing
    static var enableBackgroundSync: Bool {
        #if DEBUG
        return UserDefaults.standard.object(forKey: "enableBackgroundSync") as? Bool ?? true
        #else
        return true // Always enabled in production
        #endif
    }

    /// Sync interval in seconds (default: 15 minutes)
    static var syncInterval: TimeInterval {
        let stored = UserDefaults.standard.double(forKey: "syncInterval")
        return stored > 0 ? stored : 900 // Default: 15 minutes
    }

    /// Allow illustration generation failures without blocking story
    static var allowIllustrationFailures: Bool {
        return UserDefaults.standard.object(forKey: "allowIllustrationFailures") as? Bool ?? true
    }

    /// Show detailed sync status in UI
    static var showSyncStatus: Bool {
        return UserDefaults.standard.object(forKey: "showSyncStatus") as? Bool ?? true
    }

    /// Enable detailed logging for debugging
    static var enableDetailedLogging: Bool {
        #if DEBUG
        return UserDefaults.standard.object(forKey: "enableDetailedLogging") as? Bool ?? true
        #else
        return UserDefaults.standard.object(forKey: "enableDetailedLogging") as? Bool ?? false
        #endif
    }

    // MARK: - Setters (for configuration)

    static func setUseBackendAPI(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: "useBackendAPI")
        Logger.api.info("🏁 useBackendAPI set to: \(enabled)")
    }

    static func setEnableCloudSync(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: "enableCloudSync")
        Logger.sync.info("🏁 enableCloudSync set to: \(enabled)")
    }

    static func setEnableBackgroundSync(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: "enableBackgroundSync")
        Logger.sync.info("🏁 enableBackgroundSync set to: \(enabled)")
    }

    static func setSyncInterval(_ seconds: TimeInterval) {
        UserDefaults.standard.set(seconds, forKey: "syncInterval")
        Logger.sync.info("🏁 syncInterval set to: \(seconds)s")
    }
}

// MARK: - Debug Settings View

#if DEBUG
struct DeveloperSettingsView: View {
    @AppStorage("enableCloudSync") private var enableCloudSync = false
    @AppStorage("enableBackgroundSync") private var enableBackgroundSync = false
    @AppStorage("syncInterval") private var syncInterval = 900.0
    @AppStorage("enableDetailedLogging") private var enableDetailedLogging = true
    @AppStorage("showSyncStatus") private var showSyncStatus = true

    var body: some View {
        Form {
            Section {
                Text("Feature Flags")
                    .font(.headline)
                Text("DEBUG ONLY - These settings control backend integration features")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Section("Backend Integration") {
                HStack {
                    Text("Backend API")
                    Spacer()
                    Text("Always Enabled")
                        .font(.caption)
                        .foregroundColor(.green)
                }

                Text("All AI operations route through backend API. Direct OpenAI integration has been removed.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Section("Cloud Sync") {
                Toggle("Enable Cloud Sync", isOn: $enableCloudSync)
                    .onChange(of: enableCloudSync) { oldValue, newValue in
                        Logger.sync.info("enableCloudSync changed to: \(newValue)")
                    }

                Toggle("Enable Background Sync", isOn: $enableBackgroundSync)
                    .disabled(!enableCloudSync)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Sync Interval: \(formatInterval(syncInterval))")
                    Slider(value: $syncInterval, in: 60...3600, step: 60)
                }
                .disabled(!enableCloudSync || !enableBackgroundSync)
            }

            Section("Debugging") {
                Toggle("Detailed Logging", isOn: $enableDetailedLogging)
                Toggle("Show Sync Status", isOn: $showSyncStatus)
            }

            Section {
                Button("Reset to Defaults") {
                    enableCloudSync = false
                    enableBackgroundSync = false
                    syncInterval = 900
                    enableDetailedLogging = true
                    showSyncStatus = true
                }
                .foregroundColor(.red)
            }

            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("⚠️ Warning")
                        .font(.headline)
                        .foregroundColor(.orange)

                    Text("These settings are for development only and will not appear in production builds.")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("Changes take effect immediately and may affect app behavior.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Developer Settings")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func formatInterval(_ seconds: TimeInterval) -> String {
        let minutes = Int(seconds / 60)
        if minutes < 60 {
            return "\(minutes) minutes"
        } else {
            let hours = minutes / 60
            let remainingMinutes = minutes % 60
            if remainingMinutes == 0 {
                return "\(hours) hour\(hours > 1 ? "s" : "")"
            } else {
                return "\(hours)h \(remainingMinutes)m"
            }
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        DeveloperSettingsView()
    }
}
#endif

// MARK: - Production Configuration

extension FeatureFlags {
    /// Configure flags for production deployment
    /// Call this during app initialization
    static func configureForProduction() {
        #if !DEBUG
        // Production defaults
        setUseBackendAPI(true)
        setEnableCloudSync(true)
        setEnableBackgroundSync(true)
        setSyncInterval(900) // 15 minutes
        #endif
    }

    /// Configure flags for development/testing
    static func configureForDevelopment() {
        #if DEBUG
        // Development defaults (conservative)
        setUseBackendAPI(false)
        setEnableCloudSync(false)
        setEnableBackgroundSync(false)
        setSyncInterval(300) // 5 minutes for faster testing
        #endif
    }
}
