//
//  StoryViewModel.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import Foundation
import SwiftData
import Combine
import BackgroundTasks
import UIKit

@MainActor
class StoryViewModel: ObservableObject {
    @Published var isGeneratingStory = false
    @Published var isGeneratingAudio = false
    @Published var generationError: String?
    @Published var selectedEvent: StoryEvent = .bedtime

    // Audio generation progress tracking
    @Published var audioGenerationProgress: Double = 0.0
    @Published var audioGenerationStage: String = ""
    @Published var currentAudioTask: URLSessionDataTask?

    // Audio playback state
    @Published var isPlaying = false
    @Published var isPaused = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var playbackSpeed: Float = 1.0

    // Story navigation
    @Published var currentStoryIndex: Int = 0
    @Published var storyQueue: [Story] = []
    @Published var isQueueMode: Bool = false
    @Published var currentStory: Story?

    // Timer for updating playback progress
    private var audioUpdateTimer: Timer?

    private var aiService: AIServiceProtocol
    private let audioService: AudioServiceProtocol
    private var modelContext: ModelContext?
    private let appSettings = AppSettings()
    
    // Background task support
    private var backgroundTaskId: UIBackgroundTaskIdentifier = .invalid
    private var currentGenerationTask: Task<Void, Never>?
    
    init(audioService: AudioServiceProtocol = AudioService()) {
        self.audioService = audioService

        // Only use real AI service - no mocks
        if appSettings.hasValidAPIKey {
            self.aiService = OpenAIService(apiKey: appSettings.openAIAPIKey)
        } else {
            // Create a placeholder that will show error messages
            self.aiService = OpenAIService(apiKey: "")
        }

        setupBackgroundHandlers()

        // Set navigation delegate if it's the AudioService implementation
        if let audioService = audioService as? AudioService {
            audioService.navigationDelegate = self
        }
    }
    
    func setModelContext(_ context: ModelContext) {
        self.modelContext = context
    }
    
    func refreshAIService() {
        // Update AI service when settings change
        if appSettings.hasValidAPIKey {
            self.aiService = OpenAIService(apiKey: appSettings.openAIAPIKey)
        } else {
            self.aiService = OpenAIService(apiKey: "")
        }
        
        // Set the AI service on the audio service for TTS generation
        audioService.setAIService(self.aiService)
    }
    
    func generateStory(for hero: Hero, event: StoryEvent) async {
        print("📱 === Story Generation Flow Started ===")
        print("📱 Hero: \(hero.name) (\(hero.traitsDescription))")
        print("📱 Event: \(event.rawValue)")
        print("📱 Has API Key: \(appSettings.hasValidAPIKey)")
        
        isGeneratingStory = true
        generationError = nil
        
        // Disable idle timer during story generation
        IdleTimerManager.shared.disableIdleTimer(for: "StoryGeneration")
        
        // Begin background task for story generation
        backgroundTaskId = BackgroundTaskManager.shared.beginBackgroundTask(
            withName: "StoryGeneration",
            expirationHandler: { [weak self] in
                self?.handleBackgroundTaskExpiration()
            }
        )
        
        do {
            let request = StoryGenerationRequest(
                hero: hero,
                event: event,
                targetDuration: 420, // 7 minutes target
                language: appSettings.preferredLanguage
            )
            
            print("📱 🚀 Calling AI service...")
            let response = try await aiService.generateStory(request: request)
            
            print("📱 ✅ AI service returned successfully")
            print("📱 📊 Response - Title: \(response.title)")
            print("📱 📊 Response - Content length: \(response.content.count) characters")
            print("📱 📊 Response - Duration: \(response.estimatedDuration) seconds")
            
            // Create and save the story
            let story = Story(
                title: response.title,
                content: response.content,
                event: event,
                hero: hero
            )
            story.estimatedDuration = response.estimatedDuration
            
            print("📱 💾 Saving story to SwiftData...")
            modelContext?.insert(story)
            try modelContext?.save()
            print("📱 ✅ Story saved successfully")
            
            // Generate audio file
            print("📱 🎵 Starting audio generation...")
            await generateAudioForStory(story)
            
        } catch {
            print("📱 ❌ Story generation failed: \(error)")
            generationError = handleAIError(error)
        }
        
        isGeneratingStory = false
        
        // Re-enable idle timer after generation
        IdleTimerManager.shared.enableIdleTimer(for: "StoryGeneration")
        
        // End background task
        if backgroundTaskId != .invalid {
            BackgroundTaskManager.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
        }
        
        print("📱 === Story Generation Flow Completed ===")
        print("📱 Final state - Error: \(generationError ?? "None")")
    }
    
