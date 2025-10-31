//
//  PictogramRetryManager.swift
//  InfiniteStories
//
//  Simple retry manager for pictogram generation
//

import Foundation
import SwiftUI
import UIKit

@MainActor
class PictogramRetryManager: ObservableObject {
    @Published var retryCount = 0
    @Published var maxRetries = 3

    func canRetry() -> Bool {
        return retryCount < maxRetries
    }

    func incrementRetry() {
        retryCount += 1
    }

    func reset() {
        retryCount = 0
    }

    /// Generate pictogram with retry and save to disk
    func generateWithRetry(
        event: CustomStoryEvent,
        generator: EventPictogramGenerator,
        style: PictogramStyle
    ) async throws -> URL {
        var lastError: Error?

        for attempt in 0...maxRetries {
            do {
                // Generate the pictogram (it now returns URL directly)
                let url = try await generator.generatePictogram(for: event, style: style, regenerate: attempt > 0)
                reset()
                return url
            } catch {
                lastError = error
                if attempt < maxRetries {
                    incrementRetry()
                    // Wait before retry
                    try await Task.sleep(nanoseconds: 1_000_000_000)
                    continue
                }
            }
        }

        throw lastError ?? NSError(domain: "PictogramRetryManager", code: 1,
                                  userInfo: [NSLocalizedDescriptionKey: "Failed to generate pictogram after \(maxRetries) retries"])
    }
}
