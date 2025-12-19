//
//  ErrorView.swift
//  InfiniteStories
//
//  Generic error view with retry capability
//

import SwiftUI

struct ErrorView: View {
    let error: Error
    let retryAction: () -> Void

    @EnvironmentObject private var authState: AuthStateManager

    var body: some View {
        VStack(spacing: 20) {
            // Error icon
            Image(systemName: errorIcon)
                .font(.system(size: 60))
                .foregroundColor(errorColor)

            // Title
            Text(errorTitle)
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            // Error message
            Text(errorMessage)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal, 32)

            // Recovery suggestion
            if let suggestion = recoverySuggestion {
                Text(suggestion)
                    .font(.callout)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 32)
                    .padding(.top, 8)
            }

            // Action button - different for auth errors
            if isAuthError {
                Button(action: {
                    authState.signOut()
                }) {
                    Label("Sign In Again", systemImage: "arrow.right.circle.fill")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: 200)
                        .frame(minHeight: 44)
                        .padding()
                }
                .liquidGlassCard(cornerRadius: 12, variant: .tintedInteractive(.orange))
                .accessibilityLabel("Sign in again")
                .accessibilityHint("Your session has expired. Tap to sign in again.")
                .padding(.top, 8)
            } else {
                Button(action: retryAction) {
                    Label("Try Again", systemImage: "arrow.clockwise")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: 200)
                        .frame(minHeight: 44)
                        .padding()
                }
                .liquidGlassCard(cornerRadius: 12, variant: .tintedInteractive(.blue))
                .accessibilityLabel("Try again")
                .accessibilityHint("Retry the failed operation")
                .padding(.top, 8)
            }
        }
        .padding()
        .liquidGlassCard(cornerRadius: 20)
    }

    private var isAuthError: Bool {
        if let apiError = error as? APIError {
            switch apiError {
            case .unauthorized, .forbidden:
                return true
            default:
                return false
            }
        }
        return false
    }

    // MARK: - Error Details

    private var errorIcon: String {
        if let apiError = error as? APIError {
            switch apiError {
            case .networkUnavailable, .networkError:
                return "wifi.slash"
            case .unauthorized:
                return "lock.shield"
            case .forbidden:
                return "hand.raised"
            case .notFound:
                return "magnifyingglass"
            case .rateLimitExceeded:
                return "hourglass"
            case .validationError:
                return "exclamationmark.triangle"
            case .serverError:
                return "server.rack"
            case .decodingError:
                return "doc.text.magnifyingglass"
            case .unknown:
                return "questionmark.circle"
            }
        }
        return "exclamationmark.triangle"
    }

    private var errorColor: Color {
        if let apiError = error as? APIError {
            switch apiError {
            case .networkUnavailable, .networkError:
                return .red
            case .unauthorized, .forbidden:
                return .orange
            case .rateLimitExceeded:
                return .yellow
            case .serverError:
                return .purple
            default:
                return .red
            }
        }
        return .red
    }

    private var errorTitle: String {
        if let apiError = error as? APIError {
            switch apiError {
            case .networkUnavailable:
                return "No Internet Connection"
            case .unauthorized:
                return "Session Expired"
            case .forbidden:
                return "Access Denied"
            case .notFound:
                return "Not Found"
            case .rateLimitExceeded:
                return "Rate Limit Exceeded"
            case .validationError:
                return "Validation Error"
            case .serverError:
                return "Server Error"
            case .networkError:
                return "Network Error"
            case .decodingError:
                return "Data Error"
            case .unknown:
                return "Something Went Wrong"
            }
        }
        return "Error"
    }

    private var errorMessage: String {
        if let apiError = error as? APIError {
            return apiError.localizedDescription
        }
        return error.localizedDescription
    }

    private var recoverySuggestion: String? {
        if let apiError = error as? APIError {
            return apiError.recoverySuggestion
        }
        return nil
    }
}

// MARK: - Preview

#Preview("Network Error") {
    ErrorView(
        error: APIError.networkUnavailable,
        retryAction: { print("Retry") }
    )
}

#Preview("Unauthorized") {
    ErrorView(
        error: APIError.unauthorized,
        retryAction: { print("Retry") }
    )
}

#Preview("Server Error") {
    ErrorView(
        error: APIError.serverError,
        retryAction: { print("Retry") }
    )
}

#Preview("Rate Limit") {
    ErrorView(
        error: APIError.rateLimitExceeded(resetAt: Date().addingTimeInterval(3600)),
        retryAction: { print("Retry") }
    )
}
