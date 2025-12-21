//
//  ViewModelFactory.swift
//  InfiniteStories
//
//  Created by Captain Dev on 22/12/2025.
//
//  Central factory for creating and caching ViewModels.
//  Provides dependency injection and shared instance management.
//

import Foundation
import SwiftUI

/// Factory for creating and managing ViewModel instances
@Observable
@MainActor
final class ViewModelFactory {

    // MARK: - Shared Instances (Singletons)

    /// Shared app settings (persisted via UserDefaults)
    let appSettings: AppSettings

    /// Audio playback ViewModel (single instance for app-wide playback)
    let audioPlaybackViewModel: AudioPlaybackViewModel

    // MARK: - Private Dependencies

    private let storyRepository: StoryRepositoryProtocol
    private let heroRepository: HeroRepositoryProtocol
    private let audioService: AudioServiceProtocol

    // MARK: - Initialization

    /// Convenience initializer using default implementations
    convenience init() {
        let storyRepo = StoryRepository()
        let heroRepo = HeroRepository()
        let audio = AudioService()
        self.init(
            storyRepository: storyRepo,
            heroRepository: heroRepo,
            audioService: audio
        )
    }

    /// Full initializer for dependency injection
    init(
        storyRepository: StoryRepositoryProtocol,
        heroRepository: HeroRepositoryProtocol,
        audioService: AudioServiceProtocol
    ) {
        self.storyRepository = storyRepository
        self.heroRepository = heroRepository
        self.audioService = audioService

        // Initialize shared instances
        self.appSettings = AppSettings()
        self.audioPlaybackViewModel = AudioPlaybackViewModel(
            audioService: audioService,
            storyRepository: storyRepository
        )
    }

    // MARK: - Factory Methods

    /// Create a new StoryGenerationViewModel
    /// - Returns: A fresh instance for story generation flow
    func makeStoryGenerationViewModel() -> StoryGenerationViewModel {
        return StoryGenerationViewModel(storyRepository: storyRepository)
    }

    /// Create a new StoryLibraryViewModel
    /// - Returns: A fresh instance for library management
    func makeStoryLibraryViewModel() -> StoryLibraryViewModel {
        return StoryLibraryViewModel(
            storyRepository: storyRepository,
            heroRepository: heroRepository
        )
    }

    // MARK: - Convenience Methods

    /// Get the shared audio playback ViewModel
    /// Use this when you need consistent playback state across views
    var sharedAudioPlayback: AudioPlaybackViewModel {
        return audioPlaybackViewModel
    }

    /// Get the shared app settings
    var sharedAppSettings: AppSettings {
        return appSettings
    }
}

// MARK: - Environment Key

private struct ViewModelFactoryKey: EnvironmentKey {
    @MainActor static var defaultValue: ViewModelFactory {
        ViewModelFactory()
    }
}

extension EnvironmentValues {
    /// Access the ViewModelFactory through the environment
    var viewModelFactory: ViewModelFactory {
        get { self[ViewModelFactoryKey.self] }
        set { self[ViewModelFactoryKey.self] = newValue }
    }
}

// MARK: - View Extensions

extension View {
    /// Inject a ViewModelFactory into the environment
    func viewModelFactory(_ factory: ViewModelFactory) -> some View {
        environment(\.viewModelFactory, factory)
    }
}
