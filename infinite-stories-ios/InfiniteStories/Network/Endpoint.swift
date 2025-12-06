//
//  Endpoint.swift
//  InfiniteStories
//
//  API endpoint definitions for backend communication
//

import Foundation

enum HTTPMethod: String {
    case GET, POST, PATCH, DELETE, PUT
}

enum Endpoint {
    // MARK: - Authentication
    case signIn(email: String, password: String)
    case signUp(email: String, password: String, name: String?)
    case refreshSession
    case signOut
    case getSession

    // MARK: - Heroes
    case getHeroes(limit: Int, offset: Int, includeStories: Bool)
    case getHero(id: String, includeStories: Bool)
    case createHero(data: HeroCreateRequest)
    case updateHero(id: String, data: HeroUpdateRequest)
    case deleteHero(id: String)
    case generateAvatar(heroId: String, prompt: String)

    // MARK: - Stories
    case getStories(heroId: String?, limit: Int, offset: Int, includeIllustrations: Bool)
    case getStory(id: String, includeIllustrations: Bool)
    case createStory(data: StoryCreateRequest)
    case updateStory(id: String, data: StoryUpdateRequest)
    case deleteStory(id: String)
    case generateAudio(storyId: String, language: String, voice: String)
    case generateIllustrations(storyId: String)
    case getIllustrationStatus(storyId: String)

    // MARK: - Custom Events
    case getCustomEvents(limit: Int, offset: Int)
    case getCustomEvent(id: String)
    case createCustomEvent(data: CustomEventCreateRequest)
    case updateCustomEvent(id: String, data: CustomEventUpdateRequest)
    case deleteCustomEvent(id: String)
    case enhanceCustomEvent(id: String)

    // MARK: - User
    case getUserProfile
    case updateUserProfile(data: UserProfileUpdateRequest)
    case getUserUsage

    // MARK: - Health
    case healthCheck

    // MARK: - Computed Properties

    var path: String {
        switch self {
        // Authentication
        case .signIn:
            return "/api/auth/sign-in"
        case .signUp:
            return "/api/auth/sign-up"
        case .refreshSession:
            return "/api/auth/session/refresh"
        case .signOut:
            return "/api/auth/sign-out"
        case .getSession:
            return "/api/auth/session"

        // Heroes
        case .getHeroes:
            return "/api/heroes"
        case .getHero(let id, _):
            return "/api/heroes/\(id)"
        case .createHero:
            return "/api/heroes"
        case .updateHero(let id, _):
            return "/api/heroes/\(id)"
        case .deleteHero(let id):
            return "/api/heroes/\(id)"
        case .generateAvatar(let heroId, _):
            return "/api/heroes/\(heroId)/avatar"

        // Stories
        case .getStories:
            return "/api/stories"
        case .getStory(let id, _):
            return "/api/stories/\(id)"
        case .createStory:
            return "/api/stories"
        case .updateStory(let id, _):
            return "/api/stories/\(id)"
        case .deleteStory(let id):
            return "/api/stories/\(id)"
        case .generateAudio(let storyId, _, _):
            return "/api/stories/\(storyId)/audio"
        case .generateIllustrations(let storyId):
            return "/api/stories/\(storyId)/illustrations"
        case .getIllustrationStatus(let storyId):
            return "/api/stories/\(storyId)/illustrations/status"

        // Custom Events
        case .getCustomEvents:
            return "/api/custom-events"
        case .getCustomEvent(let id):
            return "/api/custom-events/\(id)"
        case .createCustomEvent:
            return "/api/custom-events"
        case .updateCustomEvent(let id, _):
            return "/api/custom-events/\(id)"
        case .deleteCustomEvent(let id):
            return "/api/custom-events/\(id)"
        case .enhanceCustomEvent(let id):
            return "/api/custom-events/\(id)/enhance"

        // User
        case .getUserProfile:
            return "/api/user/profile"
        case .updateUserProfile:
            return "/api/user/profile"
        case .getUserUsage:
            return "/api/user/usage"

        // Health
        case .healthCheck:
            return "/api/health"
        }
    }

    var method: HTTPMethod {
        switch self {
        // GET requests
        case .getSession, .getHeroes, .getHero, .getStories, .getStory,
             .getCustomEvents, .getCustomEvent, .getUserProfile, .getUserUsage,
             .getIllustrationStatus, .healthCheck:
            return .GET

        // POST requests
        case .signIn, .signUp, .refreshSession, .signOut,
             .createHero, .createStory, .createCustomEvent,
             .generateAvatar, .generateAudio, .generateIllustrations,
             .enhanceCustomEvent:
            return .POST

        // PATCH requests
        case .updateHero, .updateStory, .updateCustomEvent, .updateUserProfile:
            return .PATCH

        // DELETE requests
        case .deleteHero, .deleteStory, .deleteCustomEvent:
            return .DELETE
        }
    }

