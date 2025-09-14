//
//  AIService.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import Foundation

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
}

enum AIServiceError: Error {
    case invalidAPIKey
    case networkError(Error)
    case invalidResponse
    case apiError(String)
    case rateLimitExceeded
}

protocol AIServiceProtocol {
    func generateStory(request: StoryGenerationRequest) async throws -> StoryGenerationResponse
    func generateStoryWithCustomEvent(request: CustomStoryGenerationRequest) async throws -> StoryGenerationResponse
    func generateSpeech(text: String, voice: String, language: String) async throws -> Data
}

class OpenAIService: AIServiceProtocol {
    private let apiKey: String
    private let chatURL = "https://api.openai.com/v1/chat/completions"
    private let ttsURL = "https://api.openai.com/v1/audio/speech"
    
    init(apiKey: String) {
        self.apiKey = apiKey
    }
    
    func generateStory(request: StoryGenerationRequest) async throws -> StoryGenerationResponse {
        print("🤖 === OpenAI Story Generation Started ===")
        print("🤖 Hero: \(request.hero.name)")
        print("🤖 Event: \(request.event.rawValue)")
        print("🤖 Target Duration: \(Int(request.targetDuration/60)) minutes")
        
        guard !apiKey.isEmpty else {
            print("🤖 ❌ Error: API key is empty")
            throw AIServiceError.invalidAPIKey
        }
        
        let prompt = buildPrompt(for: request)
        print("🤖 📝 Generated Prompt:")
        print("🤖 \(prompt)")
        print("🤖 ==================")
        
        let requestBody = [
            "model": "gpt-4o",  // Latest OpenAI model as of 2024
            "messages": [
                [
                    "role": "system",
                    "content": PromptLocalizer.getSystemMessage(for: request.language)
                ],
                [
                    "role": "user",
                    "content": prompt
                ]
            ],
            "max_tokens": 2000,
            "temperature": 0.8
        ] as [String : Any]
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            print("🤖 ❌ Error: Failed to serialize request JSON")
            throw AIServiceError.invalidResponse
        }
        
        print("🤖 🚀 Sending request to OpenAI...")
        if let jsonString = String(data: jsonData, encoding: .utf8) {
            print("🤖 📤 Request Body: \(jsonString)")
        }
        
        var urlRequest = URLRequest(url: URL(string: chatURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.httpBody = jsonData
        
        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)
            
            print("🤖 📥 Received response from OpenAI")
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("🤖 ❌ Error: Invalid HTTP response")
                throw AIServiceError.networkError(URLError(.badServerResponse))
            }
            
            print("🤖 📊 HTTP Status Code: \(httpResponse.statusCode)")
            
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
            
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let choices = json["choices"] as? [[String: Any]],
                  let firstChoice = choices.first,
                  let message = firstChoice["message"] as? [String: Any],
                  let content = message["content"] as? String else {
                print("🤖 ❌ Error: Failed to parse JSON response")
                throw AIServiceError.invalidResponse
            }
            
            print("🤖 ✅ Successfully parsed response")
            print("🤖 📖 Generated Story Content:")
            print("🤖 \(content)")
            print("🤖 ==================")
            
            let result = parseStoryResponse(content: content, request: request)
            print("🤖 📊 Final Result - Title: \(result.title)")
            print("🤖 📊 Final Result - Duration: \(Int(result.estimatedDuration/60)) minutes")
            print("🤖 📊 Final Result - Word Count: \(result.content.split(separator: " ").count)")
            print("🤖 === Story Generation Completed ===")
            
