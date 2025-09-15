//
//  AvatarGenerationView.swift
//  InfiniteStories
//
//  AI-assisted avatar generation for heroes
//

import SwiftUI

struct AvatarGenerationView: View {
    let hero: Hero
    @Binding var isPresented: Bool

    @State private var customPrompt: String = ""
    @State private var selectedStyle: AvatarStyle = .cartoonKids
    @State private var isGenerating = false
    @State private var generatedImage: UIImage?
    @State private var generationError: String?
    @State private var showingSuggestions = false
    @State private var aiService: OpenAIService?
    @StateObject private var appSettings = AppSettings()

    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    headerSection
                    styleSelectionSection
                    promptInputSection
                    suggestionsSection
                    generationSection
                    actionButtons
                }
                .padding()
            }
            .navigationTitle("Generate Avatar")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Skip") {
                        isPresented = false
                    }
                    .disabled(isGenerating)
                }
            }
        }
        .onAppear {
            setupAIService()
            generateDefaultPrompt()
        }
    }

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "paintbrush.pointed.fill")
                .font(.system(size: 50))
                .foregroundColor(.purple)

            VStack(spacing: 8) {
                Text("Create Avatar for \(hero.name)")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Generate a magical illustration that represents your hero's personality and appearance")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    private var styleSelectionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Art Style")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Button(action: { showingSuggestions.toggle() }) {
                    Label("View Examples", systemImage: "lightbulb.fill")
                        .font(.caption)
                        .foregroundColor(.purple)
                }
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(AvatarStyle.allCases, id: \.self) { style in
                        StyleCard(
                            style: style,
                            isSelected: selectedStyle == style,
                            onSelect: {
                                selectedStyle = style
                                updatePromptForStyle()
                            }
                        )
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }

    private var promptInputSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Describe Your Hero")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Button(action: enhancePromptWithAI) {
                    Label("AI Enhance", systemImage: "sparkles")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
                .disabled(customPrompt.isEmpty)
            }

            TextEditor(text: $customPrompt)
                .frame(minHeight: 100)
                .padding(12)
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.purple.opacity(0.3), lineWidth: 1)
                )

            Text("Tip: Describe additional details, clothing, accessories, or magical elements")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    private var suggestionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button(action: { showingSuggestions.toggle() }) {
                HStack {
                    Text("Need Ideas?")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Spacer()

                    Image(systemName: showingSuggestions ? "chevron.up" : "chevron.down")
                        .font(.caption)
                }
                .foregroundColor(.purple)
            }

            if showingSuggestions {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 120))], spacing: 8) {
                    ForEach(AvatarPromptAssistant.getRandomPromptIdeas(), id: \.self) { idea in
                        Button(action: {
                            if !customPrompt.isEmpty && !customPrompt.hasSuffix(", ") {
                                customPrompt += ", "
                            }
                            customPrompt += idea
                        }) {
                            Text(idea)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.purple.opacity(0.1))
                                .foregroundColor(.purple)
                                .cornerRadius(6)
                        }
                    }
                }
                .transition(.opacity.combined(with: .scale))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: showingSuggestions)
    }

    private var generationSection: some View {
        VStack(spacing: 16) {
            if isGenerating {
                VStack(spacing: 12) {
                    ProgressView()
                        .scaleEffect(1.2)

                    Text("Generating your hero's avatar...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text("This may take up to 30 seconds")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .background(Color(.systemGray6))
                .cornerRadius(16)

            } else if let image = generatedImage {
                VStack(spacing: 12) {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: 300, maxHeight: 300)
                        .cornerRadius(16)
                        .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)

                    Text("✨ Avatar Generated!")
                        .font(.headline)
                        .foregroundColor(.green)
                }

            } else if let error = generationError {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.title)
                        .foregroundColor(.red)

                    Text("Generation Failed")
                        .font(.headline)
                        .foregroundColor(.red)

                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)

                    Button("Try Again") {
                        generateAvatar()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
            }
        }
    }

    private var actionButtons: some View {
        HStack(spacing: 16) {
            if generatedImage != nil {
                Button("Regenerate") {
                    generateAvatar()
                }
                .buttonStyle(.bordered)
                .disabled(isGenerating)

                Button("Save Avatar") {
                    saveAvatar()
                }
                .buttonStyle(.borderedProminent)
                .disabled(isGenerating)
            } else {
                Button("Generate Avatar") {
                    generateAvatar()
                }
                .buttonStyle(.borderedProminent)
                .disabled(isGenerating || customPrompt.isEmpty)
                .frame(maxWidth: .infinity)
            }
        }
    }

    private func setupAIService() {
        if !appSettings.openAIAPIKey.isEmpty {
            aiService = OpenAIService(apiKey: appSettings.openAIAPIKey)
        }
    }

    private func generateDefaultPrompt() {
        customPrompt = AvatarPromptAssistant.generatePrompt(for: hero, style: selectedStyle)
    }

    private func updatePromptForStyle() {
        customPrompt = AvatarPromptAssistant.generatePrompt(for: hero, style: selectedStyle)
    }

    private func enhancePromptWithAI() {
        customPrompt = AvatarPromptAssistant.enhanceUserPrompt(customPrompt, for: hero)
    }

    private func generateAvatar() {
        guard let service = aiService else {
            generationError = "AI service not available. Please check your API key."
            return
        }

        isGenerating = true
        generationError = nil
        generatedImage = nil

        let finalPrompt = AvatarPromptAssistant.enhanceUserPrompt(customPrompt, for: hero)

        let request = AvatarGenerationRequest(
            hero: hero,
            prompt: finalPrompt,
            size: "1024x1024",
            quality: "standard"
        )

        Task {
            do {
                let response = try await service.generateAvatar(request: request)

                await MainActor.run {
                    generatedImage = UIImage(data: response.imageData)
                    isGenerating = false

                    if generatedImage == nil {
                        generationError = "Failed to create image from data"
                    }
                }
            } catch {
                await MainActor.run {
                    isGenerating = false
                    generationError = "Failed to generate avatar: \(error.localizedDescription)"
                }
            }
        }
    }

    private func saveAvatar() {
        guard let image = generatedImage else { return }

        Task {
            do {
                let filename = "avatar_\(hero.name.replacingOccurrences(of: " ", with: "_"))_\(Date().timeIntervalSince1970).png"
                let avatarsDirectory = getDocumentsDirectory().appendingPathComponent("Avatars")

                try FileManager.default.createDirectory(at: avatarsDirectory, withIntermediateDirectories: true)

                let fileURL = avatarsDirectory.appendingPathComponent(filename)

                if let imageData = image.pngData() {
                    try imageData.write(to: fileURL)

                    await MainActor.run {
                        hero.avatarImagePath = filename
                        hero.avatarPrompt = customPrompt
                        hero.avatarGeneratedAt = Date()
                        isPresented = false
                    }
                }
            } catch {
                await MainActor.run {
                    generationError = "Failed to save avatar: \(error.localizedDescription)"
                }
            }
        }
    }

    private func getDocumentsDirectory() -> URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        return paths[0]
    }
}

struct StyleCard: View {
    let style: AvatarStyle
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 8) {
                Image(systemName: iconForStyle(style))
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : .purple)

                Text(style.rawValue.capitalized)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : .primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(width: 100, height: 80)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.purple : Color(.systemGray6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.purple : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func iconForStyle(_ style: AvatarStyle) -> String {
        switch style {
        case .cartoonKids:
            return "paintbrush.fill"
        case .watercolor:
            return "drop.fill"
        case .digitalArt:
            return "paintpalette.fill"
        case .pixar:
            return "cube.fill"
        case .storybook:
            return "book.closed.fill"
        }
    }
}

#Preview {
    let hero = Hero(name: "Alex", primaryTrait: .brave, secondaryTrait: .kind, appearance: "curly hair and bright eyes", specialAbility: "talk to animals")

    return AvatarGenerationView(hero: hero, isPresented: .constant(true))
}