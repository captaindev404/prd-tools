//
//  AudioPlayerView.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import SwiftUI
import SwiftData
import UIKit

struct AudioPlayerView: View {
    let initialStory: Story
    let allStories: [Story]?
    let storyIndex: Int?

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @StateObject private var viewModel = StoryViewModel()
    @State private var showingFullText = false
    @State private var showingEditView = false
    @State private var showingShareSheet = false
    @State private var audioFileURL: URL?
    @State private var showingExportError = false
    @State private var exportErrorMessage = ""
    @State private var exportMetadata: [String: Any] = [:]

    // Animation states
    @State private var playButtonPressed = false
    @State private var skipForwardPressed = false
    @State private var skipBackwardPressed = false
    @State private var previousButtonPressed = false
    @State private var nextButtonPressed = false

    init(story: Story, allStories: [Story]? = nil, storyIndex: Int? = nil) {
        self.initialStory = story
        self.allStories = allStories
        self.storyIndex = storyIndex
    }

    // Computed property to get the current story being played
    private var currentStory: Story {
        // If we're in queue mode and have a current story, use it
        // Otherwise fall back to the initial story
        viewModel.currentStory ?? initialStory
    }
    
    var body: some View {
        if currentStory.title.isEmpty && currentStory.content.isEmpty {
            VStack(spacing: 20) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 50))
                    .foregroundColor(.orange)
                
                Text("Story data is missing")
                    .font(.headline)
                
