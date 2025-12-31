//
//  APIResponse.swift
//  InfiniteStories
//
//  Generic API response wrapper
//

import Foundation

/// Generic API response wrapper
struct APIResponse<T: Decodable>: Decodable {
    let data: T?
    let error: APIErrorResponse?
    let pagination: Pagination?
    let message: String? // Optional success/info message from backend

    enum CodingKeys: String, CodingKey {
        case data, error, pagination, message
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.data = try container.decodeIfPresent(T.self, forKey: .data)
        self.error = try container.decodeIfPresent(APIErrorResponse.self, forKey: .error)
        self.pagination = try container.decodeIfPresent(Pagination.self, forKey: .pagination)
        self.message = try container.decodeIfPresent(String.self, forKey: .message)
    }
}

/// API error response from backend
struct APIErrorResponse: Decodable {
    let code: String
    let message: String
    let details: [String: String]?

    var localizedDescription: String {
        return message
    }
}

/// Pagination metadata
struct Pagination: Decodable {
    let total: Int
    let limit: Int
    let offset: Int
    let hasMore: Bool

    enum CodingKeys: String, CodingKey {
        case total, limit, offset, hasMore
    }
}

/// Empty response for operations that don't return data
struct EmptyResponse: Decodable {
    // Empty struct for DELETE operations
}

// MARK: - Response DTOs

/// Auth response from sign-in/sign-up
struct AuthResponse: Decodable {
    let user: UserResponse
    let session: SessionResponse
}

struct UserResponse: Decodable {
    let id: String  // Backend uses string IDs
    let email: String
    let name: String?
    let createdAt: Date
    let totalStoriesGenerated: Int?
    let totalAudioGenerated: Int?
    let totalIllustrationsGenerated: Int?
}

struct SessionResponse: Decodable {
    let token: String
    let expiresAt: Date
}

/// Hero response from backend
struct HeroResponse: Decodable {
    let id: String  // Backend uses cuid strings, not UUIDs
    let name: String
    let age: Int
    let traits: [String]
    let specialAbilities: [String]?
    let appearance: String?  // Free-form appearance description
    let hairColor: String?
    let eyeColor: String?
    let skinTone: String?
    let height: String?
    let avatarUrl: String?
    let avatarGenerationId: String?
    let visualProfile: HeroVisualProfileResponse?
    let createdAt: Date
    let updatedAt: Date

    // Prisma relation count metadata (ignore during decoding)
    let _count: HeroCountResponse?

    // Additional fields from backend that may not be in the model
    let userId: String?
    let visualProfileId: String?  // Also a string ID from backend
    let avatarPrompt: String?

    // Custom decoder to handle null arrays
    enum CodingKeys: String, CodingKey {
        case id, name, age, traits, specialAbilities, appearance
        case hairColor, eyeColor, skinTone, height
        case avatarUrl, avatarGenerationId, visualProfile
        case createdAt, updatedAt
        case _count, userId, visualProfileId, avatarPrompt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // Decode required fields
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        age = try container.decode(Int.self, forKey: .age)
        traits = try container.decode([String].self, forKey: .traits)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        updatedAt = try container.decode(Date.self, forKey: .updatedAt)

        // Decode optional fields with null handling
        // Handle specialAbilities that might be null or an array
        if container.contains(.specialAbilities) {
            specialAbilities = try container.decodeIfPresent([String].self, forKey: .specialAbilities)
        } else {
            specialAbilities = nil
        }

        appearance = try container.decodeIfPresent(String.self, forKey: .appearance)
        hairColor = try container.decodeIfPresent(String.self, forKey: .hairColor)
        eyeColor = try container.decodeIfPresent(String.self, forKey: .eyeColor)
        skinTone = try container.decodeIfPresent(String.self, forKey: .skinTone)
        height = try container.decodeIfPresent(String.self, forKey: .height)
        avatarUrl = try container.decodeIfPresent(String.self, forKey: .avatarUrl)
        avatarGenerationId = try container.decodeIfPresent(String.self, forKey: .avatarGenerationId)
        visualProfile = try container.decodeIfPresent(HeroVisualProfileResponse.self, forKey: .visualProfile)

        // Decode Prisma metadata
        _count = try container.decodeIfPresent(HeroCountResponse.self, forKey: ._count)

        // Decode additional fields
        userId = try container.decodeIfPresent(String.self, forKey: .userId)
        visualProfileId = try container.decodeIfPresent(String.self, forKey: .visualProfileId)
        avatarPrompt = try container.decodeIfPresent(String.self, forKey: .avatarPrompt)
    }
}

/// Hero count response for Prisma relations
struct HeroCountResponse: Decodable {
    let stories: Int?
}

/// Hero visual profile response
struct HeroVisualProfileResponse: Decodable {
    let id: String?  // Backend uses cuid strings, not UUIDs - can be null
    let hairStyle: String?
    let hairColor: String?
    let eyeColor: String?
    let skinTone: String?
    let artStyle: String?
    let canonicalPrompt: String?
    let simplifiedPrompt: String?
    let colorPalette: [String]?
}

