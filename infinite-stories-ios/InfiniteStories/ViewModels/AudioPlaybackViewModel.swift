//
//  AudioPlaybackViewModel.swift
//  InfiniteStories
//
//  Created by Captain Dev on 22/12/2025.
//
//  Extracted from StoryViewModel as part of ViewModel architecture refactoring.
//  Handles audio playback controls, progress tracking, and queue navigation.
//

import Foundation
import SwiftUI
import UIKit

/// ViewModel for managing audio playback of stories
@Observable
@MainActor
final class AudioPlaybackViewModel {

    // MARK: - Playback State

    /// Whether audio is currently playing
    var isPlaying = false

    /// Whether audio is paused (distinct from stopped)
    var isPaused = false

    /// Current playback position in seconds
    var currentTime: TimeInterval = 0

    /// Total duration of the audio in seconds
    var duration: TimeInterval = 0

    /// Current playback speed multiplier
    var playbackSpeed: Float = 1.0

    // MARK: - Story Queue State

    /// Current story being played
    var currentStory: Story?

    /// Queue of stories for sequential playback
    var storyQueue: [Story] = []

    /// Index of current story in the queue
    var currentStoryIndex: Int = 0

    /// Whether queue mode is active
    var isQueueMode: Bool = false

    // MARK: - Error State

    /// Error message for playback failures
    var playbackError: String?

    // MARK: - Private Properties

    private var audioUpdateTimer: Timer?
    private let audioService: AudioServiceProtocol
    let illustrationSyncManager = IllustrationSyncManager()

    // Repository for audio generation if needed
    private let storyRepository: StoryRepositoryProtocol
    private let appSettings = AppSettings()

    // MARK: - Initialization

    /// Convenience initializer with default implementations
    convenience init() {
        self.init(
            audioService: AudioService(),
            storyRepository: StoryRepository()
        )
    }

    /// Full initializer for dependency injection
    init(
        audioService: AudioServiceProtocol,
        storyRepository: StoryRepositoryProtocol
    ) {
        self.audioService = audioService
        self.storyRepository = storyRepository

        // Set navigation delegate if it's the AudioService implementation
        if let audioService = audioService as? AudioService {
            audioService.navigationDelegate = self
        }
    }

    // MARK: - Playback Controls

    /// Play a story's audio
    func play(story: Story) {
        print("📱 🎵 === Audio Playback Started ===")
        print("📱 🎵 Story: \(story.title)")

        // Force load illustrations relationship (SwiftData lazy loading)
        _ = story.illustrations.count

        // Update current story
        currentStory = story

        // Configure illustration sync if story has illustrations
        if story.hasIllustrations {
            illustrationSyncManager.configure(story: story, audioService: audioService)
        }

        // Check if audio needs regeneration or generation
        guard let audioFileName = story.audioFileName, !story.audioNeedsRegeneration else {
            print("📱 🎵 Audio needs generation or regeneration...")
            Task {
                do {
                    // Generate audio via repository API
                    guard let storyBackendId = story.backendId else {
                        throw NSError(domain: "AudioPlaybackViewModel", code: -1,
                                      userInfo: [NSLocalizedDescriptionKey: "Story has no backend ID"])
                    }

                    let audioUrl = try await storyRepository.generateAudio(
                        storyId: storyBackendId,
                        language: appSettings.preferredLanguage,
                        voice: appSettings.preferredVoice
                    )

                    print("📱 🎵 Audio generated, URL: \(audioUrl)")
                    // Update story with new audio URL
                    story.audioFileName = audioUrl
                    story.clearAudioRegenerationFlag()

                    // Play via URLCache
                    if let url = URL(string: audioUrl) {
                        playAudioFromURL(url, story: story)
                    }
                    story.incrementPlayCount()
                    startAudioUpdateTimer()
                    updateNowPlayingForStory(story)
                    currentStory = story
                } catch {
                    print("📱 🎵 ❌ Audio generation failed: \(error)")
                    playbackError = "Failed to generate audio: \(error.localizedDescription)"
                }
            }
            return
        }

        print("📱 🎵 Playing existing audio file: \(audioFileName)")
        playAudioFile(fileName: audioFileName, story: story)
        story.incrementPlayCount()

        // Update Now Playing info
        updateNowPlayingForStory(story)

        // Start the timer to update audio state
        startAudioUpdateTimer()
    }

    /// Pause audio playback
    func pause() {
        audioService.pauseAudio()
        updateAudioState()
        stopAudioUpdateTimer()
    }

