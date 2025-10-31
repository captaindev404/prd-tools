//
//  AvatarPromptAssistant.swift
//  InfiniteStories
//
//  Simplified helper for avatar prompt generation (client-side only, no API calls)
//

import Foundation

enum AvatarStyle: String, CaseIterable, Identifiable {
    case cartoonKids = "Cartoon Kids"
    case watercolor = "Watercolor"
    case digitalArt = "Digital Art"
    case pixar = "Pixar Style"
    case storybook = "Storybook"

    var id: String { rawValue }
}

struct AvatarPromptAssistant {

    /// Generate a basic prompt for avatar generation based on hero traits
    static func generatePrompt(for hero: Hero, style: AvatarStyle) -> String {
        let traits = "\(hero.primaryTrait.description), \(hero.secondaryTrait.description)"
        let appearance = hero.appearance.isEmpty ? "friendly and lovable" : hero.appearance
        let ability = hero.specialAbility.isEmpty ? "magical powers" : hero.specialAbility

        return """
        A charming children's book character named \(hero.name), \(traits), with \(appearance), possessing \(ability). \
        Style: \(style.rawValue). The character should be friendly, child-appropriate, and perfect for bedtime stories. \
        Bright colors, warm and inviting, suitable for children aged 3-10 years.
        """
    }

    /// Enhance a user-provided prompt with hero context
    static func enhanceUserPrompt(_ userPrompt: String, for hero: Hero) -> String {
        if userPrompt.lowercased().contains(hero.name.lowercased()) {
            return userPrompt
        }
        return "\(userPrompt). Character name: \(hero.name)."
    }

    /// Get random prompt ideas for inspiration
    static func getRandomPromptIdeas() -> [String] {
        return [
            "Watercolor illustration style",
            "Cartoon character design",
            "Storybook illustration",
            "Cute and friendly appearance",
            "Magical fantasy character"
        ]
    }
}
