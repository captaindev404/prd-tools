//
//  AIService.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import Foundation
import os.log

struct StoryGenerationRequest {
    let hero: Hero
    let event: StoryEvent
    let targetDuration: TimeInterval // in seconds (5-10 minutes = 300-600 seconds)
    let language: String // Target language for story generation
}

struct CustomStoryGenerationRequest {
    let hero: Hero
    let customEvent: CustomStoryEvent
    let targetDuration: TimeInterval // in seconds (5-10 minutes = 300-600 seconds)
    let language: String // Target language for story generation
}

struct StoryGenerationResponse {
    let title: String
    let content: String
    let estimatedDuration: TimeInterval
    let scenes: [StoryScene]? // Optional for backward compatibility
}

// New structure for scene-based story generation
struct StoryScene {
    let sceneNumber: Int
    let textSegment: String
    let illustrationPrompt: String
    let timestamp: TimeInterval // Estimated timestamp in seconds
    let emotion: SceneEmotion
    let importance: SceneImportance
}

enum SceneEmotion: String {
    case joyful = "joyful"
    case peaceful = "peaceful"
    case exciting = "exciting"
    case mysterious = "mysterious"
    case heartwarming = "heartwarming"
    case adventurous = "adventurous"
    case contemplative = "contemplative"
}

enum SceneImportance: String {
    case key = "key"      // Critical story moments
    case major = "major"  // Important developments
    case minor = "minor"  // Supporting scenes
}

struct AvatarGenerationRequest {
    let hero: Hero
    let prompt: String
    let size: String // "1024x1024", "1792x1024", or "1024x1792"
    let quality: String // "low", "medium", or "high" for GPT-Image-1
    let previousGenerationId: String? // Optional previous generation ID for consistency
}

struct AvatarGenerationResponse {
    let imageData: Data
    let revisedPrompt: String?
    let generationId: String? // GPT-Image-1 generation ID for multi-turn consistency
}

struct SceneIllustrationResponse {
    let imageData: Data
    let revisedPrompt: String?
    let generationId: String? // GPT-Image-1 generation ID for multi-turn consistency
}

enum AIServiceError: Error {
    case invalidAPIKey
    case networkError(Error)
    case invalidResponse
    case apiError(String)
    case rateLimitExceeded
    case imageGenerationFailed
    case fileSystemError
    case invalidPrompt
    case contentPolicyViolation(String)
}

// JSON structures for scene extraction
struct SceneExtractionRequest {
    let storyContent: String
    let storyDuration: TimeInterval
    let hero: Hero
    let eventContext: String
}

struct SceneExtractionJSONResponse: Codable {
    let scenes: [SceneJSON]
    let sceneCount: Int
    let reasoning: String
}

struct SceneJSON: Codable {
    let sceneNumber: Int
    let textSegment: String
    let timestamp: Double
    let illustrationPrompt: String
    let emotion: String
    let importance: String
}

// Extension to convert StoryScene to StoryIllustration
extension StoryScene {
    func toStoryIllustration(previousGenerationId: String? = nil) -> StoryIllustration {
        return StoryIllustration(
            timestamp: timestamp,
            imagePrompt: illustrationPrompt,
            displayOrder: sceneNumber - 1, // Convert to 0-based index
            textSegment: textSegment,
            previousGenerationId: previousGenerationId // Pass through generation ID for chaining
        )
    }
}

// Extension to StoryGenerationResponse for convenience
extension StoryGenerationResponse {
    var hasScenes: Bool {
        return scenes != nil && !scenes!.isEmpty
    }

    var cleanContent: String {
        // Return story content without scene markers
        return content
    }

    func createIllustrations(heroAvatarGenerationId: String? = nil) -> [StoryIllustration] {
        guard let scenes = scenes else { return [] }
        return scenes.enumerated().map { (index, scene) in
            // First illustration should use hero's avatar generation ID for chaining
            let previousGenId = index == 0 ? heroAvatarGenerationId : nil
            return scene.toStoryIllustration(previousGenerationId: previousGenId)
        }
    }
}

protocol AIServiceProtocol {
    func generateStory(request: StoryGenerationRequest) async throws -> StoryGenerationResponse
    func generateStoryWithCustomEvent(request: CustomStoryGenerationRequest) async throws -> StoryGenerationResponse
    func extractScenesFromStory(request: SceneExtractionRequest) async throws -> [StoryScene]
    func generateSpeech(text: String, voice: String, language: String) async throws -> Data
    func generateAvatar(request: AvatarGenerationRequest) async throws -> AvatarGenerationResponse
    func generateSceneIllustration(prompt: String, hero: Hero, previousGenerationId: String?) async throws -> SceneIllustrationResponse
    func generatePictogram(prompt: String) async throws -> Data
    func cancelCurrentTask()
    var currentTask: URLSessionDataTask? { get set }
}

class OpenAIService: AIServiceProtocol {
    var currentTask: URLSessionDataTask?

    // Feature flag for scene-based generation (can be configured)
    var enableSceneBasedGeneration: Bool = true

    init() {
        // No API key needed - all calls go through backend
    }
    