    func generateStory(for hero: Hero, customEvent: CustomStoryEvent) async {
        print("📱 === Custom Story Generation Flow Started ===")
        print("📱 Hero: \(hero.name) (\(hero.traitsDescription))")
        print("📱 Custom Event: \(customEvent.title)")
        print("📱 Has API Key: \(appSettings.hasValidAPIKey)")
        
        isGeneratingStory = true
        generationError = nil
        
        // Disable idle timer during story generation
        IdleTimerManager.shared.disableIdleTimer(for: "StoryGeneration")
        
        // Begin background task for story generation
        backgroundTaskId = BackgroundTaskManager.shared.beginBackgroundTask(
            withName: "StoryGeneration",
            expirationHandler: { [weak self] in
                self?.handleBackgroundTaskExpiration()
            }
        )
        
        do {
            // Create a custom request for the custom event
            let request = CustomStoryGenerationRequest(
                hero: hero,
                customEvent: customEvent,
                targetDuration: 420, // 7 minutes target
                language: appSettings.preferredLanguage
            )
            
            print("📱 🚀 Calling AI service with custom event...")
            let response = try await aiService.generateStoryWithCustomEvent(request: request)
            
            print("📱 ✅ AI service returned successfully")
            print("📱 📊 Response - Title: \(response.title)")
            print("📱 📊 Response - Content length: \(response.content.count) characters")
            print("📱 📊 Response - Duration: \(response.estimatedDuration) seconds")
            
            // Create and save the story with custom event
            let story = Story(
                title: response.title,
                content: response.content,
                customEvent: customEvent,
                hero: hero
            )
            story.estimatedDuration = response.estimatedDuration
            
            print("📱 💾 Saving custom story to SwiftData...")
            modelContext?.insert(story)
            try modelContext?.save()
            print("📱 ✅ Custom story saved successfully")
            
            // Generate audio file
            print("📱 🎵 Starting audio generation...")
            await generateAudioForStory(story)
            
        } catch {
            print("📱 ❌ Custom story generation failed: \(error)")
            generationError = handleAIError(error)
        }
        
        isGeneratingStory = false
        
        // Re-enable idle timer after generation
        IdleTimerManager.shared.enableIdleTimer(for: "StoryGeneration")
        
        // End background task
        if backgroundTaskId != .invalid {
            BackgroundTaskManager.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
        }
        
        print("📱 === Custom Story Generation Flow Completed ===")
        print("📱 Final state - Error: \(generationError ?? "None")")
    }
    
    private func generateAudioForStory(_ story: Story) async {
        print("📱 🎵 === Audio Generation Started ===")
        isGeneratingAudio = true
        
        // Disable idle timer during audio generation
        IdleTimerManager.shared.disableIdleTimer(for: "AudioGeneration")
        
        do {
            let fileName = "story_\(story.createdAt.timeIntervalSince1970)"
            print("📱 🎵 Generating audio file: \(fileName)")
            
            // Get the preferred voice from settings, default to "nova" (great for children)
            let preferredVoice = appSettings.preferredVoice
            
            let audioURL = try await audioService.generateAudioFile(
                from: story.content,
                fileName: fileName,
                voice: preferredVoice,
                language: appSettings.preferredLanguage
            )
            
            print("📱 🎵 ✅ Audio file generated at: \(audioURL.path)")
            
            // Save the audio file reference
            story.audioFileName = audioURL.lastPathComponent
            try modelContext?.save()
            
            print("📱 🎵 ✅ Audio reference saved to story")
            
        } catch {
            print("📱 🎵 ❌ Audio generation failed: \(error.localizedDescription)")
            // Story is still saved even if audio generation fails
        }
        
        isGeneratingAudio = false
        
        // Re-enable idle timer after audio generation
        IdleTimerManager.shared.enableIdleTimer(for: "AudioGeneration")
        
        print("📱 🎵 === Audio Generation Completed ===")
    }
    