    var headers: [String: String] {
        var headers = ["Content-Type": "application/json"]

        // Add query parameters as headers for GET requests
        switch self {
        case .getHeroes(let limit, let offset, let includeStories):
            headers["Accept"] = "application/json"
            // Query params will be in URL

        case .getStories(let heroId, let limit, let offset, let includeIllustrations):
            headers["Accept"] = "application/json"

        default:
            break
        }

        return headers
    }

    var queryItems: [URLQueryItem]? {
        switch self {
        case .getHeroes(let limit, let offset, let includeStories):
            return [
                URLQueryItem(name: "limit", value: "\(limit)"),
                URLQueryItem(name: "offset", value: "\(offset)"),
                URLQueryItem(name: "includeStories", value: "\(includeStories)")
            ]

        case .getHero(_, let includeStories):
            return [
                URLQueryItem(name: "includeStories", value: "\(includeStories)")
            ]

        case .getStories(let heroId, let limit, let offset, let includeIllustrations):
            var items = [
                URLQueryItem(name: "limit", value: "\(limit)"),
                URLQueryItem(name: "offset", value: "\(offset)"),
                URLQueryItem(name: "includeIllustrations", value: "\(includeIllustrations)")
            ]
            if let heroId = heroId {
                items.append(URLQueryItem(name: "heroId", value: heroId))
            }
            return items

        case .getStory(_, let includeIllustrations):
            return [
                URLQueryItem(name: "includeIllustrations", value: "\(includeIllustrations)")
            ]

        case .getCustomEvents(let limit, let offset):
            return [
                URLQueryItem(name: "limit", value: "\(limit)"),
                URLQueryItem(name: "offset", value: "\(offset)")
            ]

        default:
            return nil
        }
    }

    var body: Data? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        switch self {
        case .signIn(let email, let password):
            return try? encoder.encode(["email": email, "password": password])

        case .signUp(let email, let password, let name):
            var data: [String: Any] = ["email": email, "password": password]
            if let name = name {
                data["name"] = name
            }
            return try? JSONSerialization.data(withJSONObject: data)

        case .createHero(let data):
            return try? encoder.encode(data)

        case .updateHero(_, let data):
            return try? encoder.encode(data)

        case .createStory(let data):
            return try? encoder.encode(data)

        case .updateStory(_, let data):
            return try? encoder.encode(data)

        case .createCustomEvent(let data):
            return try? encoder.encode(data)

        case .updateCustomEvent(_, let data):
            return try? encoder.encode(data)

        case .generateAvatar(_, let prompt):
            return try? encoder.encode(["prompt": prompt])

        case .generateAudio(_, let language, let voice):
            return try? encoder.encode(["language": language, "voice": voice])

        case .generateIllustrations:
            // Backend expects JSON body with optional style/maxIllustrations
            return try? encoder.encode(["style": "standard"])

        case .updateUserProfile(let data):
            return try? encoder.encode(data)

        default:
            return nil
        }
    }
}

// MARK: - Request DTOs

struct HeroCreateRequest: Codable {
    let name: String
    let age: Int
    let traits: [String]
    let specialAbilities: [String]?  // Backend expects array
    let appearance: String?  // Free-form appearance description
    let hairColor: String?
    let eyeColor: String?
    let skinTone: String?
    let height: String?
}

struct HeroUpdateRequest: Codable {
    let name: String?
    let age: Int?
    let traits: [String]?
    let specialAbilities: [String]?  // Backend expects array
    let appearance: String?  // Free-form appearance description
    let hairColor: String?
    let eyeColor: String?
    let skinTone: String?
    let height: String?
    let avatarUrl: String?
}

struct StoryCreateRequest: Codable {
    let heroId: String  // Backend uses cuid strings, not UUIDs
    let title: String?
    let eventType: String?
    let customEventId: String?  // Also a string ID
    let language: String
    let generateAudio: Bool
    let generateIllustrations: Bool
}

struct StoryUpdateRequest: Codable {
    let title: String?
    let content: String?
    let isFavorite: Bool?
}

struct CustomEventCreateRequest: Codable {
    let title: String
    let description: String
    let promptSeed: String
    let category: String
    let ageRange: String?
    let tone: String
}

struct CustomEventUpdateRequest: Codable {
    let title: String?
    let description: String?
    let promptSeed: String?
    let usageCount: Int?
    let isFavorite: Bool?
}

struct UserProfileUpdateRequest: Codable {
    let name: String?
    let preferredLanguage: String?
}