            return result
            
        } catch let error as AIServiceError {
            print("🤖 ❌ AI Service Error: \(error)")
            throw error
        } catch {
            print("🤖 ❌ Network Error: \(error.localizedDescription)")
            throw AIServiceError.networkError(error)
        }
    }
    
    func generateStoryWithCustomEvent(request: CustomStoryGenerationRequest) async throws -> StoryGenerationResponse {
        print("🤖 === OpenAI Custom Story Generation Started ===")
        print("🤖 Hero: \(request.hero.name)")
        print("🤖 Custom Event: \(request.customEvent.title)")
        print("🤖 Target Duration: \(Int(request.targetDuration/60)) minutes")
        
        guard !apiKey.isEmpty else {
            print("🤖 ❌ Error: API key is empty")
            throw AIServiceError.invalidAPIKey
        }
        
        let prompt = buildPromptForCustomEvent(request: request)
        print("🤖 📝 Generated Custom Prompt:")
        print("🤖 \(prompt)")
        print("🤖 ==================")
        
        let requestBody = [
            "model": "gpt-4o",
            "messages": [
                [
                    "role": "system",
                    "content": PromptLocalizer.getSystemMessage(for: request.language)
                ],
                [
                    "role": "user",
                    "content": prompt
                ]
            ],
            "max_tokens": 2000,
            "temperature": 0.8
        ] as [String : Any]
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            print("🤖 ❌ Error: Failed to serialize request JSON")
            throw AIServiceError.invalidResponse
        }
        
        print("🤖 🚀 Sending custom event request to OpenAI...")
        
        var urlRequest = URLRequest(url: URL(string: chatURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.httpBody = jsonData
        
        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)
            
            print("🤖 📥 Received response from OpenAI")
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("🤖 ❌ Error: Invalid HTTP response")
                throw AIServiceError.networkError(URLError(.badServerResponse))
            }
            
            print("🤖 📊 HTTP Status Code: \(httpResponse.statusCode)")
            
            guard httpResponse.statusCode == 200 else {
                if httpResponse.statusCode == 429 {
                    print("🤖 ⏳ Error: Rate limit exceeded")
                    throw AIServiceError.rateLimitExceeded
                }
                print("🤖 ❌ HTTP Error: \(httpResponse.statusCode)")
                throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
            }
            
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let choices = json["choices"] as? [[String: Any]],
                  let firstChoice = choices.first,
                  let message = firstChoice["message"] as? [String: Any],
                  let content = message["content"] as? String else {
                print("🤖 ❌ Error: Failed to parse JSON response")
                throw AIServiceError.invalidResponse
            }
            
            print("🤖 ✅ Successfully parsed custom story response")
            
            let result = parseCustomStoryResponse(content: content, request: request)
            print("🤖 📊 Final Result - Title: \(result.title)")
            print("🤖 📊 Final Result - Duration: \(Int(result.estimatedDuration/60)) minutes")
            print("🤖 === Custom Story Generation Completed ===")
            
            return result
            
        } catch let error as AIServiceError {
            print("🤖 ❌ AI Service Error: \(error)")
            throw error
        } catch {
            print("🤖 ❌ Network Error: \(error.localizedDescription)")
            throw AIServiceError.networkError(error)
        }
    }
    
    private func buildPrompt(for request: StoryGenerationRequest) -> String {
        let targetMinutes = Int(request.targetDuration / 60)
        
        // Build trait description
        let traits = "\(request.hero.primaryTrait.description), \(request.hero.secondaryTrait.description), \(request.hero.appearance.isEmpty ? "lovable appearance" : request.hero.appearance), \(request.hero.specialAbility.isEmpty ? "warm heart" : request.hero.specialAbility)"
        
        // Use localized prompt template
        return PromptLocalizer.getPromptTemplate(
            for: request.language,
            storyLength: targetMinutes,
            hero: request.hero.name,
            traits: traits,
            event: request.event.promptSeed
        )
    }
    
    private func buildPromptForCustomEvent(request: CustomStoryGenerationRequest) -> String {
        let targetMinutes = Int(request.targetDuration / 60)
        let event = request.customEvent
        
        // Build trait description
        let traits = "\(request.hero.primaryTrait.description), \(request.hero.secondaryTrait.description), \(request.hero.appearance.isEmpty ? "lovable appearance" : request.hero.appearance), \(request.hero.specialAbility.isEmpty ? "warm heart" : request.hero.specialAbility)"
        
        // Build enhanced prompt with custom event details
        var prompt = PromptLocalizer.getPromptTemplate(
            for: request.language,
            storyLength: targetMinutes,
            hero: request.hero.name,
            traits: traits,
            event: event.promptSeed
        )
        
        // Add additional context from custom event
        if !event.keywords.isEmpty {
            prompt += "\n\nPlease include these elements in the story: \(event.keywords.joined(separator: ", "))"
        }
        
        // Add tone guidance
        prompt += "\n\nThe story should have a \(event.tone.rawValue.lowercased()) tone."
        
        // Add age-appropriate guidance
        prompt += "\nMake sure the story is appropriate for children aged \(event.ageRange.rawValue)."
        
        return prompt
    }
    
    private func parseCustomStoryResponse(content: String, request: CustomStoryGenerationRequest) -> StoryGenerationResponse {
        let lines = content.components(separatedBy: .newlines)
        var title = request.customEvent.title
        var storyContent = content
        
        // Try to extract title if formatted properly
        for line in lines {
            if line.hasPrefix("TITLE:") {
                title = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
                break
            }
        }
        
        // Extract story content after STORY: if present
        if let storyIndex = content.range(of: "STORY:")?.upperBound {
            storyContent = String(content[storyIndex...]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        // Estimate duration based on word count (average 200 words per minute)
        let wordCount = storyContent.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.count
        let estimatedDuration = TimeInterval(wordCount) / 200.0 * 60.0 // Convert to seconds
        
        return StoryGenerationResponse(
            title: title,
            content: storyContent,
            estimatedDuration: estimatedDuration
        )
    }
    
    private func parseStoryResponse(content: String, request: StoryGenerationRequest) -> StoryGenerationResponse {
        let lines = content.components(separatedBy: .newlines)
        var title = "A Magical Adventure"
        var storyContent = content
        
        // Try to extract title if formatted properly
        for line in lines {
            if line.hasPrefix("TITLE:") {
                title = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
                break
            }
        }
        
        // Extract story content after STORY: if present
        if let storyIndex = content.range(of: "STORY:")?.upperBound {
            storyContent = String(content[storyIndex...]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        // Estimate duration based on word count (average 200 words per minute)
        let wordCount = storyContent.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.count
        let estimatedDuration = TimeInterval(wordCount) / 200.0 * 60.0 // Convert to seconds
        
        return StoryGenerationResponse(
            title: title,
            content: storyContent,
            estimatedDuration: estimatedDuration
        )
    }
    
    func generateSpeech(text: String, voice: String, language: String) async throws -> Data {
        print("🎙️ === OpenAI TTS Generation Started ===")
        print("🎙️ Voice: \(voice)")
        print("🎙️ Text length: \(text.count) characters")
        print("🎙️ Text preview: \(text.prefix(50))...")
        
        guard !apiKey.isEmpty else {
            print("🎙️ ❌ Error: API key is empty")
            throw AIServiceError.invalidAPIKey
        }
        
        // Use the gpt-4o-mini-tts model with voice instructions
        return try await generateSpeechWithModel(text: text, voice: voice, language: language)
    }
    
    /// TTS generation using the gpt-4o-mini-tts model with voice instructions
    private func generateSpeechWithModel(text: String, voice: String, language: String) async throws -> Data {
        print("🎙️ Using gpt-4o-mini-tts model with voice instructions")
        
        // Craft child-friendly storytelling instructions based on the voice and language
        let instructions = getStorytellingInstructions(for: voice, language: language)
        
        // Prepare request body with the model and instructions
        let requestBody: [String: Any] = [
            "model": "gpt-4o-mini-tts",
            "input": text,
            "voice": voice,
            "instructions": instructions,
            "response_format": "mp3"
        ]
        
        print("🎙️ 📝 Voice Instructions: \(instructions)")
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            print("🎙️ ❌ Error: Failed to encode JSON")
            throw AIServiceError.invalidResponse
        }
        
        // Create URL request
        var urlRequest = URLRequest(url: URL(string: ttsURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.httpBody = jsonData
        
        print("🎙️ 📤 Making request to OpenAI TTS API...")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("🎙️ 📥 Response status: \(httpResponse.statusCode)")
                
                if httpResponse.statusCode == 200 {
                    print("🎙️ ✅ Audio data received: \(data.count) bytes")
                    print("🎙️ === TTS Generation Completed ===")
                    return data
                } else {
                    // Try to parse error message
                    if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let error = errorJson["error"] as? [String: Any],
                       let message = error["message"] as? String {
                        print("🎙️ ❌ API Error: \(message)")
                        throw AIServiceError.apiError(message)
                    } else {
                        print("🎙️ ❌ HTTP Error: \(httpResponse.statusCode)")
                        throw AIServiceError.invalidResponse
                    }
                }
            } else {
                print("🎙️ ❌ Invalid response type")
                throw AIServiceError.invalidResponse
            }
        } catch let error as AIServiceError {
            print("🎙️ ❌ AI Service Error: \(error)")
            throw error
        } catch {
            print("🎙️ ❌ Network Error: \(error.localizedDescription)")
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
}