    func playStory(_ story: Story) {
        print("📱 🎵 === Audio Playback Started ===")
        print("📱 🎵 Story: \(story.title)")

        // Update current story
        currentStory = story

        // Check if audio needs regeneration first
        if story.audioNeedsRegeneration {
            print("📱 🎵 Audio needs regeneration after text edit...")
            Task {
                await regenerateAudioForStory(story)
                if let updatedFileName = story.audioFileName {
                    print("📱 🎵 Audio regenerated, starting playback...")
                    playAudioFile(fileName: updatedFileName, story: story)
                    story.incrementPlayCount()
                    try? modelContext?.save()
                    startAudioUpdateTimer()
                    updateNowPlayingForStory(story)
                } else {
                    print("📱 🎵 ❌ Failed to regenerate audio file")
                }
            }
            return
        }

        guard let audioFileName = story.audioFileName else {
            print("📱 🎵 No audio file found, generating audio...")
            // Generate audio if it doesn't exist
            Task {
                await generateAudioForStory(story)
                if let updatedFileName = story.audioFileName {
                    print("📱 🎵 Audio generated, starting playback...")
                    playAudioFile(fileName: updatedFileName, story: story)
                    updateNowPlayingForStory(story)
                } else {
                    print("📱 🎵 ❌ Failed to generate audio file")
                }
            }
            return
        }

        print("📱 🎵 Playing existing audio file: \(audioFileName)")
        playAudioFile(fileName: audioFileName, story: story)
        story.incrementPlayCount()

        print("📱 🎵 Incremented play count to: \(story.playCount)")
        try? modelContext?.save()
        print("📱 🎵 Saved play count to database")

        // Update Now Playing info
        updateNowPlayingForStory(story)

        // Start the timer to update audio state
        startAudioUpdateTimer()
    }
    
    private func playAudioFile(fileName: String, story: Story? = nil) {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioURL = documentsPath.appendingPathComponent(fileName)

        print("📱 🎵 Attempting to play audio from: \(audioURL.path)")
        print("📱 🎵 File exists: \(FileManager.default.fileExists(atPath: audioURL.path))")

        do {
            // Create metadata if story is provided
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
            generationError = "Failed to play audio file. Please regenerate the audio."
        }
    }
    
    
    func stopAudio() {
        audioService.stopAudio()
        updateAudioState()
        stopAudioUpdateTimer()
    }
    
    func pauseAudio() {
        audioService.pauseAudio()
        updateAudioState()
        stopAudioUpdateTimer()
    }
    
    func resumeAudio() {
        audioService.resumeAudio()
        updateAudioState()
        startAudioUpdateTimer()
    }
    
    func seek(to time: TimeInterval) {
        audioService.seek(to: time)
        updateAudioState()
    }
    
    func togglePlayPause() {
        if isPlaying {
            pauseAudio()
        } else if isPaused {
            resumeAudio()
        }
        // If neither playing nor paused, do nothing (need to call playStory first)
    }
    
    func skipForward(_ seconds: TimeInterval = 15) {
        let newTime = min(currentTime + seconds, duration)
        seek(to: newTime)
    }
    
    func skipBackward(_ seconds: TimeInterval = 15) {
        let newTime = max(currentTime - seconds, 0)
        seek(to: newTime)
    }
    
    func setPlaybackSpeed(_ speed: Float) {
        playbackSpeed = speed
        audioService.setPlaybackSpeed(speed)
    }
    
    
    private func updateAudioState() {
        isPlaying = audioService.isPlaying
        currentTime = audioService.currentTime
        duration = audioService.duration
        
        // Calculate pause state: we have content (duration > 0) but not currently playing
        isPaused = duration > 0 && !isPlaying && currentTime > 0
    }
    
