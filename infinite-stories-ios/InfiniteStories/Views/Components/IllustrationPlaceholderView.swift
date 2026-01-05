//
//  IllustrationPlaceholderView.swift
//  InfiniteStories
//
//  Created by Captain Dev on 17/09/2025.
//

import SwiftUI

/// Types of illustration failures
enum IllustrationErrorType: String {
    case network = "illustration.error.network.title"
    case invalidPrompt = "illustration.error.invalidPrompt.title"
    case rateLimit = "illustration.error.rateLimit.title"
    case apiError = "illustration.error.apiError.title"
    case timeout = "illustration.error.timeout.title"
    case fileSystem = "illustration.error.fileSystem.title"
    case unknown = "illustration.error.unknown.title"

    var icon: String {
        switch self {
        case .network:
            return "wifi.slash"
        case .invalidPrompt:
            return "exclamationmark.bubble"
        case .rateLimit:
            return "hourglass.tophalf.filled"
        case .apiError:
            return "exclamationmark.triangle"
        case .timeout:
            return "clock.badge.exclamationmark"
        case .fileSystem:
            return "folder.badge.questionmark"
        case .unknown:
            return "questionmark.circle"
        }
    }

    var color: Color {
        switch self {
        case .network:
            return .blue
        case .invalidPrompt:
            return .orange
        case .rateLimit:
            return .yellow
        case .apiError:
            return .red
        case .timeout:
            return .purple
        case .fileSystem:
            return .gray
        case .unknown:
            return .secondary
        }
    }

    var userFriendlyMessage: String {
        switch self {
        case .network:
            return String(localized: "illustration.error.network.message")
        case .invalidPrompt:
            return String(localized: "illustration.error.invalidPrompt.message")
        case .rateLimit:
            return String(localized: "illustration.error.rateLimit.message")
        case .apiError:
            return String(localized: "illustration.error.apiError.message")
        case .timeout:
            return String(localized: "illustration.error.timeout.message")
        case .fileSystem:
            return String(localized: "illustration.error.fileSystem.message")
        case .unknown:
            return String(localized: "illustration.error.unknown.message")
        }
    }

    var shortMessage: String {
        switch self {
        case .network:
            return String(localized: "illustration.error.network.short")
        case .invalidPrompt:
            return String(localized: "illustration.error.invalidPrompt.short")
        case .rateLimit:
            return String(localized: "illustration.error.rateLimit.short")
        case .apiError:
            return String(localized: "illustration.error.apiError.short")
        case .timeout:
            return String(localized: "illustration.error.timeout.short")
        case .fileSystem:
            return String(localized: "illustration.error.fileSystem.short")
        case .unknown:
            return String(localized: "illustration.error.unknown.short")
        }
    }
}

/// Beautiful placeholder view for failed illustrations
struct IllustrationPlaceholderView: View {
    let sceneNumber: Int
    let errorType: IllustrationErrorType
    let onRetry: (() -> Void)?

    @AppStorage("showIllustrationErrors") private var showDetailedErrors = false

    init(
        sceneNumber: Int,
        errorType: IllustrationErrorType = .unknown,
        onRetry: (() -> Void)? = nil
    ) {
        self.sceneNumber = sceneNumber
        self.errorType = errorType
        self.onRetry = onRetry
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Beautiful gradient background
                backgroundGradient

                // Content
                VStack(spacing: 20) {
                    Spacer()

                    // Animated icon
                    animatedIcon

                    // Scene indicator
                    sceneIndicator

                    // Error message (if enabled)
                    if showDetailedErrors {
                        errorMessage
                    }

                    // Retry button (if available)
                    if onRetry != nil {
                        retryButton
                    }

                    Spacer()
                }
                .padding()

                // Subtle pattern overlay
                patternOverlay
            }
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(errorType.color.opacity(0.2), lineWidth: 1)
            )
        }
    }

    // MARK: - Components

    @ViewBuilder
    private var backgroundGradient: some View {
        Color(.secondarySystemBackground)
    }

    @ViewBuilder
    private var animatedIcon: some View {
        ZStack {
            // Static background circle
            Circle()
                .fill(errorType.color.opacity(0.1))
                .frame(width: 100, height: 100)

            // Inner circle
            Circle()
                .fill(errorType.color.opacity(0.15))
                .frame(width: 80, height: 80)

            // Main icon
            Image(systemName: errorType.icon)
                .font(.system(size: 40, weight: .medium, design: .rounded))
                .foregroundColor(errorType.color)
        }
    }

    @ViewBuilder
    private var sceneIndicator: some View {
        VStack(spacing: 8) {
            Text("illustration.placeholder.scene \(sceneNumber)")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.primary.opacity(0.9))

            Text("illustration.placeholder.title")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }

    @ViewBuilder
    private var errorMessage: some View {
        VStack(spacing: 4) {
            Text(errorType.shortMessage)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(errorType.color)

            Text(errorType.userFriendlyMessage)
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 20)
    }

    @ViewBuilder
    private var retryButton: some View {
        Button(action: {
            onRetry?()
            hapticFeedback()
        }) {
            HStack(spacing: 8) {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 14, weight: .medium))

                Text("illustration.placeholder.retry")
                    .font(.system(size: 14, weight: .semibold))
            }
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(errorType.color)
            )
            .shadow(color: errorType.color.opacity(0.3), radius: 5, x: 0, y: 3)
        }
        .buttonStyle(ScaleButtonStyle())
    }

    @ViewBuilder
    private var patternOverlay: some View {
        GeometryReader { geometry in
            Path { path in
                let size: CGFloat = 30
                let rows = Int(geometry.size.height / size)
                let cols = Int(geometry.size.width / size)

                for row in 0...rows {
                    for col in 0...cols {
                        let x = CGFloat(col) * size + (row % 2 == 0 ? 0 : size/2)
                        let y = CGFloat(row) * size

                        path.addEllipse(in: CGRect(x: x, y: y, width: 2, height: 2))
                    }
                }
            }
            .fill(Color.gray.opacity(0.05))
        }
    }

    // MARK: - Helper Methods

    private func hapticFeedback() {
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()
    }
}

// MARK: - Compact Placeholder (for thumbnails)

struct CompactIllustrationPlaceholder: View {
    let sceneNumber: Int
    let errorType: IllustrationErrorType

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground))

            VStack(spacing: 4) {
                Image(systemName: errorType.icon)
                    .font(.system(size: 20))
                    .foregroundColor(errorType.color.opacity(0.6))

                Text("illustration.placeholder.scene \(sceneNumber)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Custom Button Style

struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Preview

#Preview("Placeholder Gallery") {
    ScrollView {
        VStack(spacing: 20) {
            ForEach([
                IllustrationErrorType.network,
                .invalidPrompt,
                .rateLimit,
                .apiError,
                .timeout,
                .fileSystem,
                .unknown
            ], id: \.self) { errorType in
                IllustrationPlaceholderView(
                    sceneNumber: Int.random(in: 1...5),
                    errorType: errorType,
                    onRetry: {}
                )
                .frame(height: 300)
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
    }
}

#Preview("Compact Placeholders") {
    HStack(spacing: 10) {
        ForEach([
            IllustrationErrorType.network,
            .rateLimit,
            .apiError
        ], id: \.self) { errorType in
            CompactIllustrationPlaceholder(
                sceneNumber: Int.random(in: 1...5),
                errorType: errorType
            )
            .frame(width: 80, height: 80)
        }
    }
    .padding()
}