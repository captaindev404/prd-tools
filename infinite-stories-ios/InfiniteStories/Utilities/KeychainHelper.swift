//
//  KeychainHelper.swift
//  InfiniteStories
//
//  Secure storage for API keys and sensitive data
//

import Foundation
import Security

class KeychainHelper {
    // MARK: - Singleton
    static let shared = KeychainHelper()

    // MARK: - Save
    func save(_ value: Any, forKey key: String) {
        var data: Data?

        if let stringValue = value as? String {
            data = stringValue.data(using: .utf8)
        } else if let dataValue = value as? Data {
            data = dataValue
        } else {
            return
        }

        guard let valueData = data else { return }

        // Delete any existing item
        delete(forKey: key)

        // Create query
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: valueData
        ]

        // Add to keychain
        let status = SecItemAdd(query as CFDictionary, nil)

        if status != errSecSuccess {
            print("KeychainHelper: Error saving item: \(status)")
        }
    }

    // MARK: - Load
    func load(forKey key: String) -> Any? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data else {
            return nil
        }

        // Try to convert to string first
        if let string = String(data: data, encoding: .utf8) {
            return string
        }

        // Otherwise return as data
        return data
    }

    // MARK: - Delete
    func delete(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]

        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Clear All
    func clearAll() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword
        ]

        SecItemDelete(query as CFDictionary)
    }
}
