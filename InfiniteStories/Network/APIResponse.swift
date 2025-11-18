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

    enum CodingKeys: String, CodingKey {
        case data, error, pagination
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.data = try container.decodeIfPresent(T.self, forKey: .data)
        self.error = try container.decodeIfPresent(APIErrorResponse.self, forKey: .error)
        self.pagination = try container.decodeIfPresent(Pagination.self, forKey: .pagination)
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
    let id: UUID
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
    let id: UUID
    let name: String
    let age: Int
    let traits: [String]
    let specialAbilities: [String]?
    let hairColor: String?
    let eyeColor: String?
    let skinTone: String?
    let height: String?
    let avatarUrl: String?
    let avatarGenerationId: String?
    let visualProfile: HeroVisualProfileResponse?
    let createdAt: Date
    let updatedAt: Date
}

/// Hero visual profile response
struct HeroVisualProfileResponse: Decodable {
    let id: UUID
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
    let id: UUID
    let title: String
    let content: String
    let heroId: UUID
    let eventType: String?
    let customEventId: UUID?
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
}

/// Story illustration response
struct StoryIllustrationResponse: Decodable {
    let id: UUID
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
    let id: UUID
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
