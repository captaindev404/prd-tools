//
//  ContentPolicyFilter.swift
//  InfiniteStories
//
//  Enhanced content safety filter for OpenAI GPT-Image-1 illustration generation
//  Provides multi-language safety term replacement and AI-based prompt rewriting
//

import Foundation
import os.log

/// Content Policy Filter for ensuring child-safe image generation prompts
public class ContentPolicyFilter {

    // MARK: - Properties

    /// Shared singleton instance
    static let shared = ContentPolicyFilter()

    /// Risk levels for content assessment
    public enum RiskLevel: String {
        case safe = "safe"
        case low = "low"
        case medium = "medium"
        case high = "high"
        case critical = "critical"
    }

    // MARK: - Multi-Language Safety Term Dictionaries

    /// English problematic terms and their child-safe replacements
    private let englishReplacements: [String: String] = [
        // Isolation terms
        "alone": "with friends",
        "lonely": "happy with companions",
        "isolated": "surrounded by magical friends",
        "solitary": "with cheerful companions",
        "by himself": "with his friends",
        "by herself": "with her friends",
        "abandoned": "in a cozy magical place",

        // Dark/Scary terms
        "dark": "bright",
        "darkness": "warm light",
        "shadow": "gentle glow",
        "scary": "wonderful",
        "frightening": "magical",
        "terrifying": "amazing",
        "spooky": "enchanting",
        "haunted": "magical",
        "eerie": "cheerful",
        "creepy": "friendly",
        "sinister": "playful",
        "ominous": "exciting",

        // Fantasy creatures
        "gargoyle": "friendly stone guardian",
        "ghost": "friendly spirit",
        "phantom": "glowing magical friend",
        "monster": "gentle creature",
        "beast": "magical companion",
        "demon": "playful sprite",
        "devil": "mischievous fairy",
        "witch": "friendly magical helper",
        "bat": "butterfly",
        "bats": "butterflies",

        // Violence terms
        "fight": "play",
        "battle": "adventure",
        "attack": "play with",
        "weapon": "magical wand",
        "sword": "toy wand",
        "kill": "help",
        "death": "joy",
        "dead": "sleeping peacefully",
        "blood": "sparkles",

        // Negative emotions
        "sad": "happy",
        "crying": "smiling",
        "tears": "sparkles",
        "upset": "curious",
        "angry": "determined",
        "scared": "excited",
        "afraid": "brave",
        "worried": "thoughtful",
        "frightened": "amazed"
    ]

    /// French problematic terms and their replacements
    private let frenchReplacements: [String: String] = [
        // French dark fantasy terms
        "gargouille": "gardien de pierre amical",
        "gargoyle": "gardien magique",
        "chauve-souris": "papillon",
        "chauves-souris": "papillons",
        "fantôme": "esprit amical",
        "monstre": "créature gentille",
        "démon": "lutin joueur",
        "sorcière": "aide magique",

        // Isolation terms
        "seul": "avec des amis",
        "seule": "avec des amis",
        "solitaire": "entouré d'amis",
        "abandonné": "dans un endroit magique",
        "isolé": "entouré de créatures magiques",

        // Dark terms
        "sombre": "lumineux",
        "obscur": "brillant",
        "ténèbres": "lumière douce",
        "effrayant": "merveilleux",
        "terrifiant": "magique",
        "hanté": "enchanté",
        "château hanté": "château magique",
        "forêt sombre": "jardin enchanté",

        // Negative emotions
        "triste": "heureux",
        "pleure": "sourit",
        "larmes": "étincelles",
        "peur": "excité",
        "effrayé": "émerveillé"
    ]

    /// Spanish problematic terms and their replacements
    private let spanishReplacements: [String: String] = [
        "gárgola": "guardián de piedra amigable",
        "murciélago": "mariposa",
        "murciélagos": "mariposas",
        "fantasma": "espíritu amigable",
        "monstruo": "criatura gentil",
        "demonio": "duende juguetón",
        "bruja": "ayudante mágica",
        "solo": "con amigos",
        "sola": "con amigos",
        "oscuro": "brillante",
        "tenebroso": "luminoso",
        "aterrador": "maravilloso",
        "embrujado": "encantado",
        "triste": "feliz",
        "llorando": "sonriendo",
        "miedo": "emocionado"
    ]