                Text("This story appears to have no content")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Button("Close") {
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
        } else {
            VStack(spacing: 25) {
                // Header
                VStack(spacing: 10) {
                    Image(systemName: "headphones.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.orange)
                    
                    Text(currentStory.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                    
                    if let hero = currentStory.hero {
                        Text("Featuring \(hero.name)")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                
                // Story preview with enhanced UI
                ZStack(alignment: .bottom) {
                    VStack(spacing: 8) {
                        // Reading time estimate
                        if !currentStory.content.isEmpty {
                            HStack {
                                Image(systemName: "book.fill")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("\(estimatedReadingTime) min read")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(wordCount) words")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 20)
                        }
                        
                        // Story content
                        ScrollView {
                            if currentStory.content.isEmpty {
                                Text("No story content available")
                                    .font(.body)
                                    .italic()
                                    .foregroundColor(.secondary)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            } else {
                                Text(currentStory.content)
                                    .font(.system(.body, design: .serif))
                                    .lineSpacing(4)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .frame(maxHeight: showingFullText ? 400 : 150)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color(.systemGray6))
                        )
                        .padding(.horizontal)
                    }
                    
                    // Gradient overlay when collapsed
                    if !showingFullText && !currentStory.content.isEmpty {
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(.systemGray6).opacity(0),
                                Color(.systemGray6).opacity(0.8),
                                Color(.systemGray6)
                            ]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 60)
                        .cornerRadius(12)
                        .padding(.horizontal)
                        .allowsHitTesting(false)
                    }
                }
                
                // Expand/Collapse button
                if !currentStory.content.isEmpty {
                    Button(action: {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            showingFullText.toggle()
                        }
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: showingFullText ? "chevron.up.circle" : "chevron.down.circle")
                                .font(.system(size: 16))
                            Text(showingFullText ? "Show Less" : "Read Full Story")
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                        .foregroundColor(.purple)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .fill(Color.purple.opacity(0.1))
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                // Audio controls
                VStack(spacing: 20) {
                    // Interactive Progress Slider
                    if viewModel.duration > 0 {
                        VStack(spacing: 8) {
                            // Interactive slider for audio playback
                            Slider(
                                value: Binding(
                                    get: { viewModel.currentTime },
                                    set: { newTime in
                                        viewModel.seek(to: newTime)
                                    }
                                ),
                                in: 0...viewModel.duration
                            )
                            .accentColor(.orange)
                            
                            HStack {
                                Text(formatTime(viewModel.currentTime))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .monospacedDigit()
                                
                                Spacer()
                                
                                Text(formatTime(viewModel.duration))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .monospacedDigit()
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // Main Playback Controls
                    HStack(spacing: 20) {
                        // Previous Story Button
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.1)) {
                                if viewModel.isQueueMode {
                                    viewModel.playPreviousStory()
                                } else {
                                    // Restart current story
                                    viewModel.seek(to: 0)
                                }
                            }
                        }) {
                            Image(systemName: "backward.fill")
                                .font(.system(size: 24))
                                .foregroundColor(canGoToPrevious ? .orange : .gray)
                        }
                        .scaleEffect(previousButtonPressed ? 0.9 : 1.0)
                        .disabled(!canGoToPrevious && viewModel.duration == 0)
                        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
                            withAnimation(.easeInOut(duration: 0.1)) {
                                previousButtonPressed = pressing
                            }
                        }, perform: {})

                        // Skip Backward 15s
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.1)) {
                                viewModel.skipBackward()
                            }
                        }) {
                            Image(systemName: "gobackward.15")
                                .font(.system(size: 24))
                                .foregroundColor(.orange)
                        }
                        .scaleEffect(skipBackwardPressed ? 0.9 : 1.0)
                        .disabled(viewModel.duration == 0)
                        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
                            withAnimation(.easeInOut(duration: 0.1)) {
                                skipBackwardPressed = pressing
                            }
                        }, perform: {})

                        Spacer()

                        // Main Play/Pause Button
                        Button(action: {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                                if viewModel.isPlaying || viewModel.isPaused {
                                    viewModel.togglePlayPause()
                                } else {
                                    viewModel.playStory(currentStory)
                                }
                            }
                        }) {
                            Image(systemName: playButtonIcon)
                                .font(.system(size: 56))
                                .foregroundColor(.orange)
                        }
                        .scaleEffect(playButtonPressed ? 0.95 : 1.0)
                        .animation(.spring(response: 0.2, dampingFraction: 0.8), value: playButtonPressed)
                        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
                            withAnimation(.easeInOut(duration: 0.1)) {
                                playButtonPressed = pressing
                            }
                        }, perform: {})

                        Spacer()

                        // Skip Forward 15s
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.1)) {
                                viewModel.skipForward()
                            }
                        }) {
                            Image(systemName: "goforward.15")
                                .font(.system(size: 24))
                                .foregroundColor(.orange)
                        }
                        .scaleEffect(skipForwardPressed ? 0.9 : 1.0)
                        .disabled(viewModel.duration == 0)
                        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
                            withAnimation(.easeInOut(duration: 0.1)) {
                                skipForwardPressed = pressing
                            }
                        }, perform: {})

                        // Next Story Button
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.1)) {
                                if viewModel.isQueueMode {
                                    viewModel.playNextStory()
                                }
                            }
                        }) {
                            Image(systemName: "forward.fill")
                                .font(.system(size: 24))
                                .foregroundColor(canGoToNext ? .orange : .gray)
                        }
                        .scaleEffect(nextButtonPressed ? 0.9 : 1.0)
                        .disabled(!canGoToNext)
                        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
                            withAnimation(.easeInOut(duration: 0.1)) {
                                nextButtonPressed = pressing
                            }
                        }, perform: {})
                    }
                    .padding(.horizontal, 30)
                    
                    // Secondary Controls
                    HStack(spacing: 30) {
                        // Audio regeneration indicator
                        if currentStory.audioNeedsRegeneration {
                            HStack(spacing: 4) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .font(.caption)
                                Text("Audio outdated")
                                    .font(.caption2)
                            }
                            .foregroundColor(.orange)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange.opacity(0.1))
                            .cornerRadius(6)
                        }
                        
                        // Speed Control
                        Menu {
                            Button("0.5x") { viewModel.setPlaybackSpeed(0.5) }
                            Button("0.75x") { viewModel.setPlaybackSpeed(0.75) }
                            Button("1.0x") { viewModel.setPlaybackSpeed(1.0) }
                            Button("1.25x") { viewModel.setPlaybackSpeed(1.25) }
                            Button("1.5x") { viewModel.setPlaybackSpeed(1.5) }
                            Button("2.0x") { viewModel.setPlaybackSpeed(2.0) }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "speedometer")
                                Text(String(format: "%.2gx", viewModel.playbackSpeed))
                            }
                            .font(.subheadline)
                            .foregroundColor(.purple)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.purple.opacity(0.1))
                            .cornerRadius(10)
                        }
                        
                        Spacer()
                        
                        // Stop Button (smaller, secondary)
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                viewModel.stopAudio()
                            }
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "stop.fill")
                                Text("Stop")
                            }
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                        }
                        .opacity((viewModel.isPlaying || viewModel.isPaused) ? 1.0 : 0.5)
                        .disabled(!(viewModel.isPlaying || viewModel.isPaused))
                    }
                    .padding(.horizontal)
                }
                
                // Story info
                HStack {
                    Text("Created: \(currentStory.formattedDate)")
                    Spacer()
                    Text("Played: \(currentStory.playCount) times")
                }
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.horizontal)
                
                Spacer()
            }
            .background(Color(.systemBackground))
            .navigationBarTitleDisplayMode(.inline)
            .navigationTitle("Audio Player")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        viewModel.stopAudio()
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarLeading) {
                    HStack(spacing: 16) {
                        Button(action: {
                            currentStory.isFavorite.toggle()
                            try? modelContext.save()
                        }) {
                            Image(systemName: currentStory.isFavorite ? "heart.fill" : "heart")
                                .foregroundColor(currentStory.isFavorite ? .red : .secondary)
                        }
                        
                        Button(action: {
                            showingEditView = true
                        }) {
                            Image(systemName: "pencil")
                                .foregroundColor(.purple)
                        }
                        
                        // Export Audio Button
                        Button(action: {
                            exportAudioFile()
                        }) {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundColor(currentStory.hasAudio ? .blue : .gray)
                        }
                        .disabled(!currentStory.hasAudio && currentStory.audioFileName == nil)
                        .opacity(currentStory.hasAudio || currentStory.audioFileName != nil ? 1.0 : 0.6)
                    }
                }
            }
            .sheet(isPresented: $showingEditView) {
                StoryEditView(story: currentStory)
            }
            .sheet(isPresented: $showingShareSheet) {
                if let audioFileURL = audioFileURL {
                    ShareSheet(activityItems: [audioFileURL])
                }
            }
            .alert("Export Error", isPresented: $showingExportError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(exportErrorMessage)
            }
            .onAppear {
                print("🎵 === AudioPlayerView appeared ===")
                print("🎵 Initial story title: '\(initialStory.title)'")
                print("🎵 Initial story content length: \(initialStory.content.count) characters")
                print("🎵 Initial story content preview: '\(initialStory.shortContent)'")
                print("🎵 Hero name: '\(initialStory.hero?.name ?? "No hero")'")
                print("🎵 Story created: \(initialStory.formattedDate)")
                print("🎵 Play count: \(initialStory.playCount)")
                print("🎵 Has audio: \(initialStory.hasAudio)")
                print("🎵 ==============================")
                viewModel.setModelContext(modelContext)

                // Setup story queue if stories are provided
                if let allStories = allStories,
                   let storyIndex = storyIndex {
                    viewModel.setupStoryQueue(stories: allStories, startIndex: storyIndex)
                    print("🎵 Queue mode enabled with \(allStories.count) stories")
                } else {
                    // If no queue, set the initial story as current
                    viewModel.currentStory = initialStory
                }
            }
            .onDisappear {
                viewModel.stopAudio()
                // Ensure idle timer is re-enabled when leaving the player
                UIApplication.shared.isIdleTimerDisabled = false
            }
        }
    }
    
    private var playButtonIcon: String {
        if viewModel.isPlaying {
            return "pause.circle.fill"
        } else if viewModel.isPaused {
            return "play.circle.fill"
        } else {
            return "play.circle.fill"
        }
    }
    
    private func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
    
    private var wordCount: Int {
        currentStory.content.components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .count
    }
    
    private var estimatedReadingTime: Int {
        // Average reading speed is about 200 words per minute
        max(1, (wordCount + 199) / 200)
    }

    private var canGoToPrevious: Bool {
        viewModel.isQueueMode && viewModel.currentStoryIndex > 0
    }

    private var canGoToNext: Bool {
        viewModel.isQueueMode && viewModel.currentStoryIndex < viewModel.storyQueue.count - 1
    }

    private func exportAudioFile() {
        guard let audioFileName = currentStory.audioFileName else {
            exportErrorMessage = "This story doesn't have an audio file yet. Please play the story first to generate audio."
            showingExportError = true
            return
        }

        Task {
            await performAudioExport(audioFileName: audioFileName)
        }
    }

    @MainActor
    private func performAudioExport(audioFileName: String) async {
        let fileManager = FileManager.default

        do {
            // Get documents directory
            let documentsURL = try fileManager.url(
                for: .documentDirectory,
                in: .userDomainMask,
                appropriateFor: nil,
                create: false
            )

            let audioPath = documentsURL.appendingPathComponent(audioFileName)

            // Verify file exists
            guard fileManager.fileExists(atPath: audioPath.path) else {
                throw AudioExportError.fileNotFound
            }

            // Create temp directory for export
            let tempDir = fileManager.temporaryDirectory
                .appendingPathComponent("AudioExports", isDirectory: true)

            try fileManager.createDirectory(
                at: tempDir,
                withIntermediateDirectories: true,
                attributes: nil
            )

            // Generate clean filename
            let exportFileName = sanitizeFileName("\(currentStory.title).mp3")
            let tempFileURL = tempDir.appendingPathComponent(exportFileName)

            // Remove existing temp file if needed
            if fileManager.fileExists(atPath: tempFileURL.path) {
                try fileManager.removeItem(at: tempFileURL)
            }

            // Copy with proper attributes
            try fileManager.copyItem(at: audioPath, to: tempFileURL)

            // Set file attributes for sharing
            try fileManager.setAttributes(
                [.posixPermissions: 0o644],
                ofItemAtPath: tempFileURL.path
            )

            // Prepare metadata
            let metadata = createAudioMetadata(for: tempFileURL)

            // Show share sheet
            await MainActor.run {
                self.audioFileURL = tempFileURL
                self.exportMetadata = metadata
                self.showingShareSheet = true
            }

        } catch {
            await MainActor.run {
                handleExportError(error)
            }
        }
    }

    private func sanitizeFileName(_ filename: String) -> String {
        let invalidCharacters = CharacterSet(charactersIn: "/\\?%*|\"<>:")
        return filename
            .components(separatedBy: invalidCharacters)
            .joined(separator: "-")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func createAudioMetadata(for url: URL) -> [String: Any] {
        var metadata: [String: Any] = [:]

        // Add story metadata
        metadata["title"] = currentStory.title
        metadata["artist"] = currentStory.hero?.name ?? "InfiniteStories"
        metadata["album"] = "Bedtime Stories"
        metadata["genre"] = "Children's Stories"

        // Add creation date
        metadata["year"] = Calendar.current.component(.year, from: currentStory.createdAt)

        // Add custom metadata
        metadata["comment"] = "Created with InfiniteStories app"

        return metadata
    }

    private func handleExportError(_ error: Error) {
        if let exportError = error as? AudioExportError {
            exportErrorMessage = exportError.localizedDescription
        } else {
            exportErrorMessage = "Unable to export audio: \(error.localizedDescription)"
        }
        showingExportError = true
    }
}

