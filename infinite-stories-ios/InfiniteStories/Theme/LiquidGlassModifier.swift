//
//  LiquidGlassModifier.swift
//  InfiniteStories
//
//  Liquid Glass effects for iOS 26+ with graceful iOS 17+ fallback
//  Uses real iOS 26 .glassEffect() API introduced at WWDC 2025
//

import SwiftUI

// MARK: - Glass Variant

/// Defines the visual style of glass effects
enum GlassVariant {
    case regular      // Standard translucent glass
    case clear        // Subtle, nearly transparent glass
    case interactive  // Glass with bounce/shimmer on interaction
    case tinted(Color) // Glass with accent color tint
    case tintedInteractive(Color) // Tinted glass with interaction feedback
}

// MARK: - Liquid Glass Card Modifier

struct LiquidGlassCardModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    let cornerRadius: CGFloat
    let variant: GlassVariant

    init(cornerRadius: CGFloat = 16, variant: GlassVariant = .regular) {
        self.cornerRadius = cornerRadius
        self.variant = variant
    }

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            applyiOS26Glass(to: content)
        } else {
            applyFallbackStyle(to: content)
        }
    }

    @available(iOS 26, *)
    @ViewBuilder
    private func applyiOS26Glass(to content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)

        switch variant {
        case .regular:
            content
                .glassEffect(.regular, in: shape)

        case .clear:
            content
                .glassEffect(.clear, in: shape)

        case .interactive:
            content
                .glassEffect(.regular.interactive(), in: shape)

        case .tinted(let color):
            content
                .glassEffect(.regular.tint(color), in: shape)

        case .tintedInteractive(let color):
            content
                .glassEffect(.regular.tint(color).interactive(), in: shape)
        }
    }

    @ViewBuilder
    private func applyFallbackStyle(to content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)

        switch variant {
        case .regular, .interactive:
            content
                .background(
                    ZStack {
                        shape.fill(.ultraThinMaterial)
                        // Subtle gradient overlay for depth
                        shape.fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(colorScheme == .dark ? 0.08 : 0.5),
                                    Color.white.opacity(colorScheme == .dark ? 0.02 : 0.1)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    }
                )
                .overlay(shape.stroke(Color.primary.opacity(colorScheme == .dark ? 0.15 : 0.08), lineWidth: 0.5))
                .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.3 : 0.08), radius: 8, x: 0, y: 4)

        case .clear:
            content
                .background(
                    ZStack {
                        shape.fill(.ultraThinMaterial)
                        shape.fill(Color.white.opacity(colorScheme == .dark ? 0.03 : 0.3))
                    }
                )
                .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)

        case .tinted(let color), .tintedInteractive(let color):
            content
                .background(
                    ZStack {
                        // Solid color base for better visibility and accessibility
                        shape.fill(color)
                        // Subtle gradient overlay for depth
                        shape.fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(colorScheme == .dark ? 0.15 : 0.25),
                                    Color.black.opacity(colorScheme == .dark ? 0.1 : 0.05)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    }
                )
                .overlay(shape.stroke(Color.white.opacity(colorScheme == .dark ? 0.3 : 0.4), lineWidth: 0.5))
                .shadow(color: color.opacity(0.3), radius: 8, x: 0, y: 4)
        }
    }
}

// MARK: - Liquid Glass Background Modifier

struct LiquidGlassBackgroundModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    let variant: GlassVariant

    init(variant: GlassVariant = .regular) {
        self.variant = variant
    }

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            applyiOS26Background(to: content)
        } else {
            applyFallbackBackground(to: content)
        }
    }

    @available(iOS 26, *)
    @ViewBuilder
    private func applyiOS26Background(to content: Content) -> some View {
        switch variant {
        case .regular, .interactive:
            content.glassEffect()

        case .clear:
            content.glassEffect(.clear)

        case .tinted(let color), .tintedInteractive(let color):
            content.glassEffect(.regular.tint(color))
        }
    }

    @ViewBuilder
    private func applyFallbackBackground(to content: Content) -> some View {
        switch variant {
        case .regular, .interactive:
            content.background(.ultraThinMaterial)

        case .clear:
            content.background(.ultraThinMaterial.opacity(0.7))

        case .tinted(let color), .tintedInteractive(let color):
            content.background(
                ZStack {
                    Color.clear.background(.ultraThinMaterial)
                    color.opacity(colorScheme == .dark ? 0.15 : 0.1)
                }
            )
        }
    }
}

// MARK: - Liquid Glass Button Modifier

struct LiquidGlassButtonModifier: ViewModifier {
    let tintColor: Color?
    let isProminent: Bool

