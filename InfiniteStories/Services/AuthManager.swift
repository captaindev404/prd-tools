//
//  AuthManager.swift
//  InfiniteStories
//
//  Authentication manager for Better Auth integration with automatic token refresh
//

import Foundation
import Combine

// MARK: - Protocol

protocol AuthManagerProtocol {
    var isAuthenticated: Bool { get }
    var currentUser: User? { get }

    func signUp(email: String, password: String, name: String?) async throws -> AuthResponse
    func signIn(email: String, password: String) async throws -> AuthResponse
    func signOut() async throws
    func refreshSession() async throws -> AuthResponse
    func getSessionToken() throws -> String?
}

// MARK: - Implementation

@MainActor
class AuthManager: ObservableObject, AuthManagerProtocol {
    @Published var isAuthenticated = false
    @Published var currentUser: User?

    private let keychainHelper: KeychainHelper
    private let apiClient: APIClient
    private var refreshTask: Task<Void, Never>?
    private var sessionExpiresAt: Date?

    /// Initialize auth manager
    /// - Parameters:
    ///   - keychainHelper: Keychain helper for token storage
    ///   - apiClient: API client for network requests
    init(keychainHelper: KeychainHelper, apiClient: APIClient) {
        self.keychainHelper = keychainHelper
        self.apiClient = apiClient

        // Check for existing session on init
        if let token = try? keychainHelper.getSessionToken() {
            self.isAuthenticated = true
            Logger.auth.info("Found existing session token")

            // Try to load current user
            Task {
                try? await loadCurrentUser()
            }
        }
    }

    // MARK: - Authentication Methods

    /// Sign up new user
    /// - Parameters:
    ///   - email: User email
    ///   - password: User password
    ///   - name: Optional user name
    /// - Returns: Auth response with user and session
    /// - Throws: APIError if sign up fails
    func signUp(email: String, password: String, name: String?) async throws -> AuthResponse {
        Logger.auth.info("Signing up user: \(email)")

        let endpoint = Endpoint.signUp(email: email, password: password, name: name)
        let response: APIResponse<AuthResponse> = try await apiClient.request(endpoint)

        guard let authResponse = response.data else {
            if let error = response.error {
                throw APIError.validationError(fields: ["general": error.message])
            }
            throw APIError.unknown(NSError(domain: "No auth response", code: -1))
        }

        // Store session token
        try keychainHelper.saveSessionToken(authResponse.session.token)

        // Update state
        self.isAuthenticated = true
        self.currentUser = User(from: authResponse.user)
        self.sessionExpiresAt = authResponse.session.expiresAt

        // Schedule automatic token refresh
        scheduleTokenRefresh(expiresAt: authResponse.session.expiresAt)

        Logger.auth.info("✅ User signed up successfully: \(email)")

        return authResponse
    }

    /// Sign in existing user
    /// - Parameters:
    ///   - email: User email
    ///   - password: User password
    /// - Returns: Auth response with user and session
    /// - Throws: APIError if sign in fails
    func signIn(email: String, password: String) async throws -> AuthResponse {
        Logger.auth.info("Signing in user: \(email)")

        let endpoint = Endpoint.signIn(email: email, password: password)
        let response: APIResponse<AuthResponse> = try await apiClient.request(endpoint)

        guard let authResponse = response.data else {
            if let error = response.error {
                throw APIError.unauthorized
            }
            throw APIError.unknown(NSError(domain: "No auth response", code: -1))
        }

        // Store session token
        try keychainHelper.saveSessionToken(authResponse.session.token)

        // Update state
        self.isAuthenticated = true
        self.currentUser = User(from: authResponse.user)
        self.sessionExpiresAt = authResponse.session.expiresAt

        // Schedule automatic token refresh
        scheduleTokenRefresh(expiresAt: authResponse.session.expiresAt)

        Logger.auth.info("✅ User signed in successfully: \(email)")

        return authResponse
    }

    /// Sign out current user
    /// - Throws: APIError if sign out fails
    func signOut() async throws {
        Logger.auth.info("Signing out user")

        // Call sign-out endpoint
        do {
            let endpoint = Endpoint.signOut
            let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)
        } catch {
            Logger.auth.warning("Sign-out request failed, continuing with local cleanup: \(error)")
        }

        // Clear local session
        try keychainHelper.deleteSessionToken()

        // Update state
        isAuthenticated = false
        currentUser = nil
        sessionExpiresAt = nil