enum AudioExportError: LocalizedError {
    case fileNotFound
    case invalidFileName
    case exportFailed(String)

    var errorDescription: String? {
        switch self {
        case .fileNotFound:
            return "Audio file not found. Please play the story to generate audio."
        case .invalidFileName:
            return "Invalid file name. Please try again."
        case .exportFailed(let reason):
            return "Export failed: \(reason)"
        }
    }
}

// MARK: - Enhanced ShareSheet for iOS
struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )

        // Configure for iPad
        if let popover = controller.popoverPresentationController {
            popover.sourceView = context.coordinator.sourceView
            popover.sourceRect = CGRect(x: context.coordinator.sourceView.bounds.midX,
                                       y: context.coordinator.sourceView.bounds.midY,
                                       width: 0, height: 0)
            popover.permittedArrowDirections = []
        }

        // Exclude irrelevant activities
        controller.excludedActivityTypes = [
            .assignToContact,
            .addToReadingList,
            .openInIBooks,
            .postToWeibo,
            .postToVimeo,
            .postToTencentWeibo
        ]

        // Set completion handler
        controller.completionWithItemsHandler = { _, completed, _, _ in
            if completed {
                // Clean up temp file after successful share
                if let url = activityItems.first as? URL {
                    try? FileManager.default.removeItem(at: url)
                }
            }
        }

        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator {
        let sourceView = UIView()
    }
}

#Preview {
    let story = Story(
        title: "Luna's Magical Adventure",
        content: "Once upon a time in a magical forest, Luna the brave and magical hero discovered a secret that would change everything...",
        event: .bedtime,
        hero: Hero(name: "Luna", primaryTrait: .brave, secondaryTrait: .magical)
    )
    
    AudioPlayerView(story: story)
        .modelContainer(for: Story.self, inMemory: true)
}