    init(tintColor: Color? = nil, isProminent: Bool = true) {
        self.tintColor = tintColor
        self.isProminent = isProminent
    }

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            applyiOS26Button(to: content)
        } else {
            applyFallbackButton(to: content)
        }
    }

    @available(iOS 26, *)
    @ViewBuilder
    private func applyiOS26Button(to content: Content) -> some View {
        if let color = tintColor {
            content
                .glassEffect(.regular.tint(color).interactive())
        } else if isProminent {
            content
                .glassEffect(.regular.tint(.accentColor).interactive())
        } else {
            content
                .glassEffect(.regular.interactive())
        }
    }

    @ViewBuilder
    private func applyFallbackButton(to content: Content) -> some View {
        if isProminent {
            content
                .buttonStyle(.borderedProminent)
        } else {
            content
                .buttonStyle(.bordered)
        }
    }
}

// MARK: - Liquid Glass Capsule Modifier

struct LiquidGlassCapsuleModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    let variant: GlassVariant

    init(variant: GlassVariant = .regular) {
        self.variant = variant
    }

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            applyiOS26Capsule(to: content)
        } else {
            applyFallbackCapsule(to: content)
        }
    }

    @available(iOS 26, *)
    @ViewBuilder
    private func applyiOS26Capsule(to content: Content) -> some View {
        switch variant {
        case .regular:
            content.glassEffect(.regular, in: .capsule)

        case .clear:
            content.glassEffect(.clear, in: .capsule)

        case .interactive:
            content.glassEffect(.regular.interactive(), in: .capsule)

        case .tinted(let color):
            content.glassEffect(.regular.tint(color), in: .capsule)

        case .tintedInteractive(let color):
            content.glassEffect(.regular.tint(color).interactive(), in: .capsule)
        }
    }

    @ViewBuilder
    private func applyFallbackCapsule(to content: Content) -> some View {
        switch variant {
        case .regular, .interactive:
            content
                .background(
                    ZStack {
                        Capsule().fill(.ultraThinMaterial)
                        Capsule().fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(colorScheme == .dark ? 0.08 : 0.5),
                                    Color.white.opacity(colorScheme == .dark ? 0.02 : 0.1)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    }
                )
                .overlay(Capsule().stroke(Color.primary.opacity(colorScheme == .dark ? 0.15 : 0.08), lineWidth: 0.5))
                .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.3 : 0.08), radius: 6, x: 0, y: 3)

        case .clear:
            content
                .background(
                    ZStack {
                        Capsule().fill(.ultraThinMaterial)
                        Capsule().fill(Color.white.opacity(colorScheme == .dark ? 0.03 : 0.3))
                    }
                )
                .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)

        case .tinted(let color), .tintedInteractive(let color):
            content
                .background(
                    ZStack {
                        // Solid color base for better visibility and accessibility
                        Capsule().fill(color)
                        // Subtle gradient overlay for depth
                        Capsule().fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(colorScheme == .dark ? 0.15 : 0.25),
                                    Color.black.opacity(colorScheme == .dark ? 0.1 : 0.05)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    }
                )
                .overlay(Capsule().stroke(Color.white.opacity(colorScheme == .dark ? 0.3 : 0.4), lineWidth: 0.5))
                .shadow(color: color.opacity(0.3), radius: 6, x: 0, y: 3)
        }
    }
}

// MARK: - View Extensions

extension View {
    /// Applies Liquid Glass card styling for iOS 26+ with fallback for earlier versions
    /// - Parameters:
    ///   - cornerRadius: The corner radius of the glass card (default: 16)
    ///   - variant: The glass variant to apply (default: .regular)
    func liquidGlassCard(cornerRadius: CGFloat = 16, variant: GlassVariant = .regular) -> some View {
        modifier(LiquidGlassCardModifier(cornerRadius: cornerRadius, variant: variant))
    }

    /// Applies Liquid Glass background for iOS 26+ with fallback
    /// - Parameter variant: The glass variant to apply (default: .regular)
    func liquidGlassBackground(variant: GlassVariant = .regular) -> some View {
        modifier(LiquidGlassBackgroundModifier(variant: variant))
    }

    /// Applies Liquid Glass button styling for iOS 26+ with fallback
    /// - Parameters:
    ///   - tintColor: Optional tint color for the glass (default: accent color for prominent)
    ///   - isProminent: Whether this is a primary action button (default: true)
    func liquidGlassButton(tintColor: Color? = nil, isProminent: Bool = true) -> some View {
        modifier(LiquidGlassButtonModifier(tintColor: tintColor, isProminent: isProminent))
    }

    /// Applies Liquid Glass capsule styling for iOS 26+ with fallback
    /// - Parameter variant: The glass variant to apply (default: .regular)
    func liquidGlassCapsule(variant: GlassVariant = .regular) -> some View {
        modifier(LiquidGlassCapsuleModifier(variant: variant))
    }

    /// Applies interactive glass effect for buttons on iOS 26+
    /// On iOS 17-25, applies bordered prominent button style
    func liquidGlassInteractive() -> some View {
        modifier(LiquidGlassButtonModifier(isProminent: true))
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
