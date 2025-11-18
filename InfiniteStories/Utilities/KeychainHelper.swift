//
//  KeychainHelper.swift
//  InfiniteStories
//
//  Secure storage for session tokens and sensitive data
//

import Foundation
import Security

enum KeychainError: Error {
    case saveFailed(OSStatus)
    case loadFailed(OSStatus)
    case deleteFailed(OSStatus)
    case unexpectedData
    case notFound

    var localizedDescription: String {
        switch self {
        case .saveFailed(let status):
            return "Failed to save to Keychain (status: \(status))"
        case .loadFailed(let status):
            return "Failed to load from Keychain (status: \(status))"
        case .deleteFailed(let status):
            return "Failed to delete from Keychain (status: \(status))"
        case .unexpectedData:
            return "Unexpected data format in Keychain"
        case .notFound:
            return "Item not found in Keychain"
        }
    }
}

class KeychainHelper {
    private let service: String

    init(service: String = "com.infinitestories.app") {
        self.service = service
    }

    // MARK: - Session Token Management

    /// Save session token securely
    /// - Parameter token: JWT session token from Better Auth
    /// - Throws: KeychainError if save fails
    func saveSessionToken(_ token: String) throws {
        try saveString(token, forKey: "sessionToken")
        Logger.auth.info("✅ Session token saved to Keychain")
    }

    /// Retrieve session token
    /// - Returns: Session token if exists, nil otherwise
    /// - Throws: KeychainError if retrieval fails
    func getSessionToken() throws -> String? {
        do {
            return try getString(forKey: "sessionToken")
        } catch KeychainError.notFound {
            return nil
        }
    }

    /// Delete session token (on sign-out)
    /// - Throws: KeychainError if deletion fails
    func deleteSessionToken() throws {
        try deleteItem(forKey: "sessionToken")
        Logger.auth.info("✅ Session token deleted from Keychain")
    }

    // MARK: - Generic Keychain Operations

    /// Save string to Keychain
    private func saveString(_ string: String, forKey key: String) throws {
        guard let data = string.data(using: .utf8) else {
            throw KeychainError.unexpectedData
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        // Delete existing item first
        SecItemDelete(query as CFDictionary)

        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }

    /// Retrieve string from Keychain
    private func getString(forKey key: String) throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecItemNotFound {
            throw KeychainError.notFound
        }

        guard status == errSecSuccess else {
            throw KeychainError.loadFailed(status)
        }

        guard let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.unexpectedData
        }

        return string
    }

    /// Delete item from Keychain
    private func deleteItem(forKey key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)

        // Success or item not found are both acceptable
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }

    /// Clear all Keychain items for this service
    func clearAll() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service
        ]

        let status = SecItemDelete(query as CFDictionary)

        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }

        Logger.auth.info("✅ Cleared all Keychain items")
    }
}