/// Story response from backend
struct StoryResponse: Decodable {
    let id: String  // Backend uses cuid strings, not UUIDs
    let title: String
    let content: String
    let heroId: String  // Also a string ID
    let eventType: String?
    let customEventId: String?  // Also a string ID
    let language: String
    let audioUrl: String?
    let audioGenerationStatus: String
    let audioDuration: Double?
    let illustrationStatus: String
    let illustrationCount: Int
    let illustrations: [StoryIllustrationResponse]?
    let isFavorite: Bool
    let playCount: Int
    let lastPlayedAt: Date?
    let createdAt: Date
    let updatedAt: Date

    // Additional fields from backend that may not be in the model
    let userId: String?
    let eventPromptSeed: String?
    let scenesExtracted: [[String: Any]]?  // JSON array field from backend

    // Prisma relation count metadata (ignore during decoding)
    let _count: StoryCountResponse?

    // Custom coding keys to handle backend field names
    enum CodingKeys: String, CodingKey {
        case id, title, content, heroId, eventType, customEventId, language
        case audioUrl, audioGenerationStatus, audioDuration
        case illustrationStatus, illustrationCount, illustrations
        case isFavorite, playCount, lastPlayedAt
        case createdAt, updatedAt
        case userId, eventPromptSeed, scenesExtracted
        case _count
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // Decode required fields
        id = try container.decode(String.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        content = try container.decode(String.self, forKey: .content)
        heroId = try container.decode(String.self, forKey: .heroId)
        language = try container.decode(String.self, forKey: .language)
        audioGenerationStatus = try container.decode(String.self, forKey: .audioGenerationStatus)
        illustrationStatus = try container.decode(String.self, forKey: .illustrationStatus)
        illustrationCount = try container.decode(Int.self, forKey: .illustrationCount)
        isFavorite = try container.decode(Bool.self, forKey: .isFavorite)
        playCount = try container.decode(Int.self, forKey: .playCount)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        updatedAt = try container.decode(Date.self, forKey: .updatedAt)

        // Decode optional fields
        eventType = try container.decodeIfPresent(String.self, forKey: .eventType)
        customEventId = try container.decodeIfPresent(String.self, forKey: .customEventId)
        audioUrl = try container.decodeIfPresent(String.self, forKey: .audioUrl)
        audioDuration = try container.decodeIfPresent(Double.self, forKey: .audioDuration)
        illustrations = try container.decodeIfPresent([StoryIllustrationResponse].self, forKey: .illustrations)
        lastPlayedAt = try container.decodeIfPresent(Date.self, forKey: .lastPlayedAt)

        // Decode additional backend fields
        userId = try container.decodeIfPresent(String.self, forKey: .userId)
        eventPromptSeed = try container.decodeIfPresent(String.self, forKey: .eventPromptSeed)

        // Decode scenesExtracted as generic array (ignore for now)
        scenesExtracted = nil  // Skip decoding the complex JSON field

        // Decode Prisma metadata
        _count = try container.decodeIfPresent(StoryCountResponse.self, forKey: ._count)
    }
}

/// Story count response for Prisma relations
struct StoryCountResponse: Decodable {
    let illustrations: Int?
}

/// Story illustration response
struct StoryIllustrationResponse: Decodable {
    let id: String  // Backend uses cuid strings, not UUIDs
    let imageUrl: String
    let imagePrompt: String
    let sceneDescription: String
    let displayOrder: Int
    let audioTimestamp: Double
    let audioDuration: Double?
    let generationId: String?
    let previousGenerationId: String?
    let generationStatus: String
    let createdAt: Date
    let updatedAt: Date
}

/// Custom event response
struct CustomEventResponse: Decodable {
    let id: String  // Backend uses cuid strings, not UUIDs
    let title: String
    let description: String
    let promptSeed: String
    let category: String
    let ageRange: String?
    let tone: String
    let pictogramEmoji: String?
    let pictogramSymbols: [String]?
    let aiEnhanced: Bool
    let keywords: [String]?
    let usageCount: Int
    let isFavorite: Bool
    let lastUsedAt: Date?
    let createdAt: Date
    let updatedAt: Date
}

/// User usage statistics
struct UserUsageResponse: Decodable {
    let story_generation: RateLimitInfo
    let audio_generation: RateLimitInfo
    let avatar_generation: RateLimitInfo
    let illustration_generation: RateLimitInfo
}

struct RateLimitInfo: Decodable {
    let limit: Int
    let remaining: Int
    let resetAt: Date
}

// MARK: - Analytics Response DTOs
// NOTE: Analytics DTOs are defined in ReadingJourneyRepository.swift to keep
// domain-specific models with their repository. The types used are:
// - AnalyticsSummary (summary response)
// - ListeningActivityResponse (activity response with ActivityDataPoint array)
// - HeroAnalyticsResponse (hero analytics with HeroAnalytics array)
// - MilestonesResponse (milestones with MilestoneData array and MilestoneSummary)
// - InsightsResponse (insights wrapper with Insights data)
// - ListeningSession (session response from reporting)
