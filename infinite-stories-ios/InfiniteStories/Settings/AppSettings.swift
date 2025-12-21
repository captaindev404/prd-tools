//
//  AppSettings.swift
//  InfiniteStories
//
//  Created by Captain Dev on 22/12/2025.
//
//  Extracted from StoryViewModel as part of ViewModel architecture refactoring.
//  User preferences for AI service configuration (voice, language, story length).
//

import Foundation
import SwiftUI

/// User preferences for AI story generation
@Observable
final class AppSettings {

    // MARK: - Stored Properties

    /// Preferred voice for TTS audio generation
    var preferredVoice: String {
        didSet {
            UserDefaults.standard.set(preferredVoice, forKey: "preferredVoice")
        }
    }

    /// Default story length (in approximate minutes)
    var defaultStoryLength: Int {
        didSet {
            UserDefaults.standard.set(defaultStoryLength, forKey: "defaultStoryLength")
        }
    }

    /// Preferred language for story generation
    var preferredLanguage: String {
        didSet {
            UserDefaults.standard.set(preferredLanguage, forKey: "preferredLanguage")
        }
    }

    // MARK: - Initialization

    init() {
        // Load settings from UserDefaults
        self.preferredVoice = UserDefaults.standard.string(forKey: "preferredVoice") ?? "coral"
        self.defaultStoryLength = UserDefaults.standard.integer(forKey: "defaultStoryLength") == 0 ? 7 : UserDefaults.standard.integer(forKey: "defaultStoryLength")

        // Load language setting with system language as default
        let systemLanguage = Locale.current.language.languageCode?.identifier ?? "en"
        let defaultLanguage = Self.languageCodeToSupported(systemLanguage)
        self.preferredLanguage = UserDefaults.standard.string(forKey: "preferredLanguage") ?? defaultLanguage
    }

    // MARK: - Static Voice Definitions

    /// Available OpenAI voices for TTS (optimized for children's bedtime stories)
    static let availableVoices: [(id: String, name: String, description: String)] = [
        ("coral", "Coral", "Warm and nurturing - ideal for bedtime"),
        ("nova", "Nova", "Friendly and cheerful - captivating for young listeners"),
        ("fable", "Fable", "Wise and comforting - like a loving grandparent"),
        ("alloy", "Alloy", "Clear and pleasant - perfect for educational stories"),
        ("echo", "Echo", "Soft and dreamy - creates magical atmosphere"),
        ("onyx", "Onyx", "Deep and reassuring - protective parent voice"),
        ("shimmer", "Shimmer", "Bright and melodic - sparkles with imagination")
    ]

    // MARK: - Static Language Definitions

    /// Available languages for story generation
    static let availableLanguages: [(id: String, name: String, nativeName: String)] = [
        ("English", "English", "English"),
        ("Spanish", "Spanish", "Espanol"),
        ("French", "French", "Francais"),
        ("German", "German", "Deutsch"),
        ("Italian", "Italian", "Italiano")
    ]

    // MARK: - Helper Methods

    /// Map system language code to supported language
    static func languageCodeToSupported(_ code: String) -> String {
        switch code {
        case "es": return "Spanish"
        case "fr": return "French"
        case "de": return "German"
        case "it": return "Italian"
        case "en": return "English"
        default: return "English"  // Default to English for unsupported languages
        }
    }

    /// Get the display name for the current voice
    var currentVoiceName: String {
        Self.availableVoices.first { $0.id == preferredVoice }?.name ?? preferredVoice
    }

    /// Get the display name for the current language
    var currentLanguageName: String {
        Self.availableLanguages.first { $0.id == preferredLanguage }?.name ?? preferredLanguage
    }

    /// Reset all settings to defaults
    func resetToDefaults() {
        preferredVoice = "coral"
        defaultStoryLength = 7
        let systemLanguage = Locale.current.language.languageCode?.identifier ?? "en"
        preferredLanguage = Self.languageCodeToSupported(systemLanguage)
    }
}
