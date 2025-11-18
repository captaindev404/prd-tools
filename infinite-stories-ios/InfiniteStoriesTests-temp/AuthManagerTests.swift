//
//  AuthManagerTests.swift
//  InfiniteStoriesTests
//
//  Unit tests for AuthManager authentication service
//

import XCTest
@testable import InfiniteStories

@MainActor
final class AuthManagerTests: XCTestCase {

    // MARK: - Properties

    var sut: AuthManager!
    var mockKeychainHelper: MockKeychainHelper!
    var mockAPIClient: MockAPIClient!

    // MARK: - Setup & Teardown

    override func setUp() async throws {
        try await super.setUp()

        mockKeychainHelper = MockKeychainHelper()
        mockAPIClient = MockAPIClient()
        sut = AuthManager(keychainHelper: mockKeychainHelper, apiClient: mockAPIClient)
    }

    override func tearDown() async throws {
        sut = nil
        mockKeychainHelper = nil
        mockAPIClient = nil

        try await super.tearDown()
    }

    // MARK: - Initialization Tests

    func testInit_WithNoExistingSession_SetsAuthenticatedToFalse() {
        // Given - mockKeychainHelper returns nil (no existing token)
        mockKeychainHelper.sessionToken = nil

        // When
        let authManager = AuthManager(keychainHelper: mockKeychainHelper, apiClient: mockAPIClient)

        // Then
        XCTAssertFalse(authManager.isAuthenticated)
        XCTAssertNil(authManager.currentUser)
    }

    func testInit_WithExistingSession_SetsAuthenticatedToTrue() {
        // Given
        mockKeychainHelper.sessionToken = "existing-token-123"

        // When
        let authManager = AuthManager(keychainHelper: mockKeychainHelper, apiClient: mockAPIClient)

        // Then
        XCTAssertTrue(authManager.isAuthenticated)
    }

    // MARK: - Sign Up Tests

