//
//  SettingsView.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import SwiftUI
import SwiftData

// MARK: - Settings Tab Content (for Tab Bar navigation)
/// This view is used within the Settings tab and removes redundant Done button
/// since navigation is now handled by the tab bar.
struct SettingsTabContent: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.modelContext) private var modelContext
    @State private var settings = AppSettings()
    @EnvironmentObject private var themeSettings: ThemeSettings
    @EnvironmentObject private var authState: AuthStateManager

    @State private var showingEraseConfirmation = false
    @State private var showingAuthView = false
    @State private var debugTestUserEmail = "test@example.com"
    @State private var debugTestUserPassword = "password123"

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Image(systemName: "gear.circle.fill")
                            .foregroundColor(.purple)
                            .font(.title2)

                        VStack(alignment: .leading) {
                            Text("InfiniteStories Settings")
                                .font(.headline)
                            Text("Configure AI story generation")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }

                // Theme Settings Section
                Section {
                    HStack {
                        Label("Appearance", systemImage: "moon.circle.fill")
                            .foregroundColor(.purple)

                        Spacer()

                        Picker("", selection: $themeSettings.themePreferenceString) {
                            ForEach(["system", "light", "dark"], id: \.self) { theme in
                                HStack {
                                    Image(systemName: settingsThemeIcon(for: theme))
                                    Text(theme.capitalized)
                                }
                                .tag(theme)
                            }
                        }
                        .pickerStyle(.menu)
                        .tint(.purple)
                    }

                    // Visual indicator showing current theme
                    HStack {
                        Text("Current Mode:")
                        Spacer()
                        Text(colorScheme == .dark ? "Dark" : "Light")
                            .foregroundColor(.secondary)
                    }
                } header: {
                    Text("Theme")
                } footer: {
                    Text("Choose your preferred appearance or let it follow your system settings.")
                        .font(.caption)
                }
                Section {
                    HStack {
                        Picker("Story Length", selection: $settings.defaultStoryLength) {
                            Text("5 minutes").tag(5)
                            Text("7 minutes").tag(7)
                            Text("10 minutes").tag(10)
                        }
                        .pickerStyle(.menu)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Picker("Voice", selection: $settings.preferredVoice) {
                                ForEach(AppSettings.availableVoices, id: \.id) { voice in
                                    Text(voice.name).tag(voice.id)
                                }
                            }
                            .pickerStyle(.menu)
                        }

                        if let selectedVoice = AppSettings.availableVoices.first(where: { $0.id == settings.preferredVoice }) {
                            Text(selectedVoice.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Picker("Language", selection: $settings.preferredLanguage) {
                                ForEach(AppSettings.availableLanguages, id: \.id) { language in
                                    HStack {
                                        Text(language.name)
                                        Text(language.nativeName)
                                            .foregroundColor(.secondary)
                                    }
                                    .tag(language.id)
                                }
                            }
                            .pickerStyle(.menu)
                        }

                        Text("Stories will be generated in the selected language")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } header: {
                    Text("Story Preferences")
                } footer: {
                    Text("Voice selection uses OpenAI's enhanced text-to-speech with storytelling instructions. Coral and Fable are recommended for bedtime stories.")
                        .font(.caption)
                }

                if AppConfiguration.enableStoryIllustrations {
                    Section {
                        Toggle("Auto-Generate Illustrations", isOn: Binding(
                            get: { UserDefaults.standard.bool(forKey: "autoGenerateIllustrations") },
                            set: { UserDefaults.standard.set($0, forKey: "autoGenerateIllustrations") }
                        ))

                        Toggle("Continue on Illustration Failures", isOn: Binding(
                            get: { UserDefaults.standard.bool(forKey: "allowIllustrationFailures") },
                            set: { UserDefaults.standard.set($0, forKey: "allowIllustrationFailures") }
                        ))

                        Toggle("Show Error Details", isOn: Binding(
                            get: { UserDefaults.standard.bool(forKey: "showIllustrationErrors") },
                            set: { UserDefaults.standard.set($0, forKey: "showIllustrationErrors") }
                        ))

                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Max Retry Attempts")
                                Spacer()
                                Picker("Retries", selection: Binding(
                                    get: {
                                        let value = UserDefaults.standard.integer(forKey: "maxIllustrationRetries")
                                        return value > 0 ? value : 3
                                    },
                                    set: { UserDefaults.standard.set($0, forKey: "maxIllustrationRetries") }
                                )) {
                                    Text("1").tag(1)
                                    Text("2").tag(2)
                                    Text("3").tag(3)
                                    Text("5").tag(5)
                                }
                                .pickerStyle(.menu)
                            }

                            Text("Number of automatic retry attempts for failed illustrations")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        HStack {
                            Text("Max Illustrations Per Story")
                            Spacer()
                            Picker("Max", selection: Binding(
                                get: {
                                    let value = UserDefaults.standard.integer(forKey: "maxIllustrationsPerStory")
                                    return value > 0 ? value : 6
                                },
                                set: { UserDefaults.standard.set($0, forKey: "maxIllustrationsPerStory") }
                            )) {
                                Text("5").tag(5)
                                Text("6").tag(6)
                                Text("7").tag(7)
                                Text("8").tag(8)
                            }
                            .pickerStyle(.menu)
                        }
                    } header: {
                        Text("Illustrations")
                    } footer: {
                        Text("Illustrations enhance stories with AI-generated visuals. If generation fails, placeholders will be shown. You can retry failed illustrations later.")
                            .font(.caption)
                    }
                }

                #if DEBUG
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Auth Status: \(authState.isAuthenticated ? "✓ Signed In" : "✗ Not Signed In")")
                            .font(.caption)
                            .foregroundColor(authState.isAuthenticated ? .green : .orange)

                        if let userId = authState.userId {
                            Text("User ID: \(userId)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)

                    Button(action: {
                        print("Debug sign-in not implemented - use auth flow instead")
                    }) {
                        HStack {
                            Image(systemName: "person.circle.fill")
                            Text("Sign In as Test User")
                        }
                        .foregroundColor(.blue)
                    }
                    .disabled(authState.isAuthenticated)

                    Button(action: {
                        print("Debug sign-up not implemented - use auth flow instead")
                    }) {
                        HStack {
                            Image(systemName: "person.badge.plus.fill")
                            Text("Create Random Test User")
                        }
                        .foregroundColor(.purple)
                    }

                    if authState.isAuthenticated {
                        Button(action: {
                            authState.signOut()
                        }) {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Sign Out")
                            }
                            .foregroundColor(.orange)
                        }
                    }
                } header: {
                    Text("Debug Controls")
                } footer: {
                    Text("Debug-only controls for testing authentication. Test user: \(debugTestUserEmail)")
                        .font(.caption)
                }
                #endif

                Section {
                    Button(action: { showingEraseConfirmation = true }) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                            Text("Erase All Data & Sign Out")
                        }
                        .foregroundColor(.red)
                    }
                } header: {
                    Text("Advanced")
                } footer: {
                    Text("Erasing all data will permanently delete all heroes, stories, files, and sign you out. You will be redirected to the sign-up screen.")
                        .font(.caption)
                }

                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("About InfiniteStories")
                            .font(.headline)

                        Text("Generate personalized bedtime stories for children using AI. Create heroes with unique traits and enjoy magical adventures every night.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        HStack {
                            Text("Version")
                            Spacer()
                            Text("1.0.0")
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                } header: {
                    Text("App Info")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .glassNavigation()
            .confirmationDialog("Erase All Data?", isPresented: $showingEraseConfirmation, titleVisibility: .visible) {
                Button("Erase Everything & Sign Out", role: .destructive) {
                    settingsEraseAllData()
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("This will permanently delete all heroes, stories, media files, clear your session, and redirect you to sign-up. This action cannot be undone.")
            }
        }
    }

    private func settingsEraseAllData() {
        do {
            // 1. Delete all SwiftData models
            try modelContext.delete(model: Hero.self)
            try modelContext.delete(model: Story.self)
            try modelContext.delete(model: StoryIllustration.self)
            try modelContext.delete(model: CustomStoryEvent.self)

            // Save the deletion
            try modelContext.save()

            // 2. Delete all file directories
            let fileManager = FileManager.default
            if let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first {
                // Delete AudioStories directory
                let audioPath = documentsPath.appendingPathComponent("AudioStories")
                if fileManager.fileExists(atPath: audioPath.path) {
                    try? fileManager.removeItem(at: audioPath)
                }

                // Delete Avatars directory
                let avatarsPath = documentsPath.appendingPathComponent("Avatars")
                if fileManager.fileExists(atPath: avatarsPath.path) {
                    try? fileManager.removeItem(at: avatarsPath)
                }

                // Delete StoryIllustrations directory
                let illustrationsPath = documentsPath.appendingPathComponent("StoryIllustrations")
                if fileManager.fileExists(atPath: illustrationsPath.path) {
                    try? fileManager.removeItem(at: illustrationsPath)
                }

                // Clean up any loose MP3 files in root documents
                let contents = try fileManager.contentsOfDirectory(at: documentsPath, includingPropertiesForKeys: nil)
                for file in contents {
                    if file.pathExtension == "mp3" {
                        try? fileManager.removeItem(at: file)
                    }
                }
            }

            // 3. Clear all Keychain data (auth tokens, session data)
            let keychainHelper = KeychainHelper()
            keychainHelper.clearAll()

            // 4. Reset UserDefaults to default values
            UserDefaults.standard.removeObject(forKey: "autoGenerateIllustrations")
            UserDefaults.standard.removeObject(forKey: "allowIllustrationFailures")
            UserDefaults.standard.removeObject(forKey: "showIllustrationErrors")
            UserDefaults.standard.removeObject(forKey: "maxIllustrationRetries")
            UserDefaults.standard.removeObject(forKey: "maxIllustrationsPerStory")

            // 5. Reset theme to system default
            themeSettings.themePreferenceString = "system"

            // 6. Sign out user
            authState.signOut()

        } catch {
            print("Failed to erase all data: \(error)")
        }
    }

    private func settingsThemeIcon(for theme: String) -> String {
        switch theme {
        case "system":
            return "circle.lefthalf.filled"
        case "light":
            return "sun.max.fill"
        case "dark":
            return "moon.fill"
        default:
            return "circle.lefthalf.filled"
        }
    }
}

