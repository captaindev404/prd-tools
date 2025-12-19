//
//  NetworkRequiredView.swift
//  InfiniteStories
//
//  Shown when network connection is required but unavailable
//

import SwiftUI

struct NetworkRequiredView: View {
    @ObservedObject var networkMonitor = NetworkMonitor.shared
    var retryAction: (() -> Void)?

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            // Icon with glass background
            ZStack {
                Circle()
                    .fill(Color.red.opacity(0.1))
                    .frame(width: 120, height: 120)

                Image(systemName: "wifi.slash")
                    .font(.system(size: 56))
                    .foregroundColor(.red)
            }
            .liquidGlassCard(cornerRadius: 60, variant: .tinted(.red))
            .padding(.bottom, 8)

            // Title
            Text("Internet Required")
                .font(.title.bold())
                .multilineTextAlignment(.center)

            // Message
            Text("InfiniteStories requires an active internet connection. Please connect to WiFi or cellular data to continue.")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal, 32)

            // Network status with glass styling
            if !networkMonitor.isConnected {
                Label("No Connection", systemImage: "exclamationmark.triangle.fill")
                    .font(.subheadline)
                    .foregroundColor(.red)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .liquidGlassCapsule(variant: .tinted(.red))
            } else {
                Label("Connected", systemImage: "checkmark.circle.fill")
                    .font(.subheadline)
                    .foregroundColor(.green)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .liquidGlassCapsule(variant: .tinted(.green))
            }

            // Retry button with glass styling
            if let retryAction = retryAction {
                Button(action: retryAction) {
                    Label("Try Again", systemImage: "arrow.clockwise")
                        .font(.headline)
                        .foregroundColor(networkMonitor.isConnected ? .white : .secondary)
                        .frame(maxWidth: 200)
                        .padding()
                }
                .liquidGlassButton(tintColor: networkMonitor.isConnected ? .blue : .gray, isProminent: true)
                .disabled(!networkMonitor.isConnected)
            }

            Spacer()
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

// MARK: - Preview

#Preview {
    NetworkRequiredView(retryAction: {
        print("Retry tapped")
    })
}

#Preview("With Connection") {
    NetworkRequiredView(retryAction: nil)
}