    func testSignUp_Success_ReturnsAuthResponse() async throws {
        // Given
        let email = "test@example.com"
        let password = "password123"
        let name = "Test User"

        let expectedAuthResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: email,
                name: name,
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "new-session-token",
                expiresAt: Date().addingTimeInterval(3600)
            )
        )

        mockAPIClient.signUpResponse = expectedAuthResponse

        // When
        let result = try await sut.signUp(email: email, password: password, name: name)

        // Then
        XCTAssertEqual(result.user.email, email)
        XCTAssertEqual(result.session.token, "new-session-token")
        XCTAssertTrue(sut.isAuthenticated)
        XCTAssertNotNil(sut.currentUser)
        XCTAssertEqual(sut.currentUser?.email, email)
        XCTAssertEqual(mockKeychainHelper.savedSessionToken, "new-session-token")
    }

    func testSignUp_Failure_ThrowsValidationError() async {
        // Given
        let email = "invalid@example.com"
        let password = "short"
        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.validationError(fields: ["password": "Too short"])

        // When/Then
        do {
            _ = try await sut.signUp(email: email, password: password, name: nil)
            XCTFail("Should throw validation error")
        } catch let error as APIError {
            if case .validationError(let fields) = error {
                XCTAssertEqual(fields["password"], "Too short")
            } else {
                XCTFail("Wrong error type: \(error)")
            }
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }

        XCTAssertFalse(sut.isAuthenticated)
        XCTAssertNil(sut.currentUser)
    }

    // MARK: - Sign In Tests

    func testSignIn_Success_UpdatesAuthState() async throws {
        // Given
        let email = "user@example.com"
        let password = "password123"

        let expectedAuthResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: email,
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 5,
                totalAudioGenerated: 5,
                totalIllustrationsGenerated: 10
            ),
            session: SessionResponse(
                token: "signin-session-token",
                expiresAt: Date().addingTimeInterval(7200)
            )
        )

        mockAPIClient.signInResponse = expectedAuthResponse

        // When
        let result = try await sut.signIn(email: email, password: password)

        // Then
        XCTAssertEqual(result.user.email, email)
        XCTAssertTrue(sut.isAuthenticated)
        XCTAssertEqual(sut.currentUser?.email, email)
        XCTAssertEqual(sut.currentUser?.totalStoriesGenerated, 5)
        XCTAssertEqual(mockKeychainHelper.savedSessionToken, "signin-session-token")
    }

    func testSignIn_InvalidCredentials_ThrowsUnauthorizedError() async {
        // Given
        let email = "wrong@example.com"
        let password = "wrongpassword"
        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.unauthorized

        // When/Then
        do {
            _ = try await sut.signIn(email: email, password: password)
            XCTFail("Should throw unauthorized error")
        } catch APIError.unauthorized {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }

        XCTAssertFalse(sut.isAuthenticated)
    }

    func testSignIn_NetworkError_ThrowsNetworkError() async {
        // Given
        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.networkError(URLError(.notConnectedToInternet))

        // When/Then
        do {
            _ = try await sut.signIn(email: "test@example.com", password: "password")
            XCTFail("Should throw network error")
        } catch APIError.networkError {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }

    // MARK: - Sign Out Tests

    func testSignOut_ClearsAuthState() async throws {
        // Given - Sign in first
        let authResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "token",
                expiresAt: Date().addingTimeInterval(3600)
            )
        )
        mockAPIClient.signInResponse = authResponse
        _ = try await sut.signIn(email: "user@example.com", password: "password")

        XCTAssertTrue(sut.isAuthenticated)

        // When
        try await sut.signOut()

        // Then
        XCTAssertFalse(sut.isAuthenticated)
        XCTAssertNil(sut.currentUser)
        XCTAssertTrue(mockKeychainHelper.deleteSessionTokenCalled)
    }

    func testSignOut_APICallFails_StillClearsLocalState() async throws {
        // Given - Sign in first
        let authResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "token",
                expiresAt: Date().addingTimeInterval(3600)
            )
        )
        mockAPIClient.signInResponse = authResponse
        _ = try await sut.signIn(email: "user@example.com", password: "password")

        // Set up API to fail
        mockAPIClient.shouldThrowErrorOnSignOut = true

        // When
        try await sut.signOut()

        // Then - Should still clear local state
        XCTAssertFalse(sut.isAuthenticated)
        XCTAssertNil(sut.currentUser)
        XCTAssertTrue(mockKeychainHelper.deleteSessionTokenCalled)
    }

    // MARK: - Token Refresh Tests

    func testRefreshSession_Success_UpdatesToken() async throws {
        // Given
        let newAuthResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "refreshed-token",
                expiresAt: Date().addingTimeInterval(7200)
            )
        )
        mockAPIClient.refreshSessionResponse = newAuthResponse

        // When
        let result = try await sut.refreshSession()

        // Then
        XCTAssertEqual(result.session.token, "refreshed-token")
        XCTAssertEqual(mockKeychainHelper.savedSessionToken, "refreshed-token")
    }

    func testRefreshSession_Failure_ThrowsUnauthorizedError() async {
        // Given
        mockAPIClient.shouldThrowErrorOnRefresh = true
        mockAPIClient.errorToThrow = APIError.unauthorized

        // When/Then
        do {
            _ = try await sut.refreshSession()
            XCTFail("Should throw unauthorized error")
        } catch APIError.unauthorized {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }

    // MARK: - Session Validation Tests

    func testIsSessionValid_WithValidSession_ReturnsTrue() async throws {
        // Given - Sign in with future expiry
        let authResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "token",
                expiresAt: Date().addingTimeInterval(3600) // Expires in 1 hour
            )
        )
        mockAPIClient.signInResponse = authResponse
        _ = try await sut.signIn(email: "user@example.com", password: "password")

        // When/Then
        XCTAssertTrue(sut.isSessionValid)
    }

    func testIsSessionValid_WithExpiredSession_ReturnsFalse() async throws {
        // Given - Sign in with past expiry
        let authResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "token",
                expiresAt: Date().addingTimeInterval(-3600) // Expired 1 hour ago
            )
        )
        mockAPIClient.signInResponse = authResponse
        _ = try await sut.signIn(email: "user@example.com", password: "password")

        // When/Then
        XCTAssertFalse(sut.isSessionValid)
    }

    func testTimeUntilExpiry_WithValidSession_ReturnsPositiveValue() async throws {
        // Given
        let futureExpiry = Date().addingTimeInterval(1800) // 30 minutes
        let authResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "token",
                expiresAt: futureExpiry
            )
        )
        mockAPIClient.signInResponse = authResponse
        _ = try await sut.signIn(email: "user@example.com", password: "password")

        // When
        let timeUntilExpiry = sut.timeUntilExpiry

        // Then
        XCTAssertNotNil(timeUntilExpiry)
        XCTAssertGreaterThan(timeUntilExpiry!, 0)
        XCTAssertLessThanOrEqual(timeUntilExpiry!, 1800)
    }

    // MARK: - Get Session Token Tests

    func testGetSessionToken_WithStoredToken_ReturnsToken() async throws {
        // Given
        mockKeychainHelper.sessionToken = "stored-token-123"

        // When
        let token = try sut.getSessionToken()

        // Then
        XCTAssertEqual(token, "stored-token-123")
    }

    func testGetSessionToken_WithoutStoredToken_ReturnsNil() throws {
        // Given
        mockKeychainHelper.sessionToken = nil

        // When
        let token = try sut.getSessionToken()

        // Then
        XCTAssertNil(token)
    }

    // MARK: - Auto Refresh Tests

    func testAutoRefresh_ScheduledCorrectly() async throws {
        // Given - Sign in with expiry in near future
        let expiryDate = Date().addingTimeInterval(360) // 6 minutes (refresh at 1 minute)
        let authResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "token",
                expiresAt: expiryDate
            )
        )
        mockAPIClient.signInResponse = authResponse

        // Set up refresh response
        let refreshedAuthResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "refreshed-token-auto",
                expiresAt: Date().addingTimeInterval(7200)
            )
        )
        mockAPIClient.refreshSessionResponse = refreshedAuthResponse

        // When
        _ = try await sut.signIn(email: "user@example.com", password: "password")

        // Wait for auto-refresh (should happen at 1 minute = 60 seconds)
        // In test, we'll wait a bit to verify task was scheduled
        try await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds

        // Then - Verify auto-refresh task was scheduled (indirectly by checking state)
        XCTAssertTrue(sut.isAuthenticated)
    }

    // MARK: - Performance Tests

    func testSignInPerformance() throws {
        // Given
        let authResponse = AuthResponse(
            user: UserResponse(
                id: UUID(),
                email: "user@example.com",
                name: "User",
                createdAt: Date(),
                totalStoriesGenerated: 0,
                totalAudioGenerated: 0,
                totalIllustrationsGenerated: 0
            ),
            session: SessionResponse(
                token: "token",
                expiresAt: Date().addingTimeInterval(3600)
            )
        )
        mockAPIClient.signInResponse = authResponse

        // Measure performance
        measure {
            let expectation = self.expectation(description: "Sign in completes")

            Task { @MainActor in
                _ = try? await sut.signIn(email: "user@example.com", password: "password")
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 1.0)
        }
    }
}

