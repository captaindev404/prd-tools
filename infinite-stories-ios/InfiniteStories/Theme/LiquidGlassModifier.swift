//
//  LiquidGlassModifier.swift
//  InfiniteStories
//
//  Liquid Glass effects for iOS 26+ with graceful iOS 17+ fallback
//

import SwiftUI

// MARK: - Liquid Glass Card Modifier
struct LiquidGlassCardModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    let cornerRadius: CGFloat

    init(cornerRadius: CGFloat = 16) {
        self.cornerRadius = cornerRadius
    }

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            // iOS 26: Use Liquid Glass effect
            content
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(.regularMaterial)
                )
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        } else {
            // iOS 17-25: Clean system background fallback
            content
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(Color(.secondarySystemBackground))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(Color.primary.opacity(0.1), lineWidth: 1)
                )
        }
    }
}

// MARK: - Liquid Glass Background Modifier
struct LiquidGlassBackgroundModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            // iOS 26: Use thin material for subtle glass effect
            content
                .background(.thinMaterial)
        } else {
            // iOS 17-25: System background
            content
                .background(Color(.systemBackground))
        }
    }
}

// MARK: - View Extensions
extension View {
    /// Applies Liquid Glass card styling for iOS 26+ with fallback for earlier versions
    func liquidGlassCard(cornerRadius: CGFloat = 16) -> some View {
        modifier(LiquidGlassCardModifier(cornerRadius: cornerRadius))
    }

    /// Applies Liquid Glass background for iOS 26+ with fallback
    func liquidGlassBackground() -> some View {
        modifier(LiquidGlassBackgroundModifier())
    }
}

// MARK: - Native Design Tokens
/// Semantic design constants using system colors
struct NativeDesignTokens {
    // Spacing
    static let spacingXS: CGFloat = 4
    static let spacingSM: CGFloat = 8
    static let spacingMD: CGFloat = 16
    static let spacingLG: CGFloat = 24
    static let spacingXL: CGFloat = 32

    // Corner Radius
    static let radiusSM: CGFloat = 8
    static let radiusMD: CGFloat = 12
    static let radiusLG: CGFloat = 16
    static let radiusXL: CGFloat = 24

    // Touch Targets
    static let minTouchTarget: CGFloat = 44
    static let comfortableTouchTarget: CGFloat = 48

    // Shadows (for iOS 17-25 fallback)
    static let shadowRadiusSM: CGFloat = 4
    static let shadowRadiusMD: CGFloat = 8
    static let shadowRadiusLG: CGFloat = 12

    // Animation Durations
    static let animationFast: Double = 0.2
    static let animationNormal: Double = 0.3
    static let animationSlow: Double = 0.5
}