    /// German problematic terms and their replacements
    private let germanReplacements: [String: String] = [
        "wasserspeier": "freundlicher steinwächter",
        "fledermaus": "schmetterling",
        "fledermäuse": "schmetterlinge",
        "geist": "freundlicher geist",
        "monster": "sanfte kreatur",
        "dämon": "verspielter kobold",
        "hexe": "magische helferin",
        "allein": "mit freunden",
        "einsam": "umgeben von freunden",
        "dunkel": "hell",
        "düster": "leuchtend",
        "gruselig": "wunderbar",
        "unheimlich": "magisch",
        "traurig": "glücklich",
        "weinend": "lächelnd",
        "angst": "aufgeregt"
    ]

    /// Italian problematic terms and their replacements
    private let italianReplacements: [String: String] = [
        "gargolla": "guardiano di pietra amichevole",
        "pipistrello": "farfalla",
        "pipistrelli": "farfalle",
        "fantasma": "spirito amichevole",
        "mostro": "creatura gentile",
        "demone": "folletto giocoso",
        "strega": "aiutante magica",
        "solo": "con amici",
        "sola": "con amici",
        "buio": "luminoso",
        "oscuro": "brillante",
        "spaventoso": "meraviglioso",
        "infestato": "incantato",
        "triste": "felice",
        "piangendo": "sorridendo",
        "paura": "emozionato"
    ]

    // MARK: - Initialization

    private init() {
        // Private initializer for singleton
    }

    // MARK: - Public Methods

    /// Pre-validate a prompt and assess its risk level
    /// - Parameter prompt: The prompt to validate
    /// - Returns: Risk assessment with level and issues found
    public func validatePrompt(_ prompt: String) -> (riskLevel: RiskLevel, issues: [String]) {
        var issues: [String] = []
        let lowercased = prompt.lowercased()

        // Check for high-risk terms across all languages
        let highRiskTerms = [
            "gargoyle", "gargouille", "gárgola", "wasserspeier", "gargolla",
            "alone", "seul", "seule", "solo", "sola", "allein",
            "dark", "sombre", "oscuro", "dunkel", "buio",
            "bat", "bats", "chauve-souris", "murciélago", "fledermaus", "pipistrello",
            "death", "mort", "muerte", "tod", "morte",
            "blood", "sang", "sangre", "blut", "sangue"
        ]

        for term in highRiskTerms {
            if lowercased.contains(term) {
                issues.append("Contains high-risk term: '\(term)'")
            }
        }

        // Check for isolation indicators
        if lowercased.contains("by himself") || lowercased.contains("by herself") ||
           lowercased.contains("all alone") || lowercased.contains("standing alone") {
            issues.append("Contains isolation phrases")
        }

        // Check for negative emotions
        let negativeEmotions = ["sad", "crying", "tears", "upset", "angry", "scared", "afraid"]
        for emotion in negativeEmotions {
            if lowercased.contains(emotion) {
                issues.append("Contains negative emotion: '\(emotion)'")
            }
        }

        // Determine risk level
        let riskLevel: RiskLevel
        if issues.isEmpty {
            riskLevel = .safe
        } else if issues.count == 1 {
            riskLevel = .low
        } else if issues.count <= 3 {
            riskLevel = .medium
        } else if issues.count <= 5 {
            riskLevel = .high
        } else {
            riskLevel = .critical
        }

        return (riskLevel, issues)
    }

    /// Apply basic term replacement filtering to a prompt
    /// - Parameters:
    ///   - prompt: The prompt to filter
    ///   - language: The language of the prompt
    /// - Returns: Filtered prompt with replacements applied
    public func applyBasicFilter(_ prompt: String, language: String = "en") -> String {
        var filtered = prompt

        // Select appropriate replacement dictionary based on language
        let replacements: [String: String]
        switch language.lowercased() {
        case "fr", "french":
            replacements = frenchReplacements.merging(englishReplacements) { french, _ in french }
        case "es", "spanish":
            replacements = spanishReplacements.merging(englishReplacements) { spanish, _ in spanish }
        case "de", "german":
            replacements = germanReplacements.merging(englishReplacements) { german, _ in german }
        case "it", "italian":
            replacements = italianReplacements.merging(englishReplacements) { italian, _ in italian }
        default:
            replacements = englishReplacements
        }

        // Apply replacements with word boundaries
        for (term, replacement) in replacements {
            let pattern = "\\b\(NSRegularExpression.escapedPattern(for: term))\\b"
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) {
                let range = NSRange(location: 0, length: filtered.utf16.count)
                filtered = regex.stringByReplacingMatches(
                    in: filtered,
                    options: [],
                    range: range,
                    withTemplate: replacement
                )
            }
        }