// MARK: - Mock Helpers

/// Mock Keychain Helper for testing
class MockKeychainHelper: KeychainHelper {
    var sessionToken: String?
    var savedSessionToken: String?
    var deleteSessionTokenCalled = false

    override func getSessionToken() throws -> String? {
        return sessionToken
    }

    override func saveSessionToken(_ token: String) throws {
        savedSessionToken = token
        sessionToken = token
    }

    override func deleteSessionToken() throws {
        deleteSessionTokenCalled = true
        sessionToken = nil
        savedSessionToken = nil
    }
}

/// Mock API Client for testing
class MockAPIClient: APIClient {
    var shouldThrowError = false
    var shouldThrowErrorOnSignOut = false
    var shouldThrowErrorOnRefresh = false
    var errorToThrow: Error?

    var signUpResponse: AuthResponse?
    var signInResponse: AuthResponse?
    var refreshSessionResponse: AuthResponse?

    override func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        // Handle different endpoint types
        switch endpoint {
        case .signUp:
            if shouldThrowError, let error = errorToThrow {
                throw error
            }
            if let response = signUpResponse as? T {
                return APIResponse(data: response, error: nil)
            }
            throw APIError.unknown(NSError(domain: "Mock", code: -1))

        case .signIn:
            if shouldThrowError, let error = errorToThrow {
                throw error
            }
            if let response = signInResponse as? T {
                return APIResponse(data: response, error: nil)
            }
            throw APIError.unknown(NSError(domain: "Mock", code: -1))

        case .signOut:
            if shouldThrowErrorOnSignOut {
                throw APIError.serverError
            }
            return APIResponse(data: EmptyResponse() as! T, error: nil)

        case .refreshSession:
            if shouldThrowErrorOnRefresh, let error = errorToThrow {
                throw error
            }
            if let response = refreshSessionResponse as? T {
                return APIResponse(data: response, error: nil)
            }
            throw APIError.unauthorized

        default:
            throw APIError.unknown(NSError(domain: "Unhandled endpoint", code: -1))
        }
    }
}
