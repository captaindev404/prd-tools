//
//  CustomEventAIAssistant.swift
//  InfiniteStories
//
//  Created on 2025-09-14.
//

import Foundation
import SwiftUI

class CustomEventAIAssistant: ObservableObject {
    private let aiService: AIServiceProtocol
    private let language: String
    private let appSettings = AppSettings()
    
    @Published var isProcessing = false
    @Published var suggestions: [String] = []
    @Published var lastError: String?
    
    init() {
        // Initialize with the OpenAI service (no API key needed - uses backend)
        self.aiService = OpenAIService()
        self.language = appSettings.preferredLanguage
    }
    
    // MARK: - Title Generation

    func generateTitle(from description: String) async -> String? {
        guard !description.isEmpty else { return nil }

        await MainActor.run {
            isProcessing = true
            lastError = nil
        }

        defer {
            Task { @MainActor in
                isProcessing = false
            }
        }

        do {
            let backendURL = "\(AppConfiguration.backendBaseURL)/api/ai-assistant/generate-title"

            let requestBody: [String: Any] = [
                "description": description,
                "language": language
            ]

            guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
                throw CustomEventAIError.parsingError
            }

            var urlRequest = URLRequest(url: URL(string: backendURL)!)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            urlRequest.httpBody = jsonData

            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw CustomEventAIError.networkError("Backend request failed")
            }

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let title = json["title"] as? String else {
                throw CustomEventAIError.parsingError
            }

            return title.trimmingCharacters(in: .whitespacesAndNewlines)
        } catch {
            await MainActor.run {
                lastError = "Failed to generate title: \(error.localizedDescription)"
            }
            return nil
        }
    }
    
    // MARK: - Prompt Enhancement

    func enhancePromptSeed(
        title: String,
        description: String,
        category: EventCategory,
        ageRange: AgeRange,
        tone: StoryTone
    ) async -> String {
        await MainActor.run {
            isProcessing = true
            lastError = nil
        }

        defer {
            Task { @MainActor in
                isProcessing = false
            }
        }

        do {
            let backendURL = "\(AppConfiguration.backendBaseURL)/api/ai-assistant/enhance-prompt"

            let requestBody: [String: Any] = [
                "title": title,
                "description": description,
                "category": category.rawValue,
                "ageRange": ageRange.rawValue,
                "tone": tone.rawValue
            ]

            guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
                throw CustomEventAIError.parsingError
            }

            var urlRequest = URLRequest(url: URL(string: backendURL)!)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            urlRequest.httpBody = jsonData

            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw CustomEventAIError.networkError("Backend request failed")
            }

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let enhancedPrompt = json["enhancedPrompt"] as? String else {
                throw CustomEventAIError.parsingError
            }

            return enhancedPrompt.trimmingCharacters(in: .whitespacesAndNewlines)
        } catch {
            await MainActor.run {
                lastError = "Failed to enhance prompt: \(error.localizedDescription)"
            }
            // Return the original description as fallback
            return description
        }
    }
    
    // MARK: - Keyword Generation

    func generateKeywords(for event: String, description: String) async -> [String] {
        await MainActor.run {
            isProcessing = true
            lastError = nil
        }

        defer {
            Task { @MainActor in
                isProcessing = false
            }
        }

        do {
            let backendURL = "\(AppConfiguration.backendBaseURL)/api/ai-assistant/generate-keywords"

            let requestBody: [String: Any] = [
                "event": event,
                "description": description
            ]

            guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
                throw CustomEventAIError.parsingError
            }

            var urlRequest = URLRequest(url: URL(string: backendURL)!)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            urlRequest.httpBody = jsonData

            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw CustomEventAIError.networkError("Backend request failed")
            }

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let keywords = json["keywords"] as? [String] else {
                throw CustomEventAIError.parsingError
            }

            return keywords
        } catch {
            await MainActor.run {
                lastError = "Failed to generate keywords: \(error.localizedDescription)"
            }
            return []
        }
    }
    
    // MARK: - Similar Events Suggestion

    func suggestSimilarEvents(to description: String) async -> [String] {
        await MainActor.run {
            isProcessing = true
            lastError = nil
        }

        defer {
            Task { @MainActor in
                isProcessing = false
            }
        }

        do {
            let backendURL = "\(AppConfiguration.backendBaseURL)/api/ai-assistant/suggest-similar-events"

            let requestBody: [String: Any] = [
                "description": description
            ]

            guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
                throw CustomEventAIError.parsingError
            }

            var urlRequest = URLRequest(url: URL(string: backendURL)!)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            urlRequest.httpBody = jsonData

            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw CustomEventAIError.networkError("Backend request failed")
            }

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let suggestions = json["suggestions"] as? [String] else {
                throw CustomEventAIError.parsingError
            }

            return suggestions
        } catch {
            await MainActor.run {
                lastError = "Failed to suggest events: \(error.localizedDescription)"
            }
            return []
        }
    }
    
}

// MARK: - Error Types

enum CustomEventAIError: LocalizedError {
    case apiKeyMissing
    case networkError(String)
    case parsingError
    case invalidResponse
    
    var errorDescription: String? {
        switch self {
        case .apiKeyMissing:
            return "OpenAI API key is not configured"
        case .networkError(let message):
            return "Network error: \(message)"
        case .parsingError:
            return "Failed to parse AI response"
        case .invalidResponse:
            return "Invalid response from AI service"
        }
    }
}