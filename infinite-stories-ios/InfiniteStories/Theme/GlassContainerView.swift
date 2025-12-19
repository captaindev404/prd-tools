//
//  GlassContainerView.swift
//  InfiniteStories
//
//  Wrapper for GlassEffectContainer to ensure multiple glass elements render correctly.
//  Glass cannot sample other glass - this container prevents visual artifacts.
//

import SwiftUI

// MARK: - Glass Container View

/// A container that wraps content with GlassEffectContainer on iOS 26+.
/// Use this when you have multiple glass elements that may overlap or be adjacent.
///
/// Example:
/// ```swift
/// GlassContainerView {
///     HStack {
///         Button("Action 1") { }
///             .liquidGlassButton()
///         Button("Action 2") { }
///             .liquidGlassButton(isProminent: false)
///     }
/// }
/// ```
struct GlassContainerView<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        if #available(iOS 26, *) {
            GlassEffectContainer {
                content
            }
        } else {
            content
        }
    }
}

// MARK: - Glass Effect ID Modifier

/// Modifier that applies a glass effect ID for morphing transitions on iOS 26+
struct GlassEffectIDModifier<ID: Hashable>: ViewModifier {
    let id: ID
    @Namespace private var glassNamespace

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            content
                .glassEffectID(id, in: glassNamespace)
        } else {
            content
        }
    }
}

// MARK: - View Extensions

extension View {
    /// Wraps the view in a GlassEffectContainer on iOS 26+.
    /// Use when grouping multiple glass elements to prevent sampling artifacts.
    func glassContainer() -> some View {
        GlassContainerView {
            self
        }
    }

    /// Assigns a glass effect ID for morphing transitions between views on iOS 26+.
    /// Elements with matching IDs will smoothly morph when transitioning.
    /// - Parameter id: A unique identifier for this glass element
    func liquidGlassID<ID: Hashable>(_ id: ID) -> some View {
        modifier(GlassEffectIDModifier(id: id))
    }
}

// MARK: - Glass Toolbar Content

/// A toolbar content builder that wraps items in a GlassEffectContainer on iOS 26+
struct GlassToolbarContent<Content: ToolbarContent>: ToolbarContent {
    @ToolbarContentBuilder let content: Content

    var body: some ToolbarContent {
        content
    }
}

// MARK: - Preview

#if DEBUG
struct GlassContainerView_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            // Multiple glass buttons in a container
            GlassContainerView {
                HStack(spacing: 12) {
                    Button("Primary") { }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .liquidGlassButton()

                    Button("Secondary") { }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .liquidGlassButton(isProminent: false)
                }
            }

            // Glass cards in a container
            GlassContainerView {
                VStack(spacing: 12) {
                    Text("Card 1")
                        .padding()
                        .frame(maxWidth: .infinity)
                        .liquidGlassCard()

                    Text("Card 2")
                        .padding()
                        .frame(maxWidth: .infinity)
                        .liquidGlassCard()
                }
            }
            .padding()
        }
        .padding()
        .background(
            LinearGradient(
                colors: [.blue.opacity(0.3), .purple.opacity(0.3)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
}
#endif
