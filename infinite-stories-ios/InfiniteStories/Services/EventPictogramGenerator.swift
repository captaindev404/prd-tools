//
//  EventPictogramGenerator.swift
//  InfiniteStories
//
//  Simplified wrapper for pictogram generation via backend
//

import Foundation
import UIKit
import SwiftUI

/// Style options for pictogram generation
enum PictogramStyle: String, CaseIterable {
    case cartoon = "cartoon"
    case minimal = "minimal"
    case watercolor = "watercolor"
    case flat = "flat"

    var displayName: String {
        switch self {
        case .cartoon: return "Cartoon"
        case .minimal: return "Minimal"
        case .watercolor: return "Watercolor"
        case .flat: return "Flat"
        }
    }
}

@MainActor
class EventPictogramGenerator: ObservableObject {
    @Published var isGenerating = false
    @Published var generationError: String?
    @Published var currentOperation: String = ""
    @Published var generationProgress: Double = 0.0

    /// Generate a pictogram for a custom event using backend API
    func generatePictogram(
        for event: CustomStoryEvent,
        style: PictogramStyle,
        regenerate: Bool = false
    ) async throws -> URL {
        // Check network connectivity
        guard NetworkMonitor.shared.isConnected else {
            throw NSError(domain: "EventPictogramGenerator", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "No internet connection"])
        }

        isGenerating = true
        generationError = nil
        currentOperation = "Generating pictogram..."
        generationProgress = 0.3

        // Create a simple prompt for pictogram generation
        let prompt = "Simple icon-style illustration for: \(event.title). \(event.description). Style: \(style.rawValue), clean, minimalist, child-friendly icon."

        generationProgress = 0.6
        currentOperation = "Calling backend API..."

        // Call backend pictogram generation endpoint
        let imageData = try await generatePictogramViaBackend(prompt: prompt)

        generationProgress = 0.9
        currentOperation = "Processing image..."

        guard let image = UIImage(data: imageData) else {
            isGenerating = false
            currentOperation = "Failed"
            generationProgress = 0.0
            throw NSError(domain: "EventPictogramGenerator", code: 1,
                        userInfo: [NSLocalizedDescriptionKey: "Failed to create image from data"])
        }

        // Save to disk
        let fileURL = try saveImageToDisk(image: image, event: event)

        isGenerating = false
        currentOperation = "Complete!"
        generationProgress = 1.0

        return fileURL
    }

    private func generatePictogramViaBackend(prompt: String) async throws -> Data {
        let backendURL = "\(AppConfiguration.backendBaseURL)/api/v1/images/generate-pictogram"

        guard let url = URL(string: backendURL) else {
            throw NSError(domain: "EventPictogramGenerator", code: -2,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid backend URL"])
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add auth header if available
        if let token = AuthStateManager.shared.sessionToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let requestBody: [String: Any] = ["prompt": prompt]
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "EventPictogramGenerator", code: -3,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid response from server"])
        }

        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw NSError(domain: "EventPictogramGenerator", code: httpResponse.statusCode,
                        userInfo: [NSLocalizedDescriptionKey: "Backend error (\(httpResponse.statusCode)): \(errorMessage)"])
        }

        // Parse response to get base64 image data
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let base64String = json["imageData"] as? String,
              let imageData = Data(base64Encoded: base64String) else {
            throw NSError(domain: "EventPictogramGenerator", code: -4,
                        userInfo: [NSLocalizedDescriptionKey: "Failed to parse image data from response"])
        }

        return imageData
    }

    private func saveImageToDisk(image: UIImage, event: CustomStoryEvent) throws -> URL {
        guard let imageData = image.pngData() else {
            throw NSError(domain: "EventPictogramGenerator", code: 2,
                        userInfo: [NSLocalizedDescriptionKey: "Failed to convert image to PNG data"])
        }

        let fileManager = FileManager.default
        let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let pictogramsPath = documentsPath.appendingPathComponent("Pictograms")

        // Create directory if needed
        if !fileManager.fileExists(atPath: pictogramsPath.path) {
            try fileManager.createDirectory(at: pictogramsPath, withIntermediateDirectories: true)
        }

        let filename = "pictogram_\(event.id)_\(Date().timeIntervalSince1970).png"
        let fileURL = pictogramsPath.appendingPathComponent(filename)

        try imageData.write(to: fileURL)
        return fileURL
    }

    /// Generate multiple pictograms in batch with progress updates
    func generatePictogramsInBatch(
        for events: [CustomStoryEvent],
        style: PictogramStyle,
        progressHandler: @escaping (Double, String) -> Void
    ) async {
        let totalEvents = events.count
        var completedCount = 0

        for event in events {
            let progress = Double(completedCount) / Double(totalEvents)
            progressHandler(progress, "Generating pictogram \(completedCount + 1) of \(totalEvents)...")

            // Generate pictogram
            do {
                _ = try await generatePictogram(for: event, style: style, regenerate: false)
            } catch {
                print("Failed to generate pictogram for event \(event.title): \(error)")
            }

            completedCount += 1
        }

        progressHandler(1.0, "Complete!")
    }

    /// Delete pictogram file for an event
    /// Note: Pictograms are now managed by the backend API, so local cleanup is no longer needed
    func deletePictogram(for event: CustomStoryEvent) async {
        // Pictograms are stored in backend/R2, no local file to delete
        // This method is kept for API compatibility
    }
}
