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
    var title: String
    var content: String
    var event: StoryEvent
    var createdAt: Date
    var audioFileName: String?
    var isGenerated: Bool
    var isFavorite: Bool
    var playCount: Int
    var estimatedDuration: TimeInterval
    var audioNeedsRegeneration: Bool = false
    var lastModified: Date = Date()
    
    @Relationship(inverse: \Hero.stories) var hero: Hero?
    
    init(title: String, content: String, event: StoryEvent, hero: Hero) {
        self.title = title
        self.content = content
        self.event = event
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
        return audioFileName != nil
    }
    
    func incrementPlayCount() {
        playCount += 1
    }
}