    /// Resume audio playback
    func resume() {
        audioService.resumeAudio()
        updateAudioState()
        startAudioUpdateTimer()
    }

    /// Stop audio playback
    func stop() {
        audioService.stopAudio()
        updateAudioState()
        stopAudioUpdateTimer()
    }

    /// Toggle between play and pause
    func togglePlayPause() {
        if isPlaying {
            pause()
        } else if isPaused {
            resume()
        }
        // If neither playing nor paused, do nothing (need to call play(story:) first)
    }

    /// Seek to a specific time position
    func seek(to time: TimeInterval) {
        audioService.seek(to: time)
        updateAudioState()

        // Update illustration sync when seeking
        if currentStory?.hasIllustrations == true {
            NotificationCenter.default.post(
                name: .audioPlaybackTimeChanged,
                object: nil,
                userInfo: ["time": time]
            )
        }
    }

    /// Skip forward by a number of seconds
    func skipForward(_ seconds: TimeInterval = 15) {
        let newTime = min(currentTime + seconds, duration)
        seek(to: newTime)
    }

    /// Skip backward by a number of seconds
    func skipBackward(_ seconds: TimeInterval = 15) {
        let newTime = max(currentTime - seconds, 0)
        seek(to: newTime)
    }

    /// Set the playback speed
    func setSpeed(_ speed: Float) {
        playbackSpeed = speed
        audioService.setPlaybackSpeed(speed)
    }

    // MARK: - Queue Management

    /// Setup a story queue for sequential playback
    func setupStoryQueue(stories: [Story], startIndex: Int = 0) {
        storyQueue = stories
        currentStoryIndex = startIndex
        isQueueMode = true
        currentStory = stories.isEmpty ? nil : stories[startIndex]

        // Set navigation delegate
        if let audioService = audioService as? AudioService {
            audioService.navigationDelegate = self
        }
    }

    /// Clear the story queue
    func clearQueue() {
        storyQueue = []
        currentStoryIndex = 0
        isQueueMode = false
        currentStory = nil
    }

    // MARK: - Illustration Sync

    /// Seek audio to match an illustration's timestamp
    func seekToIllustration(_ illustration: StoryIllustration) {
        seek(to: illustration.timestamp)
        illustrationSyncManager.moveToIllustration(illustration)
    }

    /// Handle carousel swipe to a specific index
    func onIllustrationCarouselSwipe(to index: Int) {
        illustrationSyncManager.moveToIndex(index)

        // Optionally seek audio to match
        if let illustration = illustrationSyncManager.illustrationForPage(index) {
            seek(to: illustration.timestamp)
        }
    }

    // MARK: - Private Methods

    private func playAudioFile(fileName: String, story: Story? = nil) {
        // Check if fileName is a URL or local file path
        if fileName.starts(with: "http://") || fileName.starts(with: "https://") {
            // It's a URL, play from URLCache
            if let url = URL(string: fileName) {
                playAudioFromURL(url, story: story)
            }
            return
        }

        // It's a local file path
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioURL = documentsPath.appendingPathComponent(fileName)

        print("📱 🎵 Attempting to play audio from: \(audioURL.path)")
        print("📱 🎵 File exists: \(FileManager.default.fileExists(atPath: audioURL.path))")

        do {
            if let story = story {
                let artwork = createArtworkForStory(story)
                let metadata = AudioMetadata(
                    title: story.title,
                    artist: story.hero?.name,
                    artwork: artwork
                )
                try audioService.playAudio(from: audioURL, metadata: metadata)
            } else {
                try audioService.playAudio(from: audioURL)
            }
            updateAudioState()
            startAudioUpdateTimer()
            print("📱 🎵 ✅ Audio playback started successfully")
        } catch {
            print("📱 🎵 ❌ Audio playback failed: \(error.localizedDescription)")
            playbackError = "Failed to play audio file. Please regenerate the audio."
        }
    }

    private func playAudioFromURL(_ url: URL, story: Story? = nil) {
        print("📱 🎵 Attempting to play audio from URL: \(url.absoluteString)")

        do {
            if let story = story {
                let artwork = createArtworkForStory(story)
                let metadata = AudioMetadata(
                    title: story.title,
                    artist: story.hero?.name,
                    artwork: artwork
                )
                try audioService.playAudio(from: url, metadata: metadata)
            } else {
                try audioService.playAudio(from: url)
            }
            updateAudioState()
            startAudioUpdateTimer()
            print("📱 🎵 ✅ Audio playback started successfully")
        } catch {
            print("📱 🎵 ❌ Audio playback failed: \(error.localizedDescription)")
            playbackError = "Failed to play audio. Please check your internet connection."
        }
    }