        // Cancel refresh task
        refreshTask?.cancel()
        refreshTask = nil

        Logger.auth.info("✅ User signed out")
    }

    /// Refresh session token before expiry
    /// - Returns: New auth response with refreshed session
    /// - Throws: APIError if refresh fails
    func refreshSession() async throws -> AuthResponse {
        Logger.auth.info("Refreshing session token")

        let endpoint = Endpoint.refreshSession
        let response: APIResponse<AuthResponse> = try await apiClient.request(endpoint)

        guard let authResponse = response.data else {
            Logger.auth.error("❌ Session refresh failed")
            throw APIError.unauthorized
        }

        // Store new token
        try keychainHelper.saveSessionToken(authResponse.session.token)

        // Update expiry
        sessionExpiresAt = authResponse.session.expiresAt

        // Schedule next refresh
        scheduleTokenRefresh(expiresAt: authResponse.session.expiresAt)

        Logger.auth.info("✅ Session refreshed, expires at \(authResponse.session.expiresAt)")

        return authResponse
    }

    /// Get current session token
    /// - Returns: Session token if exists
    /// - Throws: KeychainError if retrieval fails
    func getSessionToken() throws -> String? {
        return try keychainHelper.getSessionToken()
    }

    // MARK: - User Profile

    /// Load current user profile from backend
    private func loadCurrentUser() async throws {
        Logger.auth.info("Loading current user profile")

        let endpoint = Endpoint.getUserProfile
        let response: APIResponse<UserResponse> = try await apiClient.request(endpoint)

        guard let userData = response.data else {
            throw APIError.notFound
        }

        self.currentUser = User(from: userData)

        Logger.auth.info("✅ Loaded user profile: \(userData.email)")
    }

    // MARK: - Token Refresh

    /// Schedule automatic token refresh before expiry
    /// - Parameter expiresAt: Token expiration date
    private func scheduleTokenRefresh(expiresAt: Date) {
        // Cancel existing refresh task
        refreshTask?.cancel()

        // Schedule new refresh 5 minutes before expiry
        refreshTask = Task {
            let refreshTime = expiresAt.addingTimeInterval(-300) // 5 minutes before
            let delay = refreshTime.timeIntervalSinceNow

            guard delay > 0 else {
                Logger.auth.warning("⚠️ Token already expired or expiring soon")
                try? await refreshSession()
                return
            }

            Logger.auth.info("📅 Scheduled token refresh for \(refreshTime)")

            do {
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))

                // Check if task was cancelled
                guard !Task.isCancelled else {
                    Logger.auth.info("Token refresh cancelled")
                    return
                }

                // Refresh token
                try await refreshSession()

            } catch is CancellationError {
                Logger.auth.info("Token refresh task cancelled")
            } catch {
                Logger.auth.error("❌ Auto-refresh failed: \(error)")

                // Sign out user on refresh failure
                try? await signOut()
            }
        }
    }

    // MARK: - Session Validation

    /// Check if session is valid (not expired)
    var isSessionValid: Bool {
        guard let expiresAt = sessionExpiresAt else {
            return false
        }
        return Date() < expiresAt
    }

    /// Get time until session expires
    var timeUntilExpiry: TimeInterval? {
        guard let expiresAt = sessionExpiresAt else {
            return nil
        }
        return expiresAt.timeIntervalSinceNow
    }
}

// MARK: - User Model

/// User model for authentication
struct User: Codable, Identifiable {
    let id: UUID
    let email: String
    let name: String?
    let createdAt: Date

    // Usage statistics
    let totalStoriesGenerated: Int
    let totalAudioGenerated: Int
    let totalIllustrationsGenerated: Int

    init(from response: UserResponse) {
        self.id = response.id
        self.email = response.email
        self.name = response.name
        self.createdAt = response.createdAt
        self.totalStoriesGenerated = response.totalStoriesGenerated ?? 0
        self.totalAudioGenerated = response.totalAudioGenerated ?? 0
        self.totalIllustrationsGenerated = response.totalIllustrationsGenerated ?? 0
    }
}

// MARK: - Shared Instance

extension AuthManager {
    /// Shared auth manager instance
    static let shared: AuthManager = {
        let keychainHelper = KeychainHelper()
        let apiClient = APIClient.shared
        return AuthManager(keychainHelper: keychainHelper, apiClient: apiClient)
    }()
}
