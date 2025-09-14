//
//  Story.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import Foundation
import SwiftData

@Model
final class Story {
    var title: String {
        didSet {
            // Only mark for regeneration if we already have an audio file
            // This prevents triggering on initial creation
            if audioFileName != nil {
                audioNeedsRegeneration = true
                lastModified = Date()
            }
        }
    }
    
    var content: String {
        didSet {
            // Only mark for regeneration if we already have an audio file
            // This prevents triggering on initial creation
            if audioFileName != nil {
                audioNeedsRegeneration = true
                lastModified = Date()
            }
        }
    }
    
    // Support both built-in and custom events
    var builtInEvent: StoryEvent?
    @Relationship var customEvent: CustomStoryEvent?
    
    var createdAt: Date
    var audioFileName: String?
    var isGenerated: Bool
    var isFavorite: Bool
    var playCount: Int
    var estimatedDuration: TimeInterval
    var audioNeedsRegeneration: Bool
    var lastModified: Date
    
    @Relationship(inverse: \Hero.stories) var hero: Hero?
    
    // Initializer for built-in events
    init(title: String, content: String, event: StoryEvent, hero: Hero) {
        self.title = title
        self.content = content
        self.builtInEvent = event
        self.customEvent = nil
        self.hero = hero
        self.createdAt = Date()
        self.audioFileName = nil
        self.isGenerated = true
        self.isFavorite = false
        self.playCount = 0
        self.estimatedDuration = 0
        self.audioNeedsRegeneration = false
        self.lastModified = Date()
    }
    
    // Initializer for custom events
    init(title: String, content: String, customEvent: CustomStoryEvent, hero: Hero) {
        self.title = title
        self.content = content
        self.builtInEvent = nil
        self.customEvent = customEvent
        self.hero = hero
        self.createdAt = Date()
        self.audioFileName = nil
        self.isGenerated = true
        self.isFavorite = false
        self.playCount = 0
        self.estimatedDuration = 0
        self.audioNeedsRegeneration = false
        self.lastModified = Date()
        
        // Increment usage count for custom event
        customEvent.incrementUsage()
    }
    
    // Computed properties for event access
    var eventTitle: String {
        if let builtIn = builtInEvent {
            return builtIn.rawValue
        } else if let custom = customEvent {
            return custom.title
        }
        return "Unknown Event"
    }
    
    var eventPromptSeed: String {
        if let builtIn = builtInEvent {
            return builtIn.promptSeed
        } else if let custom = customEvent {
            return custom.promptSeed
        }
        return "a magical adventure"
    }
    
    var eventIcon: String {
        if let builtIn = builtInEvent {
            return builtIn.icon
        } else if let custom = customEvent {
            return custom.iconName
        }
        return "star"
    }
    
    var isCustomEvent: Bool {
        return customEvent != nil
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: createdAt)
    }
    
    var shortContent: String {
        let maxLength = 100
        if content.count <= maxLength {
            return content
        }
        let truncated = String(content.prefix(maxLength))
        return truncated + "..."
    }
    
    var hasAudio: Bool {
        return audioFileName != nil && !audioNeedsRegeneration
    }
    
    func incrementPlayCount() {
        playCount += 1
    }
    
    func clearAudioRegenerationFlag() {
        audioNeedsRegeneration = false
    }
}