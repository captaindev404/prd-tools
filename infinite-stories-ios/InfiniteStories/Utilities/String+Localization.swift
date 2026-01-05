//
//  String+Localization.swift
//  InfiniteStories
//
//  Extensions for localization support with dynamic strings.
//

import Foundation
import SwiftUI

extension String {
    /// Returns a localized version of the string using it as a key
    /// Use for dynamic strings that can't use LocalizedStringKey directly
    var localized: String {
        String(localized: String.LocalizationValue(self))
    }

    /// Returns a localized string with format arguments
    /// - Parameter arguments: Values to substitute into the format string
    /// - Returns: Localized and formatted string
    func localized(with arguments: CVarArg...) -> String {
        String(format: self.localized, arguments: arguments)
    }
}

// MARK: - LocalizedStringKey Convenience

extension LocalizedStringKey {
    /// Create a LocalizedStringKey from a String key
    /// Useful for programmatic key generation
    init(key: String) {
        self.init(stringLiteral: key)
    }
}

// MARK: - Text Convenience

extension Text {
    /// Create a Text view with a localization key string
    /// - Parameter key: The localization key as a String
    init(localizedKey key: String) {
        self.init(LocalizedStringKey(key))
    }
}
