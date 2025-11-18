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

            // Icon
            Image(systemName: "wifi.slash")
                .font(.system(size: 72))
                .foregroundColor(.red)
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

            // Network status
            if !networkMonitor.isConnected {
                Label("No Connection", systemImage: "exclamationmark.triangle.fill")
                    .font(.subheadline)
                    .foregroundColor(.red)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
            } else {
                Label("Connected", systemImage: "checkmark.circle.fill")
                    .font(.subheadline)
                    .foregroundColor(.green)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
            }

            // Retry button
            if let retryAction = retryAction {
                Button(action: retryAction) {
                    Label("Try Again", systemImage: "arrow.clockwise")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: 200)
                        .padding()
                        .background(networkMonitor.isConnected ? Color.blue : Color.gray)
                        .cornerRadius(12)
                }
                .disabled(!networkMonitor.isConnected)
            }

            Spacer()
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
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