    private func startAudioUpdateTimer() {
        // Stop any existing timer
        stopAudioUpdateTimer()
        
        // Create a new timer that updates every 0.1 seconds
        audioUpdateTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            Task { @MainActor in
                self.updateAudioState()
                
                // Stop timer if audio is no longer playing
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
    
    private func handleAIError(_ error: Error) -> String {
        if let aiError = error as? AIServiceError {
            switch aiError {
            case .invalidAPIKey:
                return "Please configure your OpenAI API key in settings"
            case .networkError:
                return "Network error. Please check your internet connection"
            case .invalidResponse:
                return "Received invalid response from AI service"
            case .apiError(let message):
                return "API Error: \(message)"
            case .rateLimitExceeded:
                return "Rate limit exceeded. Please try again later"
            case .imageGenerationFailed:
                return "Failed to generate image. Please try again"
            case .fileSystemError:
                return "Failed to save file. Please check storage permissions"
            }
        } else {
            return "An unexpected error occurred: \(error.localizedDescription)"
        }
    }
    
    func clearError() {
        generationError = nil
    }
    
    // MARK: - Story Management
    
    func deleteStoryWithCleanup(_ story: Story) {
        // Delete audio file if it exists
        if let audioFileName = story.audioFileName {
            deleteAudioFile(fileName: audioFileName)
        }
        
        // Delete the story from database
        modelContext?.delete(story)
        try? modelContext?.save()
        
        print("📱 🗑 Story deleted: \(story.title)")
    }
    
    private func deleteAudioFile(fileName: String) {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioURL = documentsPath.appendingPathComponent(fileName)
        
        do {
            if FileManager.default.fileExists(atPath: audioURL.path) {
                try FileManager.default.removeItem(at: audioURL)
                print("📱 🗑 Deleted audio file: \(fileName)")
            }
        } catch {
            print("📱 ❌ Failed to delete audio file: \(error)")
        }
    }
    
    func regenerateAudioForStory(_ story: Story, withProgress: Bool = false) async {
        print("📱 🔄 Regenerating audio for story: \(story.title)")

        if withProgress {
            audioGenerationProgress = 0.0
            audioGenerationStage = "Preparing story..."
        }

        // Delete old audio file if it exists
        if let oldAudioFileName = story.audioFileName {
            deleteAudioFile(fileName: oldAudioFileName)
            story.audioFileName = nil
        }

        // Clear the regeneration flag
        story.clearAudioRegenerationFlag()

        if withProgress {
            audioGenerationProgress = 0.2
            audioGenerationStage = "Generating audio with OpenAI..."
        }

        // Generate new audio
        await generateAudioForStory(story)

        if withProgress {
            audioGenerationProgress = 1.0
            audioGenerationStage = "Complete!"
        }
    }

    func cancelAudioGeneration() {
        print("📱 ❌ Cancelling audio generation")
        currentAudioTask?.cancel()
        currentAudioTask = nil
        isGeneratingAudio = false
        audioGenerationProgress = 0.0
        audioGenerationStage = ""

        // Re-enable idle timer
        IdleTimerManager.shared.enableIdleTimer(for: "AudioGeneration")
    }
    
    func checkAndRegenerateAudioIfNeeded(_ story: Story) {
        if story.audioNeedsRegeneration {
            Task {
                await regenerateAudioForStory(story)
            }
        }
    }
    
    // MARK: - Background Task Support
    
    private func setupBackgroundHandlers() {
        // Listen for app lifecycle events
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
        
        // Listen for background task resume notifications
        // Background task notifications are for scheduled tasks, not immediate continuation
        // We use UIBackgroundTask for immediate background continuation instead
        // NotificationCenter.default.addObserver(
        //     self,
        //     selector: #selector(resumeStoryGeneration(_:)),
        //     name: .resumeStoryGeneration,
        //     object: nil
        // )
        
        // NotificationCenter.default.addObserver(
        //     self,
        //     selector: #selector(resumeAudioProcessing(_:)),
        //     name: .resumeAudioProcessing,
        //     object: nil
        // )
    }
    
    @objc private func appDidEnterBackground() {
        if isGeneratingStory || isGeneratingAudio {
            print("📱 App entering background during generation, using background task")
            // Don't schedule BGProcessingTask for immediate continuation
            // The UIBackgroundTask is already handled in generateStory/generateAudio
        }
    }
    
    @objc private func appWillEnterForeground() {
        print("📱 App entering foreground")
        // Resume any paused operations if needed
    }
    
    @objc private func resumeStoryGeneration(_ notification: Notification) {
        guard let bgTask = notification.userInfo?["backgroundTask"] as? BGProcessingTask else { return }
        
        print("📱 Resuming story generation from background task")
        
        // Continue story generation if it was interrupted
        if isGeneratingStory {
            bgTask.setTaskCompleted(success: true)
        } else {
            bgTask.setTaskCompleted(success: false)
        }
    }
    
    @objc private func resumeAudioProcessing(_ notification: Notification) {
        guard let bgTask = notification.userInfo?["backgroundTask"] as? BGProcessingTask else { return }
        
        print("📱 Resuming audio processing from background task")
        
        // Continue audio generation if it was interrupted
        if isGeneratingAudio {
            bgTask.setTaskCompleted(success: true)
        } else {
            bgTask.setTaskCompleted(success: false)
        }
    }
    
    private func handleBackgroundTaskExpiration() {
        print("📱 ⚠️ Background task is about to expire")
        
        // Cancel current generation task if needed
        currentGenerationTask?.cancel()
        
        // Save state for resumption
        // You could save partial progress here if needed
        
        // Re-enable idle timer
        IdleTimerManager.shared.enableIdleTimer(for: "StoryGeneration")
        IdleTimerManager.shared.enableIdleTimer(for: "AudioGeneration")
    }
    
    // MARK: - Story Queue Management

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

    func clearQueue() {
        storyQueue = []
        currentStoryIndex = 0
        isQueueMode = false
        currentStory = nil
    }

    private func updateNowPlayingForStory(_ story: Story) {
        // Create artwork from hero avatar or default image
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
        // Create a simple artwork image with story info
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

    deinit {
        NotificationCenter.default.removeObserver(self)

        // Ensure idle timer is re-enabled
        IdleTimerManager.shared.enableIdleTimer(for: "StoryGeneration")
        IdleTimerManager.shared.enableIdleTimer(for: "AudioGeneration")
    }
}

// MARK: - AudioNavigationDelegate

extension StoryViewModel: AudioNavigationDelegate {
    func playNextStory() {
        guard isQueueMode,
              currentStoryIndex < storyQueue.count - 1 else {
            return
        }

        currentStoryIndex += 1
        let nextStory = storyQueue[currentStoryIndex]
        currentStory = nextStory

        // Stop current playback
        stopAudio()

        // Play next story
        playStory(nextStory)

        // Update Now Playing info
        updateNowPlayingForStory(nextStory)
    }

    func playPreviousStory() {
        guard isQueueMode else {
            // If not in queue mode, restart current story
            seek(to: 0)
            return
        }

        // If within first 3 seconds, go to previous story
        if currentTime < 3.0 && currentStoryIndex > 0 {
            currentStoryIndex -= 1
            let previousStory = storyQueue[currentStoryIndex]
            currentStory = previousStory

            stopAudio()
            playStory(previousStory)
            updateNowPlayingForStory(previousStory)
        } else {
            // Otherwise, restart current story
            seek(to: 0)
        }
    }
}

// Settings for AI service configuration
class AppSettings: ObservableObject {
    private let keychainHelper = KeychainHelper.shared
    private let apiKeyIdentifier = "com.infinitestories.openai.apikey"
    
    @Published var openAIAPIKey: String {
        didSet {
            if openAIAPIKey.isEmpty {
                _ = keychainHelper.delete(key: apiKeyIdentifier)
            } else {
                _ = keychainHelper.saveString(openAIAPIKey, for: apiKeyIdentifier)
            }
        }
    }
    
    @Published var preferredVoice: String {
        didSet {
            UserDefaults.standard.set(preferredVoice, forKey: "preferredVoice")
        }
    }
    
    @Published var defaultStoryLength: Int {
        didSet {
            UserDefaults.standard.set(defaultStoryLength, forKey: "defaultStoryLength")
        }
    }
    
    @Published var preferredLanguage: String {
        didSet {
            UserDefaults.standard.set(preferredLanguage, forKey: "preferredLanguage")
        }
    }
    
    init() {
        // Load API key from Keychain (secure storage)
        self.openAIAPIKey = keychainHelper.loadString(key: apiKeyIdentifier) ?? ""
        
        // Load other settings from UserDefaults
        self.preferredVoice = UserDefaults.standard.string(forKey: "preferredVoice") ?? "coral"
        self.defaultStoryLength = UserDefaults.standard.integer(forKey: "defaultStoryLength") == 0 ? 7 : UserDefaults.standard.integer(forKey: "defaultStoryLength")
        
        // Load language setting with system language as default
        let systemLanguage = Locale.current.language.languageCode?.identifier ?? "en"
        let defaultLanguage = Self.languageCodeToSupported(systemLanguage)
        self.preferredLanguage = UserDefaults.standard.string(forKey: "preferredLanguage") ?? defaultLanguage
    }
    
    var hasValidAPIKey: Bool {
        return !openAIAPIKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    // Available OpenAI voices for TTS (optimized for children's bedtime stories)
    static let availableVoices: [(id: String, name: String, description: String)] = [
        ("coral", "Coral", "Warm and nurturing - ideal for bedtime"),
        ("nova", "Nova", "Friendly and cheerful - captivating for young listeners"),
        ("fable", "Fable", "Wise and comforting - like a loving grandparent"),
        ("alloy", "Alloy", "Clear and pleasant - perfect for educational stories"),
        ("echo", "Echo", "Soft and dreamy - creates magical atmosphere"),
        ("onyx", "Onyx", "Deep and reassuring - protective parent voice"),
        ("shimmer", "Shimmer", "Bright and melodic - sparkles with imagination")
    ]
    
    // Available languages for story generation
    static let availableLanguages: [(id: String, name: String, nativeName: String)] = [
        ("English", "English", "English"),
        ("Spanish", "Spanish", "Español"),
        ("French", "French", "Français"),
        ("German", "German", "Deutsch"),
        ("Italian", "Italian", "Italiano")
    ]
    
    // Helper method to map system language code to supported language
    static func languageCodeToSupported(_ code: String) -> String {
        switch code {
        case "es": return "Spanish"
        case "fr": return "French"
        case "de": return "German"
        case "it": return "Italian"
        case "en": return "English"
        default: return "English"  // Default to English for unsupported languages
        }
    }
}