// MARK: - Main Settings View (Legacy - for sheet presentation)
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.modelContext) private var modelContext
    @State private var settings = AppSettings()
    @EnvironmentObject private var themeSettings: ThemeSettings
    @EnvironmentObject private var authState: AuthStateManager

    @State private var showingEraseConfirmation = false
    @State private var showingAuthView = false
    @State private var debugTestUserEmail = "test@example.com"
    @State private var debugTestUserPassword = "password123"

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Image(systemName: "gear.circle.fill")
                            .foregroundColor(.purple)
                            .font(.title2)
                        
                        VStack(alignment: .leading) {
                            Text("InfiniteStories Settings")
                                .font(.headline)
                            Text("Configure AI story generation")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                // Theme Settings Section
                Section {
                    HStack {
                        Label("Appearance", systemImage: "moon.circle.fill")
                            .foregroundColor(.purple)
                        
                        Spacer()
                        
                        Picker("", selection: $themeSettings.themePreferenceString) {
                            ForEach(["system", "light", "dark"], id: \.self) { theme in
                                HStack {
                                    Image(systemName: themeIcon(for: theme))
                                    Text(theme.capitalized)
                                }
                                .tag(theme)
                            }
                        }
                        .pickerStyle(.menu)
                        .tint(.purple)
                    }
                    
                    // Visual indicator showing current theme
                    HStack {
                        Text("Current Mode:")
                        Spacer()
                        Text(colorScheme == .dark ? "Dark" : "Light")
                            .foregroundColor(.secondary)
                    }
                } header: {
                    Text("Theme")
                } footer: {
                    Text("Choose your preferred appearance or let it follow your system settings.")
                        .font(.caption)
                }
                    Section {
                        HStack {
                            Picker("Story Length", selection: $settings.defaultStoryLength) {
                                Text("5 minutes").tag(5)
                                Text("7 minutes").tag(7)
                                Text("10 minutes").tag(10)
                            }
                            .pickerStyle(.menu)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Picker("Voice", selection: $settings.preferredVoice) {
                                    ForEach(AppSettings.availableVoices, id: \.id) { voice in
                                        Text(voice.name).tag(voice.id)
                                    }
                                }
                                .pickerStyle(.menu)
                            }
                            
                            if let selectedVoice = AppSettings.availableVoices.first(where: { $0.id == settings.preferredVoice }) {
                                Text(selectedVoice.description)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Picker("Language", selection: $settings.preferredLanguage) {
                                    ForEach(AppSettings.availableLanguages, id: \.id) { language in
                                        HStack {
                                            Text(language.name)
                                            Text(language.nativeName)
                                                .foregroundColor(.secondary)
                                        }
                                        .tag(language.id)
                                    }
                                }
                                .pickerStyle(.menu)
                            }
                            
                            Text("Stories will be generated in the selected language")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    } header: {
                        Text("Story Preferences")
                    } footer: {
                        Text("Voice selection uses OpenAI's enhanced text-to-speech with storytelling instructions. Coral and Fable are recommended for bedtime stories.")
                            .font(.caption)
                    }
                    
                    Section {
                        Toggle("Auto-Generate Illustrations", isOn: Binding(
                            get: { UserDefaults.standard.bool(forKey: "autoGenerateIllustrations") },
                            set: { UserDefaults.standard.set($0, forKey: "autoGenerateIllustrations") }
                        ))

                        Toggle("Continue on Illustration Failures", isOn: Binding(
                            get: { UserDefaults.standard.bool(forKey: "allowIllustrationFailures") },
                            set: { UserDefaults.standard.set($0, forKey: "allowIllustrationFailures") }
                        ))

                        Toggle("Show Error Details", isOn: Binding(
                            get: { UserDefaults.standard.bool(forKey: "showIllustrationErrors") },
                            set: { UserDefaults.standard.set($0, forKey: "showIllustrationErrors") }
                        ))

                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Max Retry Attempts")
                                Spacer()
                                Picker("Retries", selection: Binding(
                                    get: {
                                        let value = UserDefaults.standard.integer(forKey: "maxIllustrationRetries")
                                        return value > 0 ? value : 3
                                    },
                                    set: { UserDefaults.standard.set($0, forKey: "maxIllustrationRetries") }
                                )) {
                                    Text("1").tag(1)
                                    Text("2").tag(2)
                                    Text("3").tag(3)
                                    Text("5").tag(5)
                                }
                                .pickerStyle(.menu)
                            }

                            Text("Number of automatic retry attempts for failed illustrations")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        HStack {
                            Text("Max Illustrations Per Story")
                            Spacer()
                            Picker("Max", selection: Binding(
                                get: {
                                    let value = UserDefaults.standard.integer(forKey: "maxIllustrationsPerStory")
                                    return value > 0 ? value : 6
                                },
                                set: { UserDefaults.standard.set($0, forKey: "maxIllustrationsPerStory") }
                            )) {
                                Text("5").tag(5)
                                Text("6").tag(6)
                                Text("7").tag(7)
                                Text("8").tag(8)
                            }
                            .pickerStyle(.menu)
                        }
                    } header: {
                        Text("Illustrations")
                    } footer: {
                        Text("Illustrations enhance stories with AI-generated visuals. If generation fails, placeholders will be shown. You can retry failed illustrations later.")
                            .font(.caption)
                    }

                #if DEBUG
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Auth Status: \(authState.isAuthenticated ? "✓ Signed In" : "✗ Not Signed In")")
                            .font(.caption)
                            .foregroundColor(authState.isAuthenticated ? .green : .orange)

                        if let userId = authState.userId {
                            Text("User ID: \(userId)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)

                    Button(action: {
                        // Debug sign-in would need to call backend API endpoint first
                        // Then call authState.signIn(token:userId:) with the response
                        print("Debug sign-in not implemented - use auth flow instead")
                    }) {
                        HStack {
                            Image(systemName: "person.circle.fill")
                            Text("Sign In as Test User")
                        }
                        .foregroundColor(.blue)
                    }
                    .disabled(authState.isAuthenticated)

                    Button(action: {
                        // Debug sign-up would need to call backend API endpoint first
                        // Then call authState.signIn(token:userId:) with the response
                        print("Debug sign-up not implemented - use auth flow instead")
                    }) {
                        HStack {
                            Image(systemName: "person.badge.plus.fill")
                            Text("Create Random Test User")
                        }
                        .foregroundColor(.purple)
                    }

                    if authState.isAuthenticated {
                        Button(action: {
                            authState.signOut()
                        }) {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Sign Out")
                            }
                            .foregroundColor(.orange)
                        }
                    }
                } header: {
                    Text("Debug Controls")
                } footer: {
                    Text("Debug-only controls for testing authentication. Test user: \(debugTestUserEmail)")
                        .font(.caption)
                }
                #endif

                Section {
                    Button(action: { showingEraseConfirmation = true }) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                            Text("Erase All Data & Sign Out")
                        }
                        .foregroundColor(.red)
                    }
                } header: {
                    Text("Advanced")
                } footer: {
                    Text("Erasing all data will permanently delete all heroes, stories, files, and sign you out. You will be redirected to the sign-up screen.")
                        .font(.caption)
                }
                
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("About InfiniteStories")
                            .font(.headline)
                        
                        Text("Generate personalized bedtime stories for children using AI. Create heroes with unique traits and enjoy magical adventures every night.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            Text("Version")
                            Spacer()
                            Text("1.0.0")
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                } header: {
                    Text("App Info")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .glassNavigation()
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .confirmationDialog("Erase All Data?", isPresented: $showingEraseConfirmation, titleVisibility: .visible) {
                Button("Erase Everything & Sign Out", role: .destructive) {
                    eraseAllData()
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("This will permanently delete all heroes, stories, media files, clear your session, and redirect you to sign-up. This action cannot be undone.")
            }
        }
    }

    private func eraseAllData() {
        do {
            // 1. Delete all SwiftData models
            try modelContext.delete(model: Hero.self)
            try modelContext.delete(model: Story.self)
            try modelContext.delete(model: StoryIllustration.self)
            try modelContext.delete(model: CustomStoryEvent.self)

            // Save the deletion
            try modelContext.save()

            // 2. Delete all file directories
            let fileManager = FileManager.default
            if let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first {
                // Delete AudioStories directory
                let audioPath = documentsPath.appendingPathComponent("AudioStories")
                if fileManager.fileExists(atPath: audioPath.path) {
                    try? fileManager.removeItem(at: audioPath)
                }

                // Delete Avatars directory
                let avatarsPath = documentsPath.appendingPathComponent("Avatars")
                if fileManager.fileExists(atPath: avatarsPath.path) {
                    try? fileManager.removeItem(at: avatarsPath)
                }

                // Delete StoryIllustrations directory
                let illustrationsPath = documentsPath.appendingPathComponent("StoryIllustrations")
                if fileManager.fileExists(atPath: illustrationsPath.path) {
                    try? fileManager.removeItem(at: illustrationsPath)
                }

                // Clean up any loose MP3 files in root documents
                let contents = try fileManager.contentsOfDirectory(at: documentsPath, includingPropertiesForKeys: nil)
                for file in contents {
                    if file.pathExtension == "mp3" {
                        try? fileManager.removeItem(at: file)
                    }
                }
            }

            // 3. Clear all Keychain data (auth tokens, session data)
            let keychainHelper = KeychainHelper()
            keychainHelper.clearAll()

            // 4. Reset UserDefaults to default values
            UserDefaults.standard.removeObject(forKey: "autoGenerateIllustrations")
            UserDefaults.standard.removeObject(forKey: "allowIllustrationFailures")
            UserDefaults.standard.removeObject(forKey: "showIllustrationErrors")
            UserDefaults.standard.removeObject(forKey: "maxIllustrationRetries")
            UserDefaults.standard.removeObject(forKey: "maxIllustrationsPerStory")

            // 5. Reset theme to system default
            themeSettings.themePreferenceString = "system"

            // 6. Sign out user
            authState.signOut()

            // 7. Dismiss settings and show auth view
            dismiss()

            // Small delay to allow settings to dismiss before showing auth
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                showingAuthView = true
            }

        } catch {
            print("Failed to erase all data: \(error)")
        }
    }
    
    private func themeIcon(for theme: String) -> String {
        switch theme {
        case "system":
            return "circle.lefthalf.filled"
        case "light":
            return "sun.max.fill"
        case "dark":
            return "moon.fill"
        default:
            return "circle.lefthalf.filled"
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(ThemeSettings.shared)
}