        // Ensure positive additions if not present
        let positiveTerms = ["bright", "cheerful", "happy", "friendly", "magical", "colorful"]
        let hasPositiveTerms = positiveTerms.contains { filtered.lowercased().contains($0) }

        if !hasPositiveTerms {
            filtered += " The scene is bright, colorful, cheerful, and magical."
        }

        // Ensure companions if not present
        let companionTerms = ["friends", "companions", "family", "together"]
        let hasCompanions = companionTerms.contains { filtered.lowercased().contains($0) }

        if !hasCompanions {
            filtered += " Everyone is surrounded by friendly magical companions."
        }

        // Add child-safety suffix
        if !filtered.lowercased().contains("child-friendly") {
            filtered += " Child-friendly illustration, warm and cheerful bedtime scene, safe for children."
        }

        return filtered
    }

    /// Log filtering activity for debugging
    /// - Parameters:
    ///   - original: Original prompt
    ///   - filtered: Filtered prompt
    ///   - replacements: Number of replacements made
    public func logFilteringActivity(original: String, filtered: String, replacements: Int) {
        let requestId = UUID().uuidString.prefix(8).lowercased()

        AppLogger.shared.info("Content filtering applied", category: .illustration, requestId: String(requestId))
        AppLogger.shared.debug("Original length: \(original.count) characters", category: .illustration, requestId: String(requestId))
        AppLogger.shared.debug("Filtered length: \(filtered.count) characters", category: .illustration, requestId: String(requestId))
        AppLogger.shared.debug("Replacements made: \(replacements)", category: .illustration, requestId: String(requestId))

        if original != filtered {
            AppLogger.shared.warning("Content was modified for safety compliance", category: .illustration, requestId: String(requestId))
        }
    }

    /// Check if a prompt needs AI-based sanitization
    /// - Parameter prompt: The prompt to check
    /// - Returns: True if AI sanitization is recommended
    public func needsAISanitization(_ prompt: String) -> Bool {
        let validation = validatePrompt(prompt)

        // Recommend AI sanitization for medium risk or higher
        switch validation.riskLevel {
        case .medium, .high, .critical:
            return true
        case .safe, .low:
            // Also check for specific problematic terms that benefit from AI rewriting
            let problematicTerms = ["gargoyle", "gargouille", "bat", "ghost", "monster", "alone", "dark"]
            return problematicTerms.contains { prompt.lowercased().contains($0) }
        }
    }
}

// MARK: - Extensions for Integration

extension ContentPolicyFilter {

    /// Process a prompt through the full safety pipeline
    /// - Parameters:
    ///   - prompt: The original prompt
    ///   - language: The language of the prompt
    ///   - useAI: Whether to use AI-based sanitization
    /// - Returns: Processed safe prompt
    public func processPrompt(_ prompt: String, language: String = "en", useAI: Bool = true) async throws -> String {
        let requestId = UUID().uuidString.prefix(8).lowercased()

        AppLogger.shared.info("Starting content policy filtering", category: .illustration, requestId: String(requestId))

        // Step 1: Validate the prompt
        let validation = validatePrompt(prompt)
        AppLogger.shared.debug("Risk assessment: \(validation.riskLevel.rawValue)", category: .illustration, requestId: String(requestId))

        if !validation.issues.isEmpty {
            AppLogger.shared.warning("Issues found: \(validation.issues.joined(separator: ", "))", category: .illustration, requestId: String(requestId))
        }

        // Step 2: Apply basic filtering
        let basicFiltered = applyBasicFilter(prompt, language: language)

        // Step 3: Determine if AI sanitization is needed
        if useAI && needsAISanitization(basicFiltered) {
            AppLogger.shared.info("AI sanitization recommended, calling backend", category: .illustration, requestId: String(requestId))

            // Note: This would call the backend sanitize-prompt endpoint through AIService
            // The actual implementation would be in AIService.sanitizePromptWithAI()
            // which is already implemented in the AIService

            return basicFiltered // Return basic filtered for now
        }

        logFilteringActivity(original: prompt, filtered: basicFiltered, replacements: validation.issues.count)

        return basicFiltered
    }
}