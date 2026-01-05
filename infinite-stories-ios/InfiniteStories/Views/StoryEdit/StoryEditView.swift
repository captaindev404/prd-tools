//
//  StoryEditView.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import SwiftUI
import SwiftData

struct StoryEditView: View {
    @Bindable var story: Story
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    
    @State private var editedTitle: String = ""
    @State private var editedContent: String = ""
    @State private var showingDiscardAlert = false
    @State private var hasChanges = false
    @State private var characterCount = 0
    @State private var wordCount = 0
    @State private var showingSaveConfirmation = false
    @State private var isSaving = false
    @State private var showingRegenerationView = false
    @State private var shouldRegenerateAudio = false
    
    @FocusState private var isTextEditorFocused: Bool
    
    private let maxCharacters = 10000
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Title field
                VStack(alignment: .leading, spacing: 8) {
                    Text(String(localized: "story.edit.title.label"))
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)

                    TextField(String(localized: "story.edit.title.placeholder"), text: $editedTitle)
                        .font(.title3.bold())
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                        .onChange(of: editedTitle) { _, _ in
                            hasChanges = true
                        }
                }
                .padding(.top)
                
                // Content editor
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(String(localized: "story.edit.content.label"))
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Spacer()

                        // Character and word count
                        HStack(spacing: 12) {
                            Label(String(localized: "story.edit.words.count.\(wordCount)"), systemImage: "text.word.spacing")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Label(String(localized: "story.edit.characters.count.\(characterCount).\(maxCharacters)"), systemImage: "character.cursor.ibeam")
                                .font(.caption)
                                .foregroundColor(characterCount > maxCharacters ? .red : .secondary)
                        }
                    }
                    .padding(.horizontal)
                    
                    // Text editor with enhanced UI
                    ZStack(alignment: .topLeading) {
                        if #available(iOS 18.0, *) {
                            TextEditor(text: $editedContent)
                                .font(.system(.body, design: .serif))
                                .lineSpacing(4)
                                .padding(8)
                                .focused($isTextEditorFocused)
                                .scrollContentBackground(.hidden)
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                                .writingToolsBehavior(.complete)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(isTextEditorFocused ? Color.purple : Color.clear, lineWidth: 2)
                                )
                                .onChange(of: editedContent) { _, newValue in
                                    hasChanges = true
                                    updateCounts()

                                    // Limit characters
                                    if newValue.count > maxCharacters {
                                        editedContent = String(newValue.prefix(maxCharacters))
                                    }
                                }
                        } else {
                            TextEditor(text: $editedContent)
                                .font(.system(.body, design: .serif))
                                .lineSpacing(4)
                                .padding(8)
                                .focused($isTextEditorFocused)
                                .scrollContentBackground(.hidden)
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(isTextEditorFocused ? Color.purple : Color.clear, lineWidth: 2)
                                )
                                .onChange(of: editedContent) { _, newValue in
                                    hasChanges = true
                                    updateCounts()

                                    // Limit characters
                                    if newValue.count > maxCharacters {
                                        editedContent = String(newValue.prefix(maxCharacters))
                                    }
                                }
                        }
                        
                        // Placeholder text
                        if editedContent.isEmpty {
                            Text(String(localized: "story.edit.content.placeholder"))
                                .font(.system(.body, design: .serif))
                                .foregroundColor(.gray)
                                .padding(.horizontal, 13)
                                .padding(.vertical, 16)
                                .allowsHitTesting(false)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
                
                // Bottom toolbar with formatting hints
                VStack(spacing: 12) {
                    // Formatting tips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            FormatTip(icon: "quote.opening", text: String(localized: "story.edit.tip.quotes"))
                            FormatTip(icon: "paragraphsign", text: String(localized: "story.edit.tip.paragraphs"))
                            FormatTip(icon: "sparkles", text: String(localized: "story.edit.tip.details"))
                            FormatTip(icon: "face.smiling", text: String(localized: "story.edit.tip.engaging"))
                        }
                        .padding(.horizontal)
                    }
                    .frame(height: 30)
                    
                    // Action buttons
                    HStack(spacing: 16) {
                        // Auto-format button
                        Button(action: autoFormatContent) {
                            Label(String(localized: "story.edit.button.autoformat"), systemImage: "wand.and.stars")
                                .font(.caption)
                                .foregroundColor(.purple)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.purple.opacity(0.1))
                                .cornerRadius(8)
                        }

                        Spacer()

                        // Reading time estimate
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.caption)
                            Text(String(localized: "story.edit.reading.time.\(estimatedReadingTime)"))
                                .font(.caption)
                        }
                        .foregroundColor(.secondary)
                    }
                    .padding(.horizontal)
                }
                .padding(.bottom)
                .background(Color(.systemBackground))
            }
            .navigationTitle(String(localized: "story.edit.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(String(localized: "story.edit.button.cancel")) {
                        if hasChanges {
                            showingDiscardAlert = true
                        } else {
                            dismiss()
                        }
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { saveChanges(regenerateAudio: false) }) {
                            Label(String(localized: "story.edit.button.save"), systemImage: "square.and.arrow.down")
                        }
                        Button(action: { saveChanges(regenerateAudio: true) }) {
                            Label(String(localized: "story.edit.button.save.regenerate"), systemImage: "waveform")
                        }
                    } label: {
                        if isSaving {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                                .scaleEffect(0.8)
                        } else {
                            Text(String(localized: "story.edit.button.save"))
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(!hasChanges || isSaving || editedTitle.isEmpty || editedContent.isEmpty)
                }
            }
            .alert(String(localized: "story.edit.alert.discard.title"), isPresented: $showingDiscardAlert) {
                Button(String(localized: "story.edit.button.discard"), role: .destructive) {
                    dismiss()
                }
                Button(String(localized: "story.edit.button.keep.editing"), role: .cancel) { }
            } message: {
                Text(String(localized: "story.edit.alert.discard.message"))
            }
            .alert(String(localized: "story.edit.alert.updated.title"), isPresented: $showingSaveConfirmation) {
                Button(String(localized: "story.edit.button.ok")) {
                    if shouldRegenerateAudio {
                        showingRegenerationView = true
                    } else {
                        dismiss()
                    }
                }
            } message: {
                Text(shouldRegenerateAudio ?
                     String(localized: "story.edit.alert.updated.message.regenerate") :
                     String(localized: "story.edit.alert.updated.message.normal"))
            }
            .fullScreenCover(isPresented: $showingRegenerationView) {
                AudioRegenerationView(story: story) {
                    // On completion, dismiss both views
                    showingRegenerationView = false
                    dismiss()
                }
            }
            .onAppear {
                editedTitle = story.title
                editedContent = story.content
                updateCounts()
            }
            // Keyboard toolbar
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Button(String(localized: "story.edit.button.done")) {
                        isTextEditorFocused = false
                    }
                }
            }
        }
    }
    
    private func updateCounts() {
        characterCount = editedContent.count
        wordCount = editedContent.split(whereSeparator: \.isWhitespace).count
    }
    
    private var estimatedReadingTime: Int {
        // Average reading speed: 200 words per minute
        max(1, (wordCount + 199) / 200)
    }
    
    private func autoFormatContent() {
        // Add proper paragraph breaks
        var formatted = editedContent
        
        // Ensure dialogue has proper spacing
        formatted = formatted.replacingOccurrences(of: ".", with: ".\n\n")
            .replacingOccurrences(of: "!", with: "!\n\n")
            .replacingOccurrences(of: "?", with: "?\n\n")
        
        // Remove excessive line breaks
        while formatted.contains("\n\n\n") {
            formatted = formatted.replacingOccurrences(of: "\n\n\n", with: "\n\n")
        }
        
        // Trim whitespace
        formatted = formatted.trimmingCharacters(in: .whitespacesAndNewlines)
        
        editedContent = formatted
        updateCounts()
    }
    
    private func saveChanges(regenerateAudio: Bool = false) {
        isSaving = true
        shouldRegenerateAudio = regenerateAudio
        
        // Update story properties
        // The Story model will automatically mark audio for regeneration and delete old audio
        // when content or title changes (via didSet observers)
        let trimmedTitle = editedTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedContent = editedContent.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Only update if there are actual changes to trigger audio regeneration
        if story.title != trimmedTitle {
            story.title = trimmedTitle
        }
        if story.content != trimmedContent {
            story.content = trimmedContent
        }
        
        // Update last modified date
        story.lastModified = Date()
        
        // Save to database
        do {
            try modelContext.save()
            
            // Show confirmation
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                isSaving = false
                showingSaveConfirmation = true
            }
        } catch {
            print("Failed to save story edits: \(error)")
            isSaving = false
        }
    }
}

struct FormatTip: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)
            Text(text)
                .font(.caption2)
        }
        .foregroundColor(.secondary)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(6)
    }
}

#Preview {
    let story = Story(
        title: "Luna's Magical Adventure",
        content: "Once upon a time in a magical forest, Luna the brave and magical hero discovered a secret that would change everything...",
        event: .bedtime,
        hero: Hero(name: "Luna", primaryTrait: .brave, secondaryTrait: .magical)
    )
    
    return StoryEditView(story: story)
        .modelContainer(for: Story.self, inMemory: true)
}