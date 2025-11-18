//
//  RetryPolicy.swift
//  InfiniteStories
//
//  Retry policy with exponential backoff for failed network requests
//

import Foundation

/// Retry policy configuration
struct RetryPolicy {
    let maxRetries: Int
    let baseDelay: TimeInterval
    let maxDelay: TimeInterval

    /// Default retry policy
    /// - 3 max retries
    /// - 1 second base delay
    /// - 30 second max delay
    static let `default` = RetryPolicy(
        maxRetries: 3,
        baseDelay: 1.0,
        maxDelay: 30.0
    )

    /// Aggressive retry policy for critical operations
    static let aggressive = RetryPolicy(
        maxRetries: 5,
        baseDelay: 0.5,
        maxDelay: 60.0
    )

    /// Conservative retry policy for non-critical operations
    static let conservative = RetryPolicy(
        maxRetries: 2,
        baseDelay: 2.0,
        maxDelay: 20.0
    )

    /// Determines if the error should trigger a retry
    /// - Parameters:
    ///   - error: The API error that occurred
    ///   - attempt: Current retry attempt number (0-indexed)
    /// - Returns: True if should retry, false otherwise
    func shouldRetry(_ error: APIError, attempt: Int) -> Bool {
        // Don't retry if max attempts reached
        guard attempt < maxRetries else {
            return false
        }

        // Determine if error is retryable
        switch error {
        case .networkUnavailable, .rateLimitExceeded, .serverError, .networkError:
            return true

        case .unauthorized, .forbidden, .notFound, .validationError:
            return false // These won't succeed on retry

        case .decodingError, .unknown:
            return attempt < 1 // Only retry once for these
        }
    }

    /// Calculate delay before next retry attempt
    /// Uses exponential backoff with jitter
    /// - Parameter attempt: Current retry attempt number (0-indexed)
    /// - Returns: Delay in seconds before next attempt
    func delay(for attempt: Int) -> TimeInterval {
        // Exponential backoff: 2^attempt * baseDelay
        let exponentialDelay = pow(2.0, Double(attempt)) * baseDelay

        // Add jitter (0-1 second random) to prevent thundering herd
        let jitter = Double.random(in: 0...1.0)

        // Cap at maxDelay
        return min(exponentialDelay + jitter, maxDelay)
    }

    /// Calculate all retry delays for visualization
    /// - Returns: Array of delays for each retry attempt
    func allDelays() -> [TimeInterval] {
        return (0..<maxRetries).map { delay(for: $0) }
    }
}

// MARK: - Retry Examples

/*
 Default Policy Delays:
 - Attempt 0: 1-2 seconds
 - Attempt 1: 2-3 seconds
 - Attempt 2: 4-5 seconds
 Total max time: ~10 seconds

 Aggressive Policy Delays:
 - Attempt 0: 0.5-1.5 seconds
 - Attempt 1: 1-2 seconds
 - Attempt 2: 2-3 seconds
 - Attempt 3: 4-5 seconds
 - Attempt 4: 8-9 seconds
 Total max time: ~20 seconds

 Conservative Policy Delays:
 - Attempt 0: 2-3 seconds
 - Attempt 1: 4-5 seconds
 Total max time: ~10 seconds
 */

// MARK: - Retry with Policy

extension RetryPolicy {
    /// Execute an async operation with retry logic
    /// - Parameter operation: The async operation to execute
    /// - Returns: Result of the operation
    /// - Throws: The last error if all retries fail
    func execute<T>(_ operation: @escaping () async throws -> T) async throws -> T {
        var attempt = 0
        var lastError: Error?

        while attempt <= maxRetries {
            do {
                return try await operation()
            } catch let error as APIError {
                lastError = error

                // Check if we should retry
                if !shouldRetry(error, attempt: attempt) {
                    Logger.network.info("Not retrying error: \(error.localizedDescription)")
                    throw error
                }

                // Calculate delay
                let delayDuration = delay(for: attempt)
                Logger.network.info("Retrying after \(String(format: "%.1f", delayDuration))s (attempt \(attempt + 1)/\(maxRetries))")

                // Wait before retry
                try await Task.sleep(nanoseconds: UInt64(delayDuration * 1_000_000_000))

                attempt += 1
            } catch {
                // Non-APIError, don't retry
                lastError = error
                throw error
            }
        }

        // All retries exhausted
        if let error = lastError {
            Logger.network.error("All retry attempts exhausted for error: \(error.localizedDescription)")
            throw error
        }

        throw APIError.unknown(NSError(domain: "RetryPolicy", code: -1, userInfo: [
            NSLocalizedDescriptionKey: "Retry policy exhausted without error"
        ]))
    }
}
