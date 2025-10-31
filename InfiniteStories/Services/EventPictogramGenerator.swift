//
//  EventPictogramGenerator.swift
//  InfiniteStories
//
//  Simplified wrapper for pictogram generation via backend
//

import Foundation
import UIKit
import SwiftUI

@MainActor
class EventPictogramGenerator: ObservableObject {
    @Published var isGenerating = false
    @Published var generationError: String?
    @Published var currentOperation: String = ""
    @Published var generationProgress: Double = 0.0

    private let aiService = OpenAIService()

    /// Generate a pictogram for a custom event using backend API
    func generatePictogram(
        for event: CustomStoryEvent,
        style: PictogramStyle,
        regenerate: Bool = false
    ) async throws -> URL {
        isGenerating = true
        generationError = nil
        currentOperation = "Generating pictogram..."
        generationProgress = 0.3

        // Create a simple prompt for pictogram generation
        let prompt = "Simple icon-style illustration for: \(event.title). \(event.eventDescription). Style: \(style.rawValue), clean, minimalist, child-friendly icon."

        generationProgress = 0.6
        currentOperation = "Calling backend API..."

        // Use dedicated pictogram endpoint
        let imageData = try await aiService.generatePictogram(prompt: prompt)

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
    func deletePictogram(for event: CustomStoryEvent) async {
        guard let pictogramPath = event.pictogramPath else { return }

        let fileManager = FileManager.default
        let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let fullPath = documentsPath.appendingPathComponent(pictogramPath)

        if fileManager.fileExists(atPath: fullPath.path) {
            try? fileManager.removeItem(at: fullPath)
        }
    }
}
