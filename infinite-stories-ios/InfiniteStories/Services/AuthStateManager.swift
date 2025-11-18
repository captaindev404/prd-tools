//
//  AuthStateManager.swift
//  InfiniteStories
//
//  Global authentication state management
//

import SwiftUI
import Combine

@MainActor
class AuthStateManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var sessionToken: String?
    @Published var userId: String?
    @Published var hasEverAuthenticated = false // Track if user has ever signed in

    private let keychainHelper = KeychainHelper.shared

    init() {
        checkAuthenticationStatus()
    }

    private func checkAuthenticationStatus() {
        // Check if user has ever authenticated (even if session expired)
        if let _ = keychainHelper.load(forKey: "hasEverAuthenticated") as? Bool {
            self.hasEverAuthenticated = true
        }

        // Check if we have a valid session token
        if let token = keychainHelper.load(forKey: "sessionToken") as? String,
           let userId = keychainHelper.load(forKey: "userId") as? String,
           !token.isEmpty {
            self.sessionToken = token
            self.userId = userId
            self.isAuthenticated = true
        } else {
            self.isAuthenticated = false
        }
    }

    func signIn(token: String, userId: String) {
        keychainHelper.save(token, forKey: "sessionToken")
        keychainHelper.save(userId, forKey: "userId")
        keychainHelper.save(true, forKey: "hasEverAuthenticated") // Mark as authenticated before
        self.sessionToken = token
        self.userId = userId
        self.isAuthenticated = true
        self.hasEverAuthenticated = true
    }

    func signOut() {
        keychainHelper.delete(forKey: "sessionToken")
        keychainHelper.delete(forKey: "userId")
        self.sessionToken = nil
        self.userId = nil
        self.isAuthenticated = false
    }

    func getAuthorizationHeader() -> String? {
        guard let token = sessionToken else { return nil }
        return "Bearer \(token)"
    }
}

// MARK: - Global Singleton for Backend API Calls
extension AuthStateManager {
    static let shared = AuthStateManager()
}