    func generateStory(request: StoryGenerationRequest) async throws -> StoryGenerationResponse {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let startTime = Date()

        AppLogger.shared.info("Story generation started (via backend)", category: .story, requestId: String(requestId))
        AppLogger.shared.debug("Parameters - Hero: \(request.hero.name), Event: \(request.event.rawValue), Language: \(request.language), Duration: \(Int(request.targetDuration/60))min", category: .story, requestId: String(requestId))

        // Build backend URL
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/stories/generate"

        // Prepare request body matching backend API format
        let requestBody: [String: Any] = [
            "hero": [
                "name": request.hero.name,
                "primaryTrait": request.hero.primaryTrait.rawValue,
                "secondaryTrait": request.hero.secondaryTrait.rawValue,
                "appearance": request.hero.appearance,
                "specialAbility": request.hero.specialAbility,
                "avatarPrompt": request.hero.avatarPrompt ?? "",
                "avatarGenerationId": request.hero.avatarGenerationId ?? ""
            ],
            "event": [
                "rawValue": request.event.rawValue,
                "promptSeed": request.event.promptSeed
            ],
            "targetDuration": request.targetDuration,
            "language": request.language
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            print("🤖 ❌ Error: Failed to serialize request JSON")
            AppLogger.shared.error("Failed to serialize request JSON", category: .api, requestId: String(requestId))
            throw AIServiceError.invalidResponse
        }

        // Log request
        AppLogger.shared.info("Calling backend API: \(backendURL)", category: .story, requestId: String(requestId))
        logFullHTTPRequest(
            url: backendURL,
            method: "POST",
            headers: ["Content-Type": "application/json"],
            bodyData: jsonData,
            requestId: String(requestId)
        )

        var urlRequest = URLRequest(url: URL(string: backendURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData

        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                print("🤖 ❌ Error: Invalid HTTP response")
                throw AIServiceError.networkError(URLError(.badServerResponse))
            }

            // Log response details
            let responseTime = Date().timeIntervalSince(startTime)
            logHTTPResponse(
                statusCode: httpResponse.statusCode,
                headers: httpResponse.allHeaderFields,
                dataSize: data.count,
                responseTime: responseTime,
                requestId: String(requestId)
            )

            guard httpResponse.statusCode == 200 else {
                if httpResponse.statusCode == 429 {
                    print("🤖 ⏳ Error: Rate limit exceeded")
                    throw AIServiceError.rateLimitExceeded
                }
                print("🤖 ❌ HTTP Error: \(httpResponse.statusCode)")
                if let errorString = String(data: data, encoding: .utf8) {
                    print("🤖 📥 Error Response: \(errorString)")
                }
                throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
            }

            // Log the raw response
            if let responseString = String(data: data, encoding: .utf8) {
                print("🤖 📥 Raw Response: \(responseString)")
            }

            // Parse backend response format
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let title = json["title"] as? String,
                  let content = json["content"] as? String,
                  let estimatedDuration = json["estimatedDuration"] as? Double else {
                print("🤖 ❌ Error: Failed to parse backend response")
                AppLogger.shared.error("Failed to parse backend response", category: .api, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            print("🤖 ✅ Successfully parsed backend response")
            print("🤖 📖 Generated Story Content:")
            print("🤖 \(content)")
            print("🤖 ==================")

            // Create response matching expected format
            let result = StoryGenerationResponse(
                title: title,
                content: content,
                estimatedDuration: estimatedDuration,
                scenes: nil // Scenes extracted separately
            )

            print("🤖 📊 Final Result - Title: \(result.title)")
            print("🤖 📊 Final Result - Duration: \(Int(result.estimatedDuration/60)) minutes")
            print("🤖 📊 Final Result - Word Count: \(result.content.split(separator: " ").count)")
            print("🤖 === Story Generation Completed (via backend) ===")

            AppLogger.shared.success("Story generated successfully via backend", category: .story, requestId: String(requestId))
            AppLogger.shared.logPerformance(operation: "Story Generation (Backend)", startTime: startTime, requestId: String(requestId))

            return result

        } catch let error as AIServiceError {
            print("🤖 ❌ AI Service Error: \(error)")
            AppLogger.shared.error("Story generation failed", category: .story, requestId: String(requestId), error: error)
            throw error
        } catch {
            print("🤖 ❌ Network Error: \(error.localizedDescription)")
            AppLogger.shared.error("Network error during story generation", category: .story, requestId: String(requestId), error: error)
            throw AIServiceError.networkError(error)
        }
    }
    
    func generateStoryWithCustomEvent(request: CustomStoryGenerationRequest) async throws -> StoryGenerationResponse {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let startTime = Date()

        AppLogger.shared.info("Custom story generation started (via backend)", category: .story, requestId: String(requestId))
        AppLogger.shared.debug("Hero: \(request.hero.name), Event: \(request.customEvent.title), Duration: \(Int(request.targetDuration/60))min", category: .story, requestId: String(requestId))

        // Build backend URL
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/stories/generate-custom"

        // Prepare request body matching backend API format
        let requestBody: [String: Any] = [
            "hero": [
                "name": request.hero.name,
                "primaryTrait": request.hero.primaryTrait.rawValue,
                "secondaryTrait": request.hero.secondaryTrait.rawValue,
                "appearance": request.hero.appearance,
                "specialAbility": request.hero.specialAbility,
                "avatarPrompt": request.hero.avatarPrompt ?? "",
                "avatarGenerationId": request.hero.avatarGenerationId ?? ""
            ],
            "customEvent": [
                "title": request.customEvent.title,
                "promptSeed": request.customEvent.promptSeed,
                "keywords": request.customEvent.keywords,
                "tone": request.customEvent.tone.rawValue,
                "ageRange": request.customEvent.ageRange.rawValue,
                "category": request.customEvent.category.rawValue
            ],
            "targetDuration": request.targetDuration,
            "language": request.language
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            print("🤖 ❌ Error: Failed to serialize request JSON")
            AppLogger.shared.error("Failed to serialize request JSON", category: .api, requestId: String(requestId))
            throw AIServiceError.invalidResponse
        }

        // Log request
        AppLogger.shared.info("Calling backend API: \(backendURL)", category: .story, requestId: String(requestId))
        logFullHTTPRequest(
            url: backendURL,
            method: "POST",
            headers: ["Content-Type": "application/json"],
            bodyData: jsonData,
            requestId: String(requestId)
        )

        var urlRequest = URLRequest(url: URL(string: backendURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData

        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                print("🤖 ❌ Error: Invalid HTTP response")
                throw AIServiceError.networkError(URLError(.badServerResponse))
            }

            // Log response details
            let responseTime = Date().timeIntervalSince(startTime)
            logHTTPResponse(
                statusCode: httpResponse.statusCode,
                headers: httpResponse.allHeaderFields,
                dataSize: data.count,
                responseTime: responseTime,
                requestId: String(requestId)
            )

            guard httpResponse.statusCode == 200 else {
                if httpResponse.statusCode == 429 {
                    print("🤖 ⏳ Error: Rate limit exceeded")
                    throw AIServiceError.rateLimitExceeded
                }
                print("🤖 ❌ HTTP Error: \(httpResponse.statusCode)")
                if let errorString = String(data: data, encoding: .utf8) {
                    print("🤖 📥 Error Response: \(errorString)")
                }
                throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
            }

            // Parse backend response format
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let title = json["title"] as? String,
                  let content = json["content"] as? String,
                  let estimatedDuration = json["estimatedDuration"] as? Double else {
                print("🤖 ❌ Error: Failed to parse backend response")
                AppLogger.shared.error("Failed to parse backend response", category: .api, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            print("🤖 ✅ Successfully parsed custom story response")
            print("🤖 📖 Generated Story Content:")
            print("🤖 \(content)")
            print("🤖 ==================")

            // Create response matching expected format
            let result = StoryGenerationResponse(
                title: title,
                content: content,
                estimatedDuration: estimatedDuration,
                scenes: nil // Scenes extracted separately
            )

            print("🤖 📊 Final Result - Title: \(result.title)")
            print("🤖 📊 Final Result - Duration: \(Int(result.estimatedDuration/60)) minutes")
            print("🤖 === Custom Story Generation Completed (via backend) ===")

            AppLogger.shared.success("Custom story generated successfully via backend", category: .story, requestId: String(requestId))
            AppLogger.shared.logPerformance(operation: "Custom Story Generation (Backend)", startTime: startTime, requestId: String(requestId))

            return result

        } catch let error as AIServiceError {
            print("🤖 ❌ AI Service Error: \(error)")
            AppLogger.shared.error("Custom story generation failed", category: .story, requestId: String(requestId), error: error)
            throw error
        } catch {
            print("🤖 ❌ Network Error: \(error.localizedDescription)")
            AppLogger.shared.error("Network error during custom story generation", category: .story, requestId: String(requestId), error: error)
            throw AIServiceError.networkError(error)
        }
    }

    func extractScenesFromStory(request: SceneExtractionRequest) async throws -> [StoryScene] {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let startTime = Date()

        AppLogger.shared.info("Scene extraction started (via backend)", category: .illustration, requestId: String(requestId))
        AppLogger.shared.debug("Story duration: \(Int(request.storyDuration)) seconds", category: .illustration, requestId: String(requestId))

        // Build backend URL
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/stories/extract-scenes"

        // Prepare request body matching backend API format
        let requestBody: [String: Any] = [
            "storyContent": request.storyContent,
            "storyDuration": request.storyDuration,
            "hero": [
                "name": request.hero.name,
                "primaryTrait": request.hero.primaryTrait.rawValue,
                "secondaryTrait": request.hero.secondaryTrait.rawValue,
                "appearance": request.hero.appearance,
                "specialAbility": request.hero.specialAbility
            ],
            "eventContext": request.eventContext
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            AppLogger.shared.error("Failed to serialize request JSON", category: .api, requestId: String(requestId))
            throw AIServiceError.invalidResponse
        }

        // Log request
        AppLogger.shared.info("Calling backend API: \(backendURL)", category: .illustration, requestId: String(requestId))

        var urlRequest = URLRequest(url: URL(string: backendURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData

        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                AppLogger.shared.error("Invalid HTTP response", category: .api, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            logHTTPResponse(
                statusCode: httpResponse.statusCode,
                headers: httpResponse.allHeaderFields,
                dataSize: data.count,
                responseTime: Date().timeIntervalSince(startTime),
                requestId: String(requestId)
            )

            guard httpResponse.statusCode == 200 else {
                if let errorString = String(data: data, encoding: .utf8) {
                    AppLogger.shared.error("API Error: \(errorString)", category: .api, requestId: String(requestId))
                }
                throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
            }

            // Parse backend response
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let scenesArray = json["scenes"] as? [[String: Any]] else {
                AppLogger.shared.error("Failed to parse backend response", category: .api, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            // Extract reasoning if available
            let reasoning = json["reasoning"] as? String ?? "Scene extraction completed"

            // Convert backend response to StoryScene objects
            let scenes = scenesArray.compactMap { sceneDict -> StoryScene? in
                guard let sceneNumber = sceneDict["sceneNumber"] as? Int,
                      let textSegment = sceneDict["textSegment"] as? String,
                      let illustrationPrompt = sceneDict["illustrationPrompt"] as? String,
                      let timestamp = sceneDict["timestamp"] as? Double,
                      let emotionStr = sceneDict["emotion"] as? String,
                      let importanceStr = sceneDict["importance"] as? String else {
                    return nil
                }

                return StoryScene(
                    sceneNumber: sceneNumber,
                    textSegment: textSegment,
                    illustrationPrompt: illustrationPrompt,
                    timestamp: timestamp,
                    emotion: SceneEmotion(rawValue: emotionStr) ?? .peaceful,
                    importance: SceneImportance(rawValue: importanceStr) ?? .major
                )
            }.sorted { $0.sceneNumber < $1.sceneNumber }

            AppLogger.shared.success("Extracted \(scenes.count) scenes from story via backend", category: .illustration, requestId: String(requestId))
            AppLogger.shared.debug("Scene selection reasoning: \(reasoning)", category: .illustration, requestId: String(requestId))
            AppLogger.shared.logPerformance(operation: "Scene Extraction (Backend)", startTime: startTime, requestId: String(requestId))

            return scenes

        } catch let error as AIServiceError {
            AppLogger.shared.error("AI Service error: \(error)", category: .api, requestId: String(requestId))
            throw error
        } catch {
            AppLogger.shared.error("Network error: \(error.localizedDescription)", category: .api, requestId: String(requestId))
            throw AIServiceError.networkError(error)
        }
    }

    func generateSpeech(text: String, voice: String, language: String) async throws -> Data {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let startTime = Date()

        AppLogger.shared.info("TTS generation started (via backend)", category: .audio, requestId: String(requestId))
        AppLogger.shared.debug("Voice: \(voice), Language: \(language), Text length: \(text.count) characters", category: .audio, requestId: String(requestId))

        // Build backend URL
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/audio/generate"

        // Prepare request body matching backend API format
        let requestBody: [String: Any] = [
            "text": text,
            "voice": voice,
            "language": language
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            AppLogger.shared.error("Failed to encode TTS request JSON", category: .api, requestId: String(requestId))
            throw AIServiceError.invalidResponse
        }

        // Log request
        AppLogger.shared.info("Calling backend API: \(backendURL)", category: .audio, requestId: String(requestId))
        AppLogger.shared.logRequest(url: backendURL, method: "POST", requestId: String(requestId), bodySize: jsonData.count)

        var urlRequest = URLRequest(url: URL(string: backendURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData

        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                AppLogger.shared.error("Invalid HTTP response", category: .api, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            let responseTime = Date().timeIntervalSince(startTime)
            AppLogger.shared.logResponse(statusCode: httpResponse.statusCode, responseTime: responseTime, requestId: String(requestId), dataSize: data.count)

            guard httpResponse.statusCode == 200 else {
                if let errorString = String(data: data, encoding: .utf8) {
                    AppLogger.shared.error("Backend API error: \(errorString)", category: .audio, requestId: String(requestId))
                }
                throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
            }

            // Parse backend response
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let audioBase64 = json["audioData"] as? String,
                  let audioData = Data(base64Encoded: audioBase64) else {
                AppLogger.shared.error("Failed to parse backend audio response", category: .audio, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            AppLogger.shared.success("Audio generated via backend - Size: \(audioData.count / 1024)KB", category: .audio, requestId: String(requestId))
            AppLogger.shared.logPerformance(operation: "TTS generation (Backend)", startTime: startTime, requestId: String(requestId))

            return audioData

        } catch let error as AIServiceError {
            AppLogger.shared.error("TTS generation failed", category: .audio, requestId: String(requestId), error: error)
            throw error
        } catch {
            AppLogger.shared.error("TTS network error", category: .audio, requestId: String(requestId), error: error)
            throw AIServiceError.networkError(error)
        }
    }
    
    /// Get appropriate storytelling instructions based on the selected voice and language
    private func getStorytellingInstructions(for voice: String, language: String) -> String {
        // Voice-specific instructions for optimal children's storytelling
        switch voice.lowercased() {
        case "coral":
            let baseInstructions = "Speak with a warm, gentle, and nurturing tone perfect for bedtime stories. Use a calm and soothing pace with clear pronunciation. Add subtle emotional expressions to bring characters to life while maintaining a peaceful atmosphere that helps children relax and drift off to sleep."
            return baseInstructions + " " + PromptLocalizer.getLanguageInstruction(for: language)
            
        case "nova":
            let baseInstructions = "Use a friendly, cheerful, and engaging storyteller voice that captivates young listeners. Speak clearly at a moderate pace with gentle enthusiasm. Create distinct character voices while keeping the overall tone calming and suitable for bedtime. Emphasize wonder and magic in the narrative."
            return baseInstructions + " " + PromptLocalizer.getLanguageInstruction(for: language)
            
        case "fable":
            let baseInstructions = "Adopt a wise, comforting grandfather-like tone that makes children feel safe and loved. Use a slower, deliberate pace with warm inflections. Add gentle dramatic pauses for effect and speak as if sharing a treasured tale. Keep the voice soft and reassuring throughout."
            return baseInstructions + " " + PromptLocalizer.getLanguageInstruction(for: language)
            
        case "alloy":
            let baseInstructions = "Speak with a clear, pleasant, and neutral tone that's easy for children to understand. Use moderate pacing with good articulation. Add subtle warmth and friendliness while maintaining consistency. Perfect for educational elements in the story."
            return baseInstructions + " " + PromptLocalizer.getLanguageInstruction(for: language)
            
        case "echo":
            let baseInstructions = "Use a soft, dreamy, and ethereal voice that creates a magical atmosphere. Speak gently with a flowing rhythm that mimics the natural cadence of bedtime stories. Add whisper-like qualities for mysterious moments while keeping the overall tone comforting."
            return baseInstructions + " " + PromptLocalizer.getLanguageInstruction(for: language)
            
        case "onyx":
            let baseInstructions = "Deliver the story with a deep, warm, and reassuring voice like a protective parent. Use a slow, steady pace that helps children feel secure. Add gravitas to important moments while maintaining gentleness. Perfect for adventure stories that need to stay calming."
            return baseInstructions + " " + PromptLocalizer.getLanguageInstruction(for: language)
            
        case "shimmer":
            let baseInstructions = "Speak with a bright, melodic, and enchanting voice that sparkles with imagination. Use varied intonation to paint vivid pictures while keeping the energy level appropriate for bedtime. Add musical qualities to dialogue and maintain a soothing undertone throughout."
            return baseInstructions + " " + PromptLocalizer.getLanguageInstruction(for: language)
            
        default:
            // Generic instructions for any voice
            let baseInstructions = "Speak in a warm, gentle, and engaging tone perfect for children's bedtime stories. Use clear pronunciation at a calm, steady pace. Add appropriate emotional expression to bring characters to life while maintaining a soothing atmosphere that helps children relax. Create distinct but subtle character voices and emphasize the wonder and magic of the story."
            return baseInstructions + " " + PromptLocalizer.getLanguageInstruction(for: language)
        }
    }

    /// Dynamically sanitize GPT-Image-1 prompts using backend API to ensure policy compliance
    /// - Parameter originalPrompt: The original GPT-Image-1 prompt that needs sanitization
    /// - Returns: A sanitized prompt that is safe for GPT-Image-1 API
    func sanitizePromptWithAI(_ originalPrompt: String) async throws -> String {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        AppLogger.shared.info("🧹 AI-based prompt sanitization started (via backend)", category: .illustration, requestId: String(requestId))
        AppLogger.shared.debug("Original prompt length: \(originalPrompt.count) characters", category: .illustration, requestId: String(requestId))

        #if DEBUG
        AppLogger.shared.debug("Original prompt for sanitization: \(originalPrompt.prefix(100))...", category: .illustration, requestId: String(requestId))
        #endif

        // Build backend URL
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/ai-assistant/sanitize-prompt"

        // Prepare request body
        let requestBody: [String: Any] = [
            "prompt": originalPrompt
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            AppLogger.shared.error("Failed to serialize request JSON", category: .api, requestId: String(requestId))
            throw AIServiceError.invalidResponse
        }

        AppLogger.shared.info("Calling backend API: \(backendURL)", category: .illustration, requestId: String(requestId))

        var urlRequest = URLRequest(url: URL(string: backendURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData

        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                AppLogger.shared.error("Invalid HTTP response for sanitization", category: .illustration, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            guard httpResponse.statusCode == 200 else {
                AppLogger.shared.error("Sanitization API error: HTTP \(httpResponse.statusCode)", category: .illustration, requestId: String(requestId))

                if let errorString = String(data: data, encoding: .utf8) {
                    AppLogger.shared.error("API error message: \(errorString)", category: .illustration, requestId: String(requestId))
                }

                throw AIServiceError.apiError("Sanitization failed with HTTP \(httpResponse.statusCode)")
            }

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let sanitizedPrompt = json["sanitizedPrompt"] as? String else {
                AppLogger.shared.error("Failed to parse sanitization response", category: .illustration, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            let cleanedPrompt = sanitizedPrompt.trimmingCharacters(in: .whitespacesAndNewlines)

            AppLogger.shared.success("✅ PROMPT SANITIZATION COMPLETE (via backend)", category: .illustration, requestId: String(requestId))
            AppLogger.shared.info("=== SANITIZED PROMPT ===", category: .illustration, requestId: String(requestId))
            AppLogger.shared.debug("Sanitized: \(cleanedPrompt)", category: .illustration, requestId: String(requestId))

            // Log changes made
            if originalPrompt != cleanedPrompt {
                AppLogger.shared.warning("⚠️ Prompt was modified by AI sanitization", category: .illustration, requestId: String(requestId))
                AppLogger.shared.debug("Original length: \(originalPrompt.count) → Sanitized length: \(cleanedPrompt.count)", category: .illustration, requestId: String(requestId))
            } else {
                AppLogger.shared.info("✓ Prompt deemed safe, no changes needed", category: .illustration, requestId: String(requestId))
            }

            return cleanedPrompt

        } catch let error as AIServiceError {
            AppLogger.shared.error("❌ Sanitization failed with AI error", category: .illustration, requestId: String(requestId), error: error)
            throw error
        } catch {
            AppLogger.shared.error("❌ Sanitization network/parsing error", category: .illustration, requestId: String(requestId), error: error)
            throw AIServiceError.networkError(error)
        }
    }

    func generateAvatar(request: AvatarGenerationRequest) async throws -> AvatarGenerationResponse {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let startTime = Date()

        AppLogger.shared.info("Avatar generation started (via backend)", category: .avatar, requestId: String(requestId))
        AppLogger.shared.debug("Hero: \(request.hero.name), Size: \(request.size), Quality: \(request.quality)", category: .avatar, requestId: String(requestId))

        // Build backend URL
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/images/generate-avatar"

        // Prepare request body - backend will handle sanitization
        let requestBody: [String: Any] = [
            "prompt": request.prompt,
            "hero": [
                "name": request.hero.name,
                "primaryTrait": request.hero.primaryTrait.rawValue,
                "secondaryTrait": request.hero.secondaryTrait.rawValue,
                "appearance": request.hero.appearance,
                "specialAbility": request.hero.specialAbility,
                "avatarPrompt": request.hero.avatarPrompt ?? ""
            ],
            "size": request.size,
            "quality": request.quality,
            "previousGenerationId": request.previousGenerationId ?? ""
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            AppLogger.shared.error("Failed to serialize request JSON", category: .api, requestId: String(requestId))
            throw AIServiceError.invalidResponse
        }

        AppLogger.shared.info("Calling backend API: \(backendURL)", category: .avatar, requestId: String(requestId))
        AppLogger.shared.logRequest(url: backendURL, method: "POST", requestId: String(requestId), bodySize: jsonData.count)

        var urlRequest = URLRequest(url: URL(string: backendURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData

        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                AppLogger.shared.error("Invalid HTTP response", category: .api, requestId: String(requestId))
                throw AIServiceError.networkError(URLError(.badServerResponse))
            }

            let responseTime = Date().timeIntervalSince(startTime)
            AppLogger.shared.logResponse(statusCode: httpResponse.statusCode, responseTime: responseTime, requestId: String(requestId), dataSize: data.count)

            guard httpResponse.statusCode == 200 else {
                if let errorString = String(data: data, encoding: .utf8) {
                    AppLogger.shared.error("Backend Error Response: \(errorString)", category: .avatar, requestId: String(requestId))
                }

                if httpResponse.statusCode == 429 {
                    AppLogger.shared.error("Rate limit exceeded", category: .api, requestId: String(requestId))
                    throw AIServiceError.rateLimitExceeded
                }

                throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
            }

            // Parse backend response
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let imageBase64 = json["imageData"] as? String,
                  let imageData = Data(base64Encoded: imageBase64) else {
                AppLogger.shared.error("Failed to parse backend avatar response", category: .api, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            let revisedPrompt = json["revisedPrompt"] as? String
            let generationId = json["generationId"] as? String

            AppLogger.shared.success("Avatar generated via backend - Size: \(imageData.count / 1024)KB", category: .avatar, requestId: String(requestId))

            if let generationId = generationId {
                AppLogger.shared.info("Avatar generation ID extracted: \(generationId)", category: .avatar, requestId: String(requestId))
            } else {
                AppLogger.shared.warning("No generation ID found in avatar response", category: .avatar, requestId: String(requestId))
            }

            // Log usage info if available
            if let usage = json["usage"] as? [String: Any],
               let totalTokens = usage["total_tokens"] as? Int {
                AppLogger.shared.info("GPT-Image-1 avatar token usage - Total: \(totalTokens)", category: .avatar, requestId: String(requestId))
            }

            AppLogger.shared.logPerformance(operation: "Avatar Generation (Backend)", startTime: startTime, requestId: String(requestId))

            return AvatarGenerationResponse(
                imageData: imageData,
                revisedPrompt: revisedPrompt,
                generationId: generationId
            )

        } catch let error as AIServiceError {
            AppLogger.shared.logDALLEResponse(success: false, requestId: String(requestId), error: error)
            throw error
        } catch {
            AppLogger.shared.error("Network error during avatar generation", category: .api, requestId: String(requestId), error: error)
            AppLogger.shared.logDALLEResponse(success: false, requestId: String(requestId), error: error)
            throw AIServiceError.networkError(error)
        }
    }

    func generateSceneIllustration(prompt: String, hero: Hero, previousGenerationId: String?) async throws -> SceneIllustrationResponse {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let startTime = Date()

        AppLogger.shared.info("Scene Illustration Generation Started (via backend)", category: .illustration, requestId: String(requestId))
        AppLogger.shared.info("Hero: \(hero.name)", category: .illustration, requestId: String(requestId))

        if let previousGenerationId = previousGenerationId {
            AppLogger.shared.info("Using previous generation ID for consistency: \(previousGenerationId)", category: .illustration, requestId: String(requestId))
        } else {
            AppLogger.shared.debug("No previous generation ID provided - first illustration or fallback", category: .illustration, requestId: String(requestId))
        }

        // Build backend URL
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/images/generate-illustration"

        // Prepare request body - backend will handle enhancement and sanitization
        let requestBody: [String: Any] = [
            "prompt": prompt,
            "hero": [
                "name": hero.name,
                "primaryTrait": hero.primaryTrait.rawValue,
                "secondaryTrait": hero.secondaryTrait.rawValue,
                "appearance": hero.appearance,
                "specialAbility": hero.specialAbility,
                "avatarPrompt": hero.avatarPrompt ?? ""
            ],
            "previousGenerationId": previousGenerationId ?? ""
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            AppLogger.shared.error("Failed to serialize request JSON", category: .api, requestId: String(requestId))
            throw AIServiceError.invalidResponse
        }

        AppLogger.shared.info("Calling backend API: \(backendURL)", category: .illustration, requestId: String(requestId))
        AppLogger.shared.logRequest(url: backendURL, method: "POST", requestId: String(requestId), bodySize: jsonData.count)

        var urlRequest = URLRequest(url: URL(string: backendURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData

        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                AppLogger.shared.error("Invalid HTTP response", category: .api, requestId: String(requestId))
                throw AIServiceError.networkError(URLError(.badServerResponse))
            }

            let responseTime = Date().timeIntervalSince(startTime)
            AppLogger.shared.logResponse(statusCode: httpResponse.statusCode, responseTime: responseTime, requestId: String(requestId), dataSize: data.count)

            guard httpResponse.statusCode == 200 else {
                if let errorString = String(data: data, encoding: .utf8) {
                    AppLogger.shared.error("Backend Error Response: \(errorString)", category: .illustration, requestId: String(requestId))
                }

                if httpResponse.statusCode == 429 {
                    AppLogger.shared.error("Rate limit exceeded", category: .api, requestId: String(requestId))
                    throw AIServiceError.rateLimitExceeded
                }

                throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
            }

            // Parse backend response
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let imageBase64 = json["imageData"] as? String,
                  let imageData = Data(base64Encoded: imageBase64) else {
                AppLogger.shared.error("Failed to parse backend illustration response", category: .api, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            let revisedPrompt = json["revisedPrompt"] as? String
            let generationId = json["generationId"] as? String

            AppLogger.shared.success("Scene illustration generated via backend - Size: \(imageData.count / 1024)KB", category: .illustration, requestId: String(requestId))

            if let generationId = generationId {
                AppLogger.shared.info("Scene illustration generation ID extracted: \(generationId)", category: .illustration, requestId: String(requestId))
            } else {
                AppLogger.shared.warning("No generation ID found in scene illustration response", category: .illustration, requestId: String(requestId))
            }

            // Log usage info if available
            if let usage = json["usage"] as? [String: Any],
               let totalTokens = usage["total_tokens"] as? Int {
                AppLogger.shared.info("GPT-Image-1 illustration token usage - Total: \(totalTokens)", category: .illustration, requestId: String(requestId))
            }

            AppLogger.shared.logPerformance(operation: "Scene Illustration Generation (Backend)", startTime: startTime, requestId: String(requestId))

            return SceneIllustrationResponse(
                imageData: imageData,
                revisedPrompt: revisedPrompt,
                generationId: generationId
            )

        } catch let error as AIServiceError {
            AppLogger.shared.logDALLEResponse(success: false, requestId: String(requestId), error: error)
            throw error
        } catch {
            AppLogger.shared.error("Network error during illustration generation", category: .api, requestId: String(requestId), error: error)
            AppLogger.shared.logDALLEResponse(success: false, requestId: String(requestId), error: error)
            throw AIServiceError.networkError(error)
        }
    }

    private func enhanceIllustrationPrompt(_ prompt: String, hero: Hero) -> String {
        // Add consistent style guidelines for children's book illustrations
        let styleGuidance = """
        Create a beautiful children's book illustration in a warm, whimsical style. \
        Use soft colors, gentle lighting, and a magical atmosphere. \
        The art style should be similar to modern children's picture books with \
        watercolor or soft digital painting techniques. \
        Ensure the image is appropriate for children aged 4-10. \
        Avoid any scary, violent, or inappropriate content. \
        Focus on creating a sense of wonder and joy.
        """

        // Build comprehensive hero consistency requirements
        var heroConsistency = """
        The main character \(hero.name) should be clearly visible and match this EXACT description: \
        \(hero.appearance.isEmpty ? "a lovable, friendly character" : hero.appearance).
        """

        // Include avatar prompt for maximum consistency if available
        if let avatarPrompt = hero.avatarPrompt {
            heroConsistency += """


            VISUAL REFERENCE (MUST MATCH EXACTLY): \(avatarPrompt)
            """
        }

        // Add trait consistency
        heroConsistency += """


        Character traits: \(hero.primaryTrait.description) and \(hero.secondaryTrait.description) \
        should be reflected in their expression and posture.

        CRITICAL: The character MUST look IDENTICAL to their established appearance. \
        Same hair color, clothing, features, and overall design in every illustration.
        """

        return "\(prompt)\n\n\(heroConsistency)\n\n\(styleGuidance)"
    }

    // Helper method to save illustration image to file system
    func saveIllustrationImage(_ imageData: Data, for storyId: UUID, sceneNumber: Int) throws -> String {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let illustrationsPath = documentsPath.appendingPathComponent("StoryIllustrations")

        // Create directory if it doesn't exist
        try FileManager.default.createDirectory(at: illustrationsPath, withIntermediateDirectories: true, attributes: nil)

        // Create unique filename
        let timestamp = Int(Date().timeIntervalSince1970)
        let filename = "\(storyId.uuidString)_scene\(sceneNumber)_\(timestamp).jpg"
        let fileURL = illustrationsPath.appendingPathComponent(filename)

        // Save image data
        try imageData.write(to: fileURL)

        print("🎨 💾 Saved illustration to: \(filename)")
        return filename
    }

    // Batch generation method for multiple scenes
    func generateIllustrationsForScenes(_ scenes: [StoryScene], hero: Hero, storyId: UUID) async -> [(scene: StoryScene, imageData: Data?, error: Error?)] {
        var results: [(scene: StoryScene, imageData: Data?, error: Error?)] = []

        // Sort scenes by sceneNumber to ensure correct order
        let sortedScenes = scenes.sorted { $0.sceneNumber < $1.sceneNumber }

        // Track the last successful generation ID for chaining
        var lastGenerationId: String? = hero.avatarGenerationId

        AppLogger.shared.info("Starting batch illustration generation for \(sortedScenes.count) scenes", category: .illustration)
        if let avatarGenId = hero.avatarGenerationId {
            AppLogger.shared.debug("Initial generation ID from hero avatar: \(avatarGenId)", category: .illustration)
        } else {
            AppLogger.shared.warning("Hero has no avatar generation ID, visual consistency may be limited", category: .illustration)
        }

        for (index, scene) in sortedScenes.enumerated() {
            do {
                AppLogger.shared.info("Generating illustration for scene \(scene.sceneNumber) (\(index + 1)/\(sortedScenes.count))", category: .illustration)

                // Use the last successful generation ID for visual consistency chaining
                let response = try await generateSceneIllustration(
                    prompt: scene.illustrationPrompt,
                    hero: hero,
                    previousGenerationId: lastGenerationId
                )

                // Update the last generation ID if we got a new one
                if let newGenerationId = response.generationId {
                    AppLogger.shared.debug("Scene \(scene.sceneNumber) generated with ID: \(newGenerationId)", category: .illustration)
                    lastGenerationId = newGenerationId
                } else {
                    AppLogger.shared.warning("Scene \(scene.sceneNumber) did not return a generation ID", category: .illustration)
                }

                results.append((scene: scene, imageData: response.imageData, error: nil))
                AppLogger.shared.success("Successfully generated illustration for scene \(scene.sceneNumber)", category: .illustration)

                // Add delay between requests to avoid rate limits (except for the last scene)
                if index < sortedScenes.count - 1 {
                    try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay
                }
            } catch {
                AppLogger.shared.error("Failed to generate illustration for scene \(scene.sceneNumber): \(error)", category: .illustration)
                results.append((scene: scene, imageData: nil, error: error))

                // Continue using the last successful generation ID to maintain some consistency
                // even when individual scenes fail
                AppLogger.shared.info("Continuing with last successful generation ID for consistency", category: .illustration)
            }
        }

        let successCount = results.filter { $0.imageData != nil }.count
        AppLogger.shared.info("Batch illustration generation completed: \(successCount)/\(sortedScenes.count) successful", category: .illustration)

        return results
    }

    func generatePictogram(prompt: String) async throws -> Data {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        AppLogger.shared.info("Pictogram generation started (via backend)", category: .illustration, requestId: String(requestId))

        // Build backend URL
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/images/generate-pictogram"

        // Prepare request body
        let requestBody: [String: Any] = [
            "prompt": prompt
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            AppLogger.shared.error("Failed to serialize request JSON", category: .api, requestId: String(requestId))
            throw AIServiceError.invalidResponse
        }

        var urlRequest = URLRequest(url: URL(string: backendURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData

        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw AIServiceError.invalidResponse
            }

            guard httpResponse.statusCode == 200 else {
                throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
            }

            // Parse response
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let imageDataBase64 = json["imageData"] as? String,
                  let imageData = Data(base64Encoded: imageDataBase64) else {
                AppLogger.shared.error("Failed to parse pictogram response", category: .api, requestId: String(requestId))
                throw AIServiceError.invalidResponse
            }

            AppLogger.shared.success("Pictogram generated successfully via backend", category: .illustration, requestId: String(requestId))
            return imageData

        } catch {
            AppLogger.shared.error("Pictogram generation failed", category: .illustration, requestId: String(requestId), error: error)
            throw error
        }
    }

    func cancelCurrentTask() {
        print("🚫 Cancelling current AI service task")
        currentTask?.cancel()
        currentTask = nil
    }

    // MARK: - Comprehensive HTTP Request Logging

    private func logFullHTTPRequest(
        url: String,
        method: String,
        headers: [String: String],
        bodyData: Data?,
        requestId: String
    ) {
        print("\n")
        print("=== OpenAI API Request ===")
        print("Request ID: \(requestId)")
        print("Timestamp: \(Date())")
        print("URL: \(url)")
        print("Method: \(method)")
        print("Headers:")
        for (key, value) in headers {
            print("  \(key): \(value)")
        }

        if let bodyData = bodyData {
            print("Body Size: \(bodyData.count) bytes")
            if let prettyJson = try? JSONSerialization.jsonObject(with: bodyData, options: []),
               let prettyData = try? JSONSerialization.data(withJSONObject: prettyJson, options: [.prettyPrinted]),
               let prettyString = String(data: prettyData, encoding: .utf8) {
                print("Body (formatted JSON):")
                print(prettyString)
            } else if let bodyString = String(data: bodyData, encoding: .utf8) {
                print("Body (raw):")
                print(bodyString)
            }
        }
        print("=== End Request ===\n")

        // Also log to AppLogger for persistence
        AppLogger.shared.info("HTTP Request to \(url)", category: .api, requestId: requestId)
        AppLogger.shared.debug("Method: \(method), Body size: \(bodyData?.count ?? 0) bytes", category: .api, requestId: requestId)
    }

    private func logHTTPResponse(
        statusCode: Int,
        headers: [AnyHashable: Any],
        dataSize: Int,
        responseTime: TimeInterval,
        requestId: String
    ) {
        print("\n")
        print("=== OpenAI API Response ===")
        print("Request ID: \(requestId)")
        print("Status Code: \(statusCode)")
        print("Response Time: \(String(format: "%.2f", responseTime)) seconds")
        print("Data Size: \(dataSize) bytes (\(dataSize / 1024) KB)")
        print("Headers:")
        for (key, value) in headers {
            if let keyStr = key as? String {
                print("  \(keyStr): \(value)")
            }
        }
        print("=== End Response ===\n")

        // Also log to AppLogger
        AppLogger.shared.info("HTTP Response: \(statusCode)", category: .api, requestId: requestId)
        AppLogger.shared.debug("Response time: \(String(format: "%.2f", responseTime))s, Size: \(dataSize / 1024)KB", category: .api, requestId: requestId)
    }
}
