//
//  APIError.swift
//  InfiniteStories
//
//  API error types with localized descriptions
//

import Foundation

enum APIError: Error {
    case networkUnavailable    // No internet connection
    case unauthorized           // 401 - Token expired/invalid
    case forbidden             // 403 - No access to resource
    case notFound              // 404 - Resource doesn't exist
    case rateLimitExceeded(resetAt: Date) // 429 - Too many requests
    case validationError(fields: [String: String]) // 400 - Invalid input
    case serverError           // 500 - Backend error
    case networkError(Error)   // Network connectivity issues
    case decodingError(Error)  // JSON parsing failed
    case unknown(Error)        // Unexpected error
}

extension APIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .networkUnavailable:
            return "No internet connection. Please connect to WiFi or cellular data to continue."

        case .unauthorized:
            return "Your session has expired. Please sign in again."

        case .forbidden:
            return "You don't have permission to access this resource."

        case .notFound:
            return "The requested resource was not found."

        case .rateLimitExceeded(let resetAt):
            let formatter = DateFormatter()
            formatter.timeStyle = .short
            formatter.dateStyle = .none
            return "Rate limit exceeded. Try again at \(formatter.string(from: resetAt))."

        case .validationError(let fields):
            let messages = fields.values.joined(separator: ", ")
            return "Validation error: \(messages)"

        case .serverError:
            return "A server error occurred. Please try again later."

        case .networkError(let error):
            return "Network connection failed: \(error.localizedDescription)"

        case .decodingError(let error):
            return "Failed to process server response: \(error.localizedDescription)"

        case .unknown(let error):
            return "An unexpected error occurred: \(error.localizedDescription)"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .networkUnavailable:
            return "Check your internet connection and try again."

        case .unauthorized:
            return "Sign in again to continue."

        case .forbidden:
            return "Check your account permissions."

        case .notFound:
            return "The item may have been deleted."

        case .rateLimitExceeded:
            return "Wait a few minutes before trying again."

        case .validationError:
            return "Check your input and try again."

        case .serverError:
            return "Wait a few moments and try again."

        case .networkError:
            return "Check your internet connection and try again."

        case .decodingError:
            return "Please try again or contact support."

        case .unknown:
            return "Try again or contact support if the problem persists."
        }
    }

    var failureReason: String? {
        switch self {
        case .networkUnavailable:
            return "Device is not connected to the internet."

        case .unauthorized:
            return "Your authentication token is invalid or expired."

        case .forbidden:
            return "You don't have the required permissions."

        case .notFound:
            return "The server couldn't find the requested resource."

        case .rateLimitExceeded(let resetAt):
            return "You've made too many requests. Limit resets at \(resetAt)."

        case .validationError(let fields):
            return "Invalid data: \(fields.keys.joined(separator: ", "))"

        case .serverError:
            return "The server encountered an internal error."

        case .networkError:
            return "Unable to connect to the server."

        case .decodingError:
            return "The server response was malformed."

        case .unknown:
            return "An unexpected error occurred."
        }
    }
}

// MARK: - Helper for HTTP Response Mapping

extension APIError {
    static func from(httpStatusCode: Int, data: Data? = nil) -> APIError {
        switch httpStatusCode {
        case 401:
            return .unauthorized

        case 403:
            return .forbidden

        case 404:
            return .notFound

        case 429:
            // Try to parse rate limit reset time from response
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let resetAtString = json["resetAt"] as? String,
               let resetAt = ISO8601DateFormatter().date(from: resetAtString) {
                return .rateLimitExceeded(resetAt: resetAt)
            }
            return .rateLimitExceeded(resetAt: Date().addingTimeInterval(3600)) // Default: 1 hour

        case 400:
            // Try to parse validation errors
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorData = json["error"] as? [String: Any],
               let details = errorData["details"] as? [String: String] {
                return .validationError(fields: details)
            }
            return .validationError(fields: ["general": "Invalid request"])

        case 500...599:
            return .serverError

        default:
            return .unknown(NSError(domain: "HTTP", code: httpStatusCode, userInfo: [
                NSLocalizedDescriptionKey: "HTTP error \(httpStatusCode)"
            ]))
        }
    }
}
