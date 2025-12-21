//
//  StoryLibraryViewModel.swift
//  InfiniteStories
//
//  Created by Captain Dev on 22/12/2025.
//
//  Extracted from StoryViewModel as part of ViewModel architecture refactoring.
//  Handles library management, filtering, and CRUD operations.
//

import Foundation
import SwiftUI

/// ViewModel for managing the story library
@Observable
@MainActor
final class StoryLibraryViewModel {

    // MARK: - Library State

    /// All stories fetched from the API
    var stories: [Story] = []

    /// All heroes fetched from the API
    var heroes: [Hero] = []

    /// Whether data is currently loading
    var isLoading = false

    /// Error message if loading fails
    var error: String?

    /// Currently selected hero for filtering
    var selectedHero: Hero?

    /// Search text for filtering stories
    var searchText: String = ""

    // MARK: - Computed Properties

    /// Stories filtered by search text and selected hero
    var filteredStories: [Story] {
        var result = stories

        // Filter by hero if selected
        if let hero = selectedHero {
            result = result.filter { $0.hero?.id == hero.id }
        }

        // Filter by search text
        if !searchText.isEmpty {
            result = result.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.content.localizedCaseInsensitiveContains(searchText)
            }
        }

        return result
    }

    /// Stories that haven't been played yet
    var newStories: [Story] {
        stories.filter { $0.playCount == 0 }
    }

    /// Stories that have been played 1-2 times (in progress)
    var inProgressStories: [Story] {
        stories.filter { $0.playCount > 0 && $0.playCount < 3 }
    }

    /// Stories that have been played 3+ times
    var completedStories: [Story] {
        stories.filter { $0.playCount >= 3 }
    }

    /// Favorite stories
    var favoriteStories: [Story] {
        stories.filter { $0.isFavorite }
    }

    // MARK: - Private Properties

    private let storyRepository: StoryRepositoryProtocol
    private let heroRepository: HeroRepositoryProtocol

    // MARK: - Initialization

    /// Convenience initializer with default implementations
    convenience init() {
        self.init(
            storyRepository: StoryRepository(),
            heroRepository: HeroRepository()
        )
    }

    /// Full initializer for dependency injection
    init(
        storyRepository: StoryRepositoryProtocol,
        heroRepository: HeroRepositoryProtocol
    ) {
        self.storyRepository = storyRepository
        self.heroRepository = heroRepository
    }

    // MARK: - Loading

    /// Load all content (stories and heroes) from the API
    func loadContent() async {
        guard NetworkMonitor.shared.isConnected else {
            error = "Network unavailable. Please check your internet connection."
            return
        }

        isLoading = true
        error = nil

        do {
            // Fetch heroes first to match with stories
            heroes = try await heroRepository.fetchHeroes()
            Logger.ui.info("Loaded \(heroes.count) heroes for story matching")

            // Fetch stories using protocol method
            stories = try await storyRepository.fetchStories(heroId: nil, limit: 100, offset: 0)

            // Match heroes to stories by backend ID
            for story in stories {
                if let heroBackendId = story.hero?.backendId {
                    if let matchedHero = heroes.first(where: { $0.backendId == heroBackendId }) {
                        story.hero = matchedHero
                    }
                }
            }

            Logger.ui.success("Loaded \(stories.count) stories")
        } catch {
            self.error = "Failed to load content: \(error.localizedDescription)"
            Logger.ui.error("Failed to load content: \(error.localizedDescription)")
        }

        isLoading = false
    }

    /// Refresh content (pull-to-refresh)
    func refresh() async {
        await loadContent()
    }

    // MARK: - Filtering

    /// Filter stories by a specific hero
    func filterByHero(_ hero: Hero) {
        selectedHero = hero
    }

    /// Clear the hero filter
    func clearFilter() {
        selectedHero = nil
    }

    /// Clear the search text
    func clearSearch() {
        searchText = ""
    }

    // MARK: - Story Operations

    /// Delete a story with cleanup
    func deleteStory(_ story: Story) async {
        do {
            guard let storyBackendId = story.backendId else {
                throw NSError(domain: "StoryLibraryViewModel", code: -1,
                              userInfo: [NSLocalizedDescriptionKey: "Story has no backend ID"])
            }
            try await storyRepository.deleteStory(id: storyBackendId)

            // Remove from local array
            stories.removeAll { $0.id == story.id }

            print("📱 🗑 Story deleted: \(story.title)")
            Logger.ui.success("Deleted story: \(story.title)")
        } catch {
            self.error = "Failed to delete story: \(error.localizedDescription)"
            print("📱 ❌ Failed to delete story: \(error)")
            Logger.ui.error("Failed to delete story: \(error.localizedDescription)")
        }
    }

    /// Delete multiple stories
    func deleteStories(_ storiesToDelete: [Story]) async {
        for story in storiesToDelete {
            await deleteStory(story)
        }
    }

    /// Toggle favorite status for a story
    func toggleFavorite(_ story: Story) async {
        do {
            guard let backendId = story.backendId else {
                Logger.ui.error("Story has no backend ID")
                return
            }
            let newFavoriteState = !story.isFavorite
            _ = try await storyRepository.updateStory(id: backendId, title: nil, content: nil, isFavorite: newFavoriteState)

            // Update local state
            if let index = stories.firstIndex(where: { $0.id == story.id }) {
                stories[index].isFavorite = newFavoriteState
            }
            Logger.ui.success("Updated favorite status")
        } catch {
            self.error = "Failed to update favorite: \(error.localizedDescription)"
            Logger.ui.error("Failed to update favorite: \(error.localizedDescription)")
        }
    }

    /// Clear any error
    func clearError() {
        error = nil
    }

    // MARK: - Helper Methods

    /// Check if there are retryable failed illustrations for a story
    func hasRetryableFailedIllustrations(_ story: Story) -> Bool {
        return story.illustrations.contains { $0.isPlaceholder && !$0.hasReachedRetryLimit }
    }

    /// Get count of failed illustrations for a story
    func failedIllustrationCount(for story: Story) -> Int {
        return story.illustrations.filter { $0.isPlaceholder }.count
    }
}