    private func updateAudioState() {
        isPlaying = audioService.isPlaying
        currentTime = audioService.currentTime
        duration = audioService.duration

        // Calculate pause state: we have content (duration > 0) but not currently playing
        isPaused = duration > 0 && !isPlaying && currentTime > 0

        // Notify illustration sync manager of time updates
        if isPlaying {
            NotificationCenter.default.post(
                name: .audioPlaybackTimeChanged,
                object: nil,
                userInfo: ["time": currentTime]
            )
        }
    }

    private func startAudioUpdateTimer() {
        stopAudioUpdateTimer()

        audioUpdateTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            Task { @MainActor in
                self.updateAudioState()

                if !self.isPlaying {
                    self.stopAudioUpdateTimer()
                }
            }
        }
    }

    private func stopAudioUpdateTimer() {
        audioUpdateTimer?.invalidate()
        audioUpdateTimer = nil
    }

    private func updateNowPlayingForStory(_ story: Story) {
        let artwork = createArtworkForStory(story)

        if let audioService = audioService as? AudioService {
            audioService.updateNowPlayingInfo(
                title: story.title,
                artist: story.hero?.name,
                duration: story.estimatedDuration,
                artwork: artwork
            )
        }
    }

    private func createArtworkForStory(_ story: Story) -> UIImage? {
        let size = CGSize(width: 600, height: 600)
        let renderer = UIGraphicsImageRenderer(size: size)

        return renderer.image { context in
            // Background gradient
            let colors = [UIColor.systemPurple.cgColor, UIColor.systemBlue.cgColor]
            let gradient = CGGradient(
                colorsSpace: CGColorSpaceCreateDeviceRGB(),
                colors: colors as CFArray,
                locations: [0, 1]
            )!

            context.cgContext.drawLinearGradient(
                gradient,
                start: CGPoint.zero,
                end: CGPoint(x: size.width, y: size.height),
                options: []
            )

            // Add story title
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .center

            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 48),
                .foregroundColor: UIColor.white,
                .paragraphStyle: paragraphStyle
            ]

            let titleRect = CGRect(x: 50, y: size.height/2 - 50, width: size.width - 100, height: 100)
            story.title.draw(in: titleRect, withAttributes: attributes)

            // Add hero name if available
            if let heroName = story.hero?.name {
                let heroAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 32),
                    .foregroundColor: UIColor.white.withAlphaComponent(0.8),
                    .paragraphStyle: paragraphStyle
                ]

                let heroRect = CGRect(x: 50, y: size.height/2 + 50, width: size.width - 100, height: 50)
                "Featuring \(heroName)".draw(in: heroRect, withAttributes: heroAttributes)
            }
        }
    }

    /// Clear any playback error
    func clearError() {
        playbackError = nil
    }
}

// MARK: - AudioNavigationDelegate

extension AudioPlaybackViewModel: AudioNavigationDelegate {
    nonisolated func playNextStory() {
        Task { @MainActor in
            guard isQueueMode,
                  currentStoryIndex < storyQueue.count - 1 else {
                return
            }

            currentStoryIndex += 1
            let nextStory = storyQueue[currentStoryIndex]
            // Force load illustrations relationship (SwiftData lazy loading)
            _ = nextStory.illustrations.count
            currentStory = nextStory

            // Stop current playback
            stop()

            // Play next story
            play(story: nextStory)

            // Update Now Playing info
            updateNowPlayingForStory(nextStory)
        }
    }

    nonisolated func playPreviousStory() {
        Task { @MainActor in
            guard isQueueMode else {
                // If not in queue mode, restart current story
                seek(to: 0)
                return
            }

            // If within first 3 seconds, go to previous story
            if currentTime < 3.0 && currentStoryIndex > 0 {
                currentStoryIndex -= 1
                let previousStory = storyQueue[currentStoryIndex]
                // Force load illustrations relationship (SwiftData lazy loading)
                _ = previousStory.illustrations.count
                currentStory = previousStory

                stop()
                play(story: previousStory)
                updateNowPlayingForStory(previousStory)
            } else {
                // Otherwise, restart current story
                seek(to: 0)
            }
        }
    }
}
