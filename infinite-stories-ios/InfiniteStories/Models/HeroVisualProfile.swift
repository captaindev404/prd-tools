//
//  HeroVisualProfile.swift
//  InfiniteStories
//
//  Hero Visual Profile for maintaining consistent appearance across illustrations
//  NOTE: This is API-only - no local SwiftData persistence
//

import Foundation

/// Stores detailed visual characteristics of a hero for consistent illustration generation
/// Fetched from backend API - not persisted locally
struct HeroVisualProfile: Codable, Identifiable, Equatable {
    var id: String // Backend cuid
    var heroId: String

    // Core visual attributes extracted from avatar
    var hairStyle: String?
    var hairColor: String?
    var hairTexture: String?
    var eyeColor: String?
    var eyeShape: String?
    var skinTone: String?
    var facialFeatures: String?
    var bodyType: String?
    var height: String?
    var age: Int?

    // Clothing and accessories
    var typicalClothing: String?
    var colorPalette: [String]?
    var accessories: String?

    // Artistic style attributes
    var artStyle: String?
    var visualKeywords: [String]?

    // Reference prompts
    var canonicalPrompt: String? // The definitive prompt that worked for avatar
    var simplifiedPrompt: String? // Simplified version for scene illustrations

    // Metadata
    var createdAt: Date?
    var updatedAt: Date?

    init(
        id: String = "",
        heroId: String = "",
        hairStyle: String? = nil,
        hairColor: String? = nil,
        hairTexture: String? = nil,
        eyeColor: String? = nil,
        eyeShape: String? = nil,
        skinTone: String? = nil,
        facialFeatures: String? = nil,
        bodyType: String? = nil,
        height: String? = nil,
        age: Int? = nil,
        typicalClothing: String? = nil,
        colorPalette: [String]? = nil,
        accessories: String? = nil,
        artStyle: String? = nil,
        visualKeywords: [String]? = nil,
        canonicalPrompt: String? = nil,
        simplifiedPrompt: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.heroId = heroId
        self.hairStyle = hairStyle
        self.hairColor = hairColor
        self.hairTexture = hairTexture
        self.eyeColor = eyeColor
        self.eyeShape = eyeShape
        self.skinTone = skinTone
        self.facialFeatures = facialFeatures
        self.bodyType = bodyType
        self.height = height
        self.age = age
        self.typicalClothing = typicalClothing
        self.colorPalette = colorPalette
        self.accessories = accessories
        self.artStyle = artStyle
        self.visualKeywords = visualKeywords
        self.canonicalPrompt = canonicalPrompt
        self.simplifiedPrompt = simplifiedPrompt
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    /// Generate a consistent character description for scene illustrations
    func generateSceneCharacterDescription(heroName: String) -> String {
        var description = "\(heroName)"

        // Build appearance details
        var appearanceDetails: [String] = []

        if let age = age {
            appearanceDetails.append("\(age) year old")
        }

        if let skinTone = skinTone {
            appearanceDetails.append("\(skinTone) skin")
        }

        if let hairStyle = hairStyle, let hairColor = hairColor {
            appearanceDetails.append("\(hairColor) \(hairStyle)")
        } else if let hairColor = hairColor {
            appearanceDetails.append("\(hairColor) hair")
        }

        if let eyeColor = eyeColor {
            appearanceDetails.append("\(eyeColor) eyes")
        }

        if !appearanceDetails.isEmpty {
            description += " (a character with \(appearanceDetails.joined(separator: ", ")))"
        }

        // Add clothing if specified
        if let typicalClothing = typicalClothing {
            description += " wearing \(typicalClothing)"
        }

        // Add distinctive features
        if let facialFeatures = facialFeatures {
            description += ", \(facialFeatures)"
        }

        return description
    }

    /// Create a style consistency prompt segment
    func generateStyleConsistencyPrompt() -> String {
        let style = artStyle ?? "cartoon children's book illustration"
        let palette = colorPalette?.joined(separator: ", ") ?? "Bright, cheerful colors"
        return "Art style: \(style). \(palette). Warm, soft lighting."
    }

    // MARK: - Equatable

    static func == (lhs: HeroVisualProfile, rhs: HeroVisualProfile) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Legacy Compatibility

extension HeroVisualProfile {
    /// Computed properties for backward compatibility with old views

    var clothingStyle: String? {
        typicalClothing
    }

    var clothingColors: String? {
        colorPalette?.joined(separator: ", ")
    }

    var distinctiveFeatures: String? {
        facialFeatures
    }

    var ageAppearance: String? {
        guard let age = age else { return nil }
        return "\(age) year old child"
    }

    var lightingPreference: String? {
        // Default lighting preference
        "Warm, soft lighting"
    }

    var extractionMethod: String {
        // All profiles are now AI-extracted via API
        "ai_extracted"
    }

    var lastUpdated: Date {
        updatedAt ?? createdAt ?? Date()
    }
}
