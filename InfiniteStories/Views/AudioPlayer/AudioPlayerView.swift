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
    let story: Story
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    
    @StateObject private var viewModel = StoryViewModel()
    @State private var showingFullText = false
    @State private var showingEditView = false
    @State private var showingShareSheet = false
    @State private var audioFileURL: URL?
    @State private var showingExportError = false
    @State private var exportErrorMessage = ""
    
    // Animation states
    @State private var playButtonPressed = false
    @State private var skipForwardPressed = false
    @State private var skipBackwardPressed = false
    
    var body: some View {
        if story.title.isEmpty && story.content.isEmpty {
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
                    
                    Text(story.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                    
                    if let hero = story.hero {
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
                        if !story.content.isEmpty {
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
                            if story.content.isEmpty {
                                Text("No story content available")
                                    .font(.body)
                                    .italic()
                                    .foregroundColor(.secondary)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            } else {
                                Text(story.content)
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
                    if !showingFullText && !story.content.isEmpty {
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
                if !story.content.isEmpty {
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
                    HStack(spacing: 25) {
                        // Skip Backward 15s
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.1)) {
                                viewModel.skipBackward()
                            }
                        }) {
                            Image(systemName: "gobackward.15")
                                .font(.system(size: 28))
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
                                    viewModel.playStory(story)
                                }
                            }
                        }) {
                            Image(systemName: playButtonIcon)
                                .font(.system(size: 64))
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
                                .font(.system(size: 28))
                                .foregroundColor(.orange)
                        }
                        .scaleEffect(skipForwardPressed ? 0.9 : 1.0)
                        .disabled(viewModel.duration == 0)
                        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
                            withAnimation(.easeInOut(duration: 0.1)) {
                                skipForwardPressed = pressing
                            }
                        }, perform: {})
                    }
                    .padding(.horizontal, 40)
                    
                    // Secondary Controls
                    HStack(spacing: 30) {
                        // Audio regeneration indicator
                        if story.audioNeedsRegeneration {
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
                VStack(spacing: 10) {
                    HStack {
                        Text("Created: \(story.formattedDate)")
                        Spacer()
                        Text("Played: \(story.playCount) times")
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                    
                    if story.estimatedDuration > 0 {
                        Text("Estimated duration: \(formatTime(story.estimatedDuration))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
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
                            story.isFavorite.toggle()
                            try? modelContext.save()
                        }) {
                            Image(systemName: story.isFavorite ? "heart.fill" : "heart")
                                .foregroundColor(story.isFavorite ? .red : .secondary)
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
                                .foregroundColor(story.hasAudio ? .blue : .gray)
                        }
                        .disabled(!story.hasAudio && story.audioFileName == nil)
                        .opacity(story.hasAudio || story.audioFileName != nil ? 1.0 : 0.6)
                    }
                }
            }
            .sheet(isPresented: $showingEditView) {
                StoryEditView(story: story)
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
                print("🎵 Story title: '\(story.title)'")
                print("🎵 Story content length: \(story.content.count) characters")
                print("🎵 Story content preview: '\(story.shortContent)'")
                print("🎵 Hero name: '\(story.hero?.name ?? "No hero")'")
                print("🎵 Story created: \(story.formattedDate)")
                print("🎵 Play count: \(story.playCount)")
                print("🎵 Has audio: \(story.hasAudio)")
                print("🎵 ==============================")
                viewModel.setModelContext(modelContext)
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
        story.content.components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .count
    }
    
    private var estimatedReadingTime: Int {
        // Average reading speed is about 200 words per minute
        max(1, (wordCount + 199) / 200)
    }
    
    private func exportAudioFile() {
        guard let audioFileName = story.audioFileName else {
            exportErrorMessage = "This story doesn't have an audio file yet. Please play the story first to generate audio."
            showingExportError = true
            return
        }
        
        let fileManager = FileManager.default
        guard let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            exportErrorMessage = "Unable to access the documents directory. Please try again."
            showingExportError = true
            return
        }
        
        // Audio files are stored directly in the documents directory, not in a subdirectory
        let audioPath = documentsPath.appendingPathComponent(audioFileName)
        
        print("🎵 Export: Looking for audio file at: \(audioPath.path)")
        print("🎵 Export: File exists: \(fileManager.fileExists(atPath: audioPath.path))")
        
        // Check if file exists at the expected path
        if fileManager.fileExists(atPath: audioPath.path) {
            // Create a temporary copy with a user-friendly name
            let tempDirectory = fileManager.temporaryDirectory
            // Clean the title for filename (remove special characters)
            let cleanedTitle = story.title
                .replacingOccurrences(of: "/", with: "-")
                .replacingOccurrences(of: "\\", with: "-")
                .replacingOccurrences(of: ":", with: "-")
                .replacingOccurrences(of: "*", with: "-")
                .replacingOccurrences(of: "?", with: "-")
                .replacingOccurrences(of: "\"", with: "-")
                .replacingOccurrences(of: "<", with: "-")
                .replacingOccurrences(of: ">", with: "-")
                .replacingOccurrences(of: "|", with: "-")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            
            let exportFileName = "\(cleanedTitle).mp3"
            let tempFileURL = tempDirectory.appendingPathComponent(exportFileName)
            
            do {
                // Remove any existing temp file
                if fileManager.fileExists(atPath: tempFileURL.path) {
                    try fileManager.removeItem(at: tempFileURL)
                }
                
                // Copy the audio file to temp location with friendly name
                try fileManager.copyItem(at: audioPath, to: tempFileURL)
                
                print("🎵 Export: Successfully prepared audio file for sharing")
                print("🎵 Export: Temp file: \(tempFileURL.path)")
                
                // Set the URL for sharing
                audioFileURL = tempFileURL
                showingShareSheet = true
            } catch {
                print("🎵 Export: Error preparing audio for export: \(error)")
                exportErrorMessage = "Unable to prepare the audio file for sharing. Error: \(error.localizedDescription)"
                showingExportError = true
            }
        } else {
            print("🎵 Export: Audio file not found at: \(audioPath.path)")
            print("🎵 Export: Available files in documents directory:")
            if let contents = try? fileManager.contentsOfDirectory(at: documentsPath, includingPropertiesForKeys: nil) {
                for file in contents {
                    print("🎵 Export:   - \(file.lastPathComponent)")
                }
            }
            
            // Check if audio needs regeneration
            if story.audioNeedsRegeneration {
                exportErrorMessage = "The audio file needs to be regenerated. Please play the story to generate a new audio file."
            } else {
                exportErrorMessage = "Audio file not found. Please play the story first to generate the audio file."
            }
            showingExportError = true
        }
    }
}

// MARK: - ShareSheet for iOS
struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )
        
        // Exclude some activities that don't make sense for audio files
        controller.excludedActivityTypes = [
            .assignToContact,
            .addToReadingList,
            .openInIBooks
        ]
        
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
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