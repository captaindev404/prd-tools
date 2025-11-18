//
//  APIClient.swift
//  InfiniteStories
//
//  HTTP client for backend API communication with authentication and retry logic
//

import Foundation

// MARK: - Protocol

protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T>
    func upload(_ data: Data, to endpoint: Endpoint) async throws -> URL
    func download(from url: URL) async throws -> Data
}

// MARK: - Implementation

@MainActor
class APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let retryPolicy: RetryPolicy
    private weak var authManager: AuthManager?

    /// Initialize API client
    /// - Parameters:
    ///   - baseURL: Base URL for the API (e.g., https://api.infinitestories.com)
    ///   - authManager: Auth manager for token injection
    ///   - retryPolicy: Retry policy for failed requests
    init(
        baseURL: URL,
        authManager: AuthManager? = nil,
        retryPolicy: RetryPolicy = .default
    ) {
        self.baseURL = baseURL
        self.authManager = authManager
        self.retryPolicy = retryPolicy

        // Configure URLSession
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.waitsForConnectivity = true
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData

        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Request Methods

    /// Make an API request with automatic retry
    /// - Parameter endpoint: API endpoint to call
    /// - Returns: Decoded API response
    /// - Throws: APIError if request fails after retries
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        return try await retryPolicy.execute {
            try await self.performRequest(endpoint)
        }
    }

    /// Perform a single request attempt (no retry)
    private func performRequest<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        // Build URL with query parameters
        var urlComponents = URLComponents(
            url: baseURL.appendingPathComponent(endpoint.path),
            resolvingAgainstBaseURL: false
        )
        urlComponents?.queryItems = endpoint.queryItems

        guard let url = urlComponents?.url else {
            throw APIError.unknown(NSError(domain: "Invalid URL", code: -1))
        }

        // Build request
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.httpBody = endpoint.body

        // Add headers
        for (key, value) in endpoint.headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        // Add authentication token
        if let token = try? authManager?.getSessionToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Log request
        Logger.api.info("→ \(endpoint.method.rawValue) \(endpoint.path)")

        // Execute request
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown(NSError(domain: "Invalid response", code: -1))
        }

        // Log response
        Logger.api.info("← \(httpResponse.statusCode) \(endpoint.path)")

        // Handle HTTP errors
        if !(200...299).contains(httpResponse.statusCode) {
            try await handleHTTPError(httpResponse, data: data)
        }

        // Decode response
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        do {
            let apiResponse = try decoder.decode(APIResponse<T>.self, from: data)
            return apiResponse
        } catch {
            Logger.api.error("Failed to decode response: \(error)")
            throw APIError.decodingError(error)
        }
    }

    /// Handle HTTP errors with automatic token refresh for 401
    private func handleHTTPError(_ response: HTTPURLResponse, data: Data) async throws {
        // Handle 401 with token refresh
        if response.statusCode == 401 {
            Logger.auth.warning("⚠️ Received 401, attempting token refresh...")

            do {
                try await authManager?.refreshSession()
                // Token refreshed, the retry policy will handle re-executing the request
                throw APIError.unauthorized

            } catch {
                // Refresh failed, sign out user
                Logger.auth.error("❌ Token refresh failed, signing out")
                try? await authManager?.signOut()
                throw APIError.unauthorized
            }
        }

        // Map other HTTP errors
        throw APIError.from(httpStatusCode: response.statusCode, data: data)
    }

    // MARK: - Upload Methods

    /// Upload file data to backend
    /// - Parameters:
    ///   - data: File data to upload
    ///   - endpoint: Upload endpoint
    /// - Returns: URL of uploaded file on R2
    /// - Throws: APIError if upload fails
    func upload(_ data: Data, to endpoint: Endpoint) async throws -> URL {
        // Build multipart form data
        let boundary = UUID().uuidString
        var body = Data()

        // Add file data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"file.dat\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        // Build request
        let url = baseURL.appendingPathComponent(endpoint.path)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = body

        // Add authentication
        if let token = try? authManager?.getSessionToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        Logger.api.info("→ UPLOAD \(endpoint.path) (\(data.count) bytes)")

        // Execute upload
        let (responseData, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown(NSError(domain: "Invalid response", code: -1))
        }

        Logger.api.info("← \(httpResponse.statusCode) UPLOAD \(endpoint.path)")

        // Handle errors
        if !(200...299).contains(httpResponse.statusCode) {
            try await handleHTTPError(httpResponse, data: responseData)
        }

        // Parse response for URL
        let decoder = JSONDecoder()
        struct UploadResponse: Decodable {
            let url: String
        }

        do {
            let uploadResponse = try decoder.decode(APIResponse<UploadResponse>.self, from: responseData)
            guard let urlString = uploadResponse.data?.url,
                  let url = URL(string: urlString) else {
                throw APIError.decodingError(NSError(domain: "No URL in response", code: -1))
            }
            return url
        } catch {
            throw APIError.decodingError(error)
        }
    }

    /// Download file from URL
    /// - Parameter url: File URL (R2 or other)
    /// - Returns: File data
    /// - Throws: APIError if download fails
    func download(from url: URL) async throws -> Data {
        Logger.api.info("→ DOWNLOAD \(url.lastPathComponent)")

        let (data, response) = try await session.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown(NSError(domain: "Invalid response", code: -1))
        }

        Logger.api.info("← \(httpResponse.statusCode) DOWNLOAD (\(data.count) bytes)")

        if !(200...299).contains(httpResponse.statusCode) {
            throw APIError.from(httpStatusCode: httpResponse.statusCode)
        }

        return data
    }

    /// Download file with progress tracking
    /// - Parameters:
    ///   - url: File URL
    ///   - progressHandler: Progress callback (0.0 to 1.0)
    /// - Returns: File data
    func downloadWithProgress(
        from url: URL,
        progressHandler: @escaping (Double) -> Void
    ) async throws -> Data {
        Logger.api.info("→ DOWNLOAD \(url.lastPathComponent) (with progress)")

        return try await withCheckedThrowingContinuation { continuation in
            let task = session.downloadTask(with: url) { localURL, response, error in
                if let error = error {
                    continuation.resume(throwing: APIError.networkError(error))
                    return
                }

                guard let httpResponse = response as? HTTPURLResponse else {
                    continuation.resume(throwing: APIError.unknown(NSError(domain: "Invalid response", code: -1)))
                    return
                }

                if !(200...299).contains(httpResponse.statusCode) {
                    continuation.resume(throwing: APIError.from(httpStatusCode: httpResponse.statusCode))
                    return
                }

                guard let localURL = localURL,
                      let data = try? Data(contentsOf: localURL) else {
                    continuation.resume(throwing: APIError.unknown(NSError(domain: "No data", code: -1)))
                    return
                }

                Logger.api.info("← \(httpResponse.statusCode) DOWNLOAD (\(data.count) bytes)")
                continuation.resume(returning: data)
            }

            // Observe progress
            let observation = task.progress.observe(\.fractionCompleted) { progress, _ in
                DispatchQueue.main.async {
                    progressHandler(progress.fractionCompleted)
                }
            }

            task.resume()

            // Cleanup observation when task completes
            task.completionHandler = { _, _, _ in
                observation.invalidate()
            }
        }
    }
}

// MARK: - Shared Instance

extension APIClient {
    /// Shared API client instance
    /// Configure with proper base URL before use
    static let shared: APIClient = {
        // Default to production URL
        let baseURL = URL(string: "https://api.infinitestories.com")!
        return APIClient(baseURL: baseURL)
    }()

    /// Configure the shared instance
    /// - Parameters:
    ///   - baseURL: API base URL
    ///   - authManager: Auth manager for token injection
    func configure(baseURL: URL, authManager: AuthManager) {
        // Note: This is a simplified configuration
        // In production, you might want to recreate the shared instance
    }
}
