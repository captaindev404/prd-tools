//
//  HeroVisualProfileView.swift
//  InfiniteStories
//
//  View for managing hero visual consistency profiles
//  NOTE: Uses API-only architecture - no local SwiftData persistence
//

import SwiftUI

struct HeroVisualProfileView: View {
    let hero: Hero
    @State private var visualProfile: HeroVisualProfile?
    @State private var isLoading = false
    @State private var showingEditor = false
    @State private var errorMessage: String?

    private let heroRepository = HeroRepository()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                headerSection

                // Network status warning
                if !NetworkMonitor.shared.isConnected {
                    networkWarning
                }

                // Visual Profile Status
                profileStatusSection

                if let profile = visualProfile {
                    // Visual Characteristics
                    characteristicsSection(profile)

                    // Art Style Settings
                    artStyleSection(profile)

                    // Prompts
                    promptsSection(profile)

                    // Actions
                    actionsSection(profile)
                } else if !isLoading {
                    // Create Profile
                    createProfileSection
                }

                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .padding()
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            .padding()
        }
        .navigationTitle("Visual Profile")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadVisualProfile()
        }
        .sheet(isPresented: $showingEditor) {
            if let profile = visualProfile {
                VisualProfileEditorView(
                    profile: profile,
                    hero: hero
                ) { updatedProfile in
                    Task {
                        await saveProfile(updatedProfile)
                    }
                }
            }
        }
        .overlay {
            if isLoading {
                ProgressView()
                    .scaleEffect(1.5)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.2))
            }
        }
    }

    // MARK: - View Sections

    private var headerSection: some View {
        HStack {
            HeroAvatarImageView(hero: hero, size: 80)

            VStack(alignment: .leading) {
                Text(hero.name)
                    .font(.title2)
                    .bold()

                Text(hero.appearance)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var networkWarning: some View {
        HStack {
            Image(systemName: "wifi.slash")
                .foregroundColor(.orange)
            Text("No network connection. Visual profile operations require internet.")
                .font(.caption)
                .foregroundColor(.orange)
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(8)
    }

    private var profileStatusSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Visual Consistency Status", systemImage: "eye.circle.fill")
                .font(.headline)

            HStack {
                Image(systemName: visualProfile != nil ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundColor(visualProfile != nil ? .green : .orange)

                Text(visualProfile != nil ? "Profile Active" : "No Profile")
                    .font(.subheadline)

                Spacer()

                if visualProfile != nil {
                    Text("AI Extracted")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.2))
                        .cornerRadius(6)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func characteristicsSection(_ profile: HeroVisualProfile) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Visual Characteristics", systemImage: "person.text.rectangle")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                characteristicItem("Hair", value: combineHair(profile))
                characteristicItem("Eyes", value: profile.eyeColor)
                characteristicItem("Skin", value: profile.skinTone)
                characteristicItem("Age", value: profile.ageAppearance)
                characteristicItem("Clothing", value: profile.clothingStyle)
                characteristicItem("Colors", value: profile.clothingColors)
            }

            if let distinctive = profile.distinctiveFeatures {
                VStack(alignment: .leading) {
                    Text("Distinctive Features")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(distinctive)
                        .font(.subheadline)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func artStyleSection(_ profile: HeroVisualProfile) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Art Style", systemImage: "paintbrush.pointed.fill")
                .font(.headline)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Style:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(profile.artStyle ?? "Not specified")
                        .font(.subheadline)
                }

                if let palette = profile.colorPalette, !palette.isEmpty {
                    HStack {
                        Text("Colors:")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(palette.joined(separator: ", "))
                            .font(.subheadline)
                    }
                }

                if let lighting = profile.lightingPreference {
                    HStack {
                        Text("Lighting:")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(lighting)
                            .font(.subheadline)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func promptsSection(_ profile: HeroVisualProfile) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Consistency Prompts", systemImage: "text.alignleft")
                .font(.headline)

            VStack(alignment: .leading, spacing: 12) {
                if let canonicalPrompt = profile.canonicalPrompt {
                    VStack(alignment: .leading) {
                        Text("Canonical Prompt")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(canonicalPrompt)
                            .font(.system(.caption, design: .monospaced))
                            .padding(8)
                            .background(Color.black.opacity(0.05))
                            .cornerRadius(6)
                    }
                }

                if let simplifiedPrompt = profile.simplifiedPrompt {
                    VStack(alignment: .leading) {
                        Text("Simplified for Scenes")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(simplifiedPrompt)
                            .font(.system(.caption, design: .monospaced))
                            .padding(8)
                            .background(Color.black.opacity(0.05))
                            .cornerRadius(6)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func actionsSection(_ profile: HeroVisualProfile) -> some View {
        VStack(spacing: 12) {
            Button(action: {
                showingEditor = true
            }) {
                Label("Edit Profile", systemImage: "pencil")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .disabled(!NetworkMonitor.shared.isConnected)

            Button(action: {
                Task {
                    await extractProfileWithAI()
                }
            }) {
                Label("Re-Extract with AI", systemImage: "sparkles")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .disabled(isLoading || !NetworkMonitor.shared.isConnected || !hero.hasAvatar)

            Button(action: {
                Task {
                    await resetProfile()
                }
            }) {
                Label("Reset Profile", systemImage: "arrow.counterclockwise")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .foregroundColor(.red)
            .disabled(isLoading || !NetworkMonitor.shared.isConnected)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var createProfileSection: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.crop.circle.badge.plus")
                .font(.system(size: 50))
                .foregroundColor(.blue)

            Text("No Visual Profile")
                .font(.headline)

            Text("Create a visual consistency profile to ensure \(hero.name) looks the same in all illustrations")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            if hero.hasAvatar {
                Button(action: {
                    Task {
                        await extractProfileWithAI()
                    }
                }) {
                    Label("Extract with AI", systemImage: "sparkles")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading || !NetworkMonitor.shared.isConnected)
            } else {
                Text("Generate an avatar first to enable AI extraction")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Helper Views

    private func characteristicItem(_ label: String, value: String?) -> some View {
        VStack(alignment: .leading) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value ?? "Not specified")
                .font(.subheadline)
                .foregroundColor(value != nil ? .primary : .secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func combineHair(_ profile: HeroVisualProfile) -> String? {
        if let color = profile.hairColor, let style = profile.hairStyle {
            return "\(color) \(style)"
        }
        return profile.hairColor ?? profile.hairStyle
    }

    // MARK: - API Actions

    private func loadVisualProfile() async {
        guard let heroId = hero.backendId else {
            errorMessage = "Hero has no backend ID"
            return
        }

        guard NetworkMonitor.shared.isConnected else {
            errorMessage = "No network connection"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            visualProfile = try await heroRepository.getVisualProfile(heroId: heroId)
        } catch {
            errorMessage = "Failed to load profile: \(error.localizedDescription)"
        }

        isLoading = false
    }

    private func extractProfileWithAI() async {
        guard let heroId = hero.backendId else {
            errorMessage = "Hero has no backend ID"
            return
        }

        guard NetworkMonitor.shared.isConnected else {
            errorMessage = "No network connection"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            visualProfile = try await heroRepository.extractVisualProfile(heroId: heroId)
        } catch {
            errorMessage = "AI extraction failed: \(error.localizedDescription)"
        }

        isLoading = false
    }

    private func saveProfile(_ profile: HeroVisualProfile) async {
        guard let heroId = hero.backendId else {
            errorMessage = "Hero has no backend ID"
            return
        }

        guard NetworkMonitor.shared.isConnected else {
            errorMessage = "No network connection"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            if visualProfile != nil {
                visualProfile = try await heroRepository.updateVisualProfile(heroId: heroId, profile: profile)
            } else {
                visualProfile = try await heroRepository.createVisualProfile(heroId: heroId, profile: profile)
            }
        } catch {
            errorMessage = "Failed to save profile: \(error.localizedDescription)"
        }

        isLoading = false
    }

    private func resetProfile() async {
        guard let heroId = hero.backendId else {
            errorMessage = "Hero has no backend ID"
            return
        }

        guard NetworkMonitor.shared.isConnected else {
            errorMessage = "No network connection"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await heroRepository.deleteVisualProfile(heroId: heroId)
            visualProfile = nil
        } catch {
            errorMessage = "Failed to delete profile: \(error.localizedDescription)"
        }

        isLoading = false
    }
}

// MARK: - Visual Profile Editor

struct VisualProfileEditorView: View {
    @State var profile: HeroVisualProfile
    let hero: Hero
    let onSave: (HeroVisualProfile) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Appearance") {
                    TextField("Hair Color", text: Binding(
                        get: { profile.hairColor ?? "" },
                        set: { profile.hairColor = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Hair Style", text: Binding(
                        get: { profile.hairStyle ?? "" },
                        set: { profile.hairStyle = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Eye Color", text: Binding(
                        get: { profile.eyeColor ?? "" },
                        set: { profile.eyeColor = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Skin Tone", text: Binding(
                        get: { profile.skinTone ?? "" },
                        set: { profile.skinTone = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section("Clothing") {
                    TextField("Typical Clothing", text: Binding(
                        get: { profile.typicalClothing ?? "" },
                        set: { profile.typicalClothing = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Accessories", text: Binding(
                        get: { profile.accessories ?? "" },
                        set: { profile.accessories = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section("Art Style") {
                    TextField("Art Style", text: Binding(
                        get: { profile.artStyle ?? "" },
                        set: { profile.artStyle = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section("Distinctive Features") {
                    TextEditor(text: Binding(
                        get: { profile.facialFeatures ?? "" },
                        set: { profile.facialFeatures = $0.isEmpty ? nil : $0 }
                    ))
                    .frame(minHeight: 100)
                }
            }
            .navigationTitle("Edit Visual Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        onSave(profile)
                        dismiss()
                    }
                    .bold()
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        HeroVisualProfileView(
            hero: Hero(
                name: "Luna",
                primaryTrait: .brave,
                secondaryTrait: .kind,
                appearance: "Young girl with curly brown hair and bright green eyes",
                specialAbility: "Can talk to animals",
                backendId: "preview-hero-id"
            )
        )
    }
}
