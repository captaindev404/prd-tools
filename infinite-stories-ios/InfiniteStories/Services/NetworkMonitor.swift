//
//  NetworkMonitor.swift
//  InfiniteStories
//
//  Network connectivity monitoring
//

import Foundation
import Network

// MARK: - Network Status
enum NetworkStatus {
    case connected
    case disconnected
    case unknown
}

// MARK: - Network Monitor
@MainActor
class NetworkMonitor: ObservableObject {
    @Published var isConnected = true
    @Published var status: NetworkStatus = .connected
    @Published var isConnectedToWiFi = false
    @Published var isConnectedToCellular = false

    static let shared = NetworkMonitor()

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    init() {
        startMonitoring()
    }

    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                let wasConnected = self?.isConnected ?? false
                let isNowConnected = path.status == .satisfied

                self?.isConnected = isNowConnected
                self?.status = isNowConnected ? .connected : .disconnected
                self?.isConnectedToWiFi = path.usesInterfaceType(.wifi)
                self?.isConnectedToCellular = path.usesInterfaceType(.cellular)

                // Post notification when network status changes
                NotificationCenter.default.post(
                    name: .networkStatusChanged,
                    object: nil,
                    userInfo: ["isConnected": isNowConnected, "wasConnected": wasConnected]
                )
            }
        }
        monitor.start(queue: queue)
    }

    func stopMonitoring() {
        monitor.cancel()
    }
}
