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
    func generateSpeech(text: String, voice: String) async throws -> Data
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
                    "content": "You are a skilled children's storyteller who creates engaging, age-appropriate stories for bedtime. Your stories should be 5-10 minutes long when read aloud, educational, and end on a positive, calming note."
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
    
    private func buildPrompt(for request: StoryGenerationRequest) -> String {
        let targetMinutes = Int(request.targetDuration / 60)
        
        return """
        Create a \(targetMinutes)-minute bedtime story for children aged 3-8 featuring a character named \(request.hero.name).
        
        Character Details:
        - Name: \(request.hero.name)
        - Personality: \(request.hero.primaryTrait.description) and \(request.hero.secondaryTrait.description)
        - Appearance: \(request.hero.appearance.isEmpty ? "a lovable character" : request.hero.appearance)
        - Special Ability: \(request.hero.specialAbility.isEmpty ? "has a warm heart" : request.hero.specialAbility)
        
        Story Context: \(request.event.promptSeed)
        
        Requirements:
        - Age-appropriate language and themes
        - Positive messages about friendship, kindness, courage, or learning
        - Gentle, calming tone suitable for bedtime
        - Include the character's special traits in the story
        - About \(targetMinutes) minutes when read aloud (approximately \(targetMinutes * 200) words)
        - Begin with an engaging title
        - End peacefully to help children wind down
        
        Format your response as:
        TITLE: [Story Title]
        
        STORY:
        [The complete story text]
        """
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
    
    func generateSpeech(text: String, voice: String) async throws -> Data {
        print("🎙️ === OpenAI TTS Generation Started (Enhanced Model) ===")
        print("🎙️ Voice: \(voice)")
        print("🎙️ Text length: \(text.count) characters")
        print("🎙️ Text preview: \(text.prefix(50))...")
        
        guard !apiKey.isEmpty else {
            print("🎙️ ❌ Error: API key is empty")
            throw AIServiceError.invalidAPIKey
        }
        
        // Use the new enhanced TTS model with instructions
        return try await generateSpeechWithInstructions(text: text, voice: voice)
    }
    
    /// Enhanced TTS generation using the new gpt-4o-mini-tts model with voice instructions
    private func generateSpeechWithInstructions(text: String, voice: String) async throws -> Data {
        print("🎙️ 🆕 Using enhanced TTS model with voice instructions")
        
        // Craft child-friendly storytelling instructions based on the voice
        let instructions = getStorytellingInstructions(for: voice)
        
        // Prepare request body with the new model and instructions
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
        
        print("🎙️ 📤 Making request to OpenAI Enhanced TTS API...")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("🎙️ 📥 Response status: \(httpResponse.statusCode)")
                
                if httpResponse.statusCode == 200 {
                    print("🎙️ ✅ Enhanced audio data received: \(data.count) bytes")
                    print("🎙️ === Enhanced TTS Generation Completed ===")
                    return data
                } else if httpResponse.statusCode == 400 || httpResponse.statusCode == 404 {
                    // Fallback to legacy model if new model is not available
                    print("🎙️ ⚠️ New model not available, falling back to legacy TTS...")
                    return try await generateSpeechLegacy(text: text, voice: voice)
                } else {
                    // Try to parse error message
                    if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let error = errorJson["error"] as? [String: Any],
                       let message = error["message"] as? String {
                        print("🎙️ ❌ API Error: \(message)")
                        
                        // If the error is about the model, fallback to legacy
                        if message.contains("model") || message.contains("not found") {
                            print("🎙️ ⚠️ Model error detected, falling back to legacy TTS...")
                            return try await generateSpeechLegacy(text: text, voice: voice)
                        }
                        
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
    
    /// Legacy TTS generation fallback using the older tts-1-hd model
    private func generateSpeechLegacy(text: String, voice: String) async throws -> Data {
        print("🎙️ 📼 Using legacy TTS model (tts-1-hd)")
        
        // Prepare request body with legacy model
        let requestBody: [String: Any] = [
            "model": "tts-1-hd",
            "input": text,
            "voice": voice,
            "response_format": "mp3"
        ]
        
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
        
        print("🎙️ 📤 Making request to OpenAI Legacy TTS API...")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("🎙️ 📥 Response status: \(httpResponse.statusCode)")
                
                if httpResponse.statusCode == 200 {
                    print("🎙️ ✅ Legacy audio data received: \(data.count) bytes")
                    print("🎙️ === Legacy TTS Generation Completed ===")
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
    
    /// Get appropriate storytelling instructions based on the selected voice
    private func getStorytellingInstructions(for voice: String) -> String {
        // Voice-specific instructions for optimal children's storytelling
        switch voice.lowercased() {
        case "coral":
            return "Speak with a warm, gentle, and nurturing tone perfect for bedtime stories. Use a calm and soothing pace with clear pronunciation. Add subtle emotional expressions to bring characters to life while maintaining a peaceful atmosphere that helps children relax and drift off to sleep."
            
        case "nova":
            return "Use a friendly, cheerful, and engaging storyteller voice that captivates young listeners. Speak clearly at a moderate pace with gentle enthusiasm. Create distinct character voices while keeping the overall tone calming and suitable for bedtime. Emphasize wonder and magic in the narrative."
            
        case "fable":
            return "Adopt a wise, comforting grandfather-like tone that makes children feel safe and loved. Use a slower, deliberate pace with warm inflections. Add gentle dramatic pauses for effect and speak as if sharing a treasured tale. Keep the voice soft and reassuring throughout."
            
        case "alloy":
            return "Speak with a clear, pleasant, and neutral tone that's easy for children to understand. Use moderate pacing with good articulation. Add subtle warmth and friendliness while maintaining consistency. Perfect for educational elements in the story."
            
        case "echo":
            return "Use a soft, dreamy, and ethereal voice that creates a magical atmosphere. Speak gently with a flowing rhythm that mimics the natural cadence of bedtime stories. Add whisper-like qualities for mysterious moments while keeping the overall tone comforting."
            
        case "onyx":
            return "Deliver the story with a deep, warm, and reassuring voice like a protective parent. Use a slow, steady pace that helps children feel secure. Add gravitas to important moments while maintaining gentleness. Perfect for adventure stories that need to stay calming."
            
        case "shimmer":
            return "Speak with a bright, melodic, and enchanting voice that sparkles with imagination. Use varied intonation to paint vivid pictures while keeping the energy level appropriate for bedtime. Add musical qualities to dialogue and maintain a soothing undertone throughout."
            
        default:
            // Generic instructions for any voice
            return "Speak in a warm, gentle, and engaging tone perfect for children's bedtime stories. Use clear pronunciation at a calm, steady pace. Add appropriate emotional expression to bring characters to life while maintaining a soothing atmosphere that helps children relax. Create distinct but subtle character voices and emphasize the wonder and magic of the story."
        }
    }
}

