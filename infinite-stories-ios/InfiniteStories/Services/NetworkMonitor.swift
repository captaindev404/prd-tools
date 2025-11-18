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
                self?.isConnected = path.status == .satisfied
                self?.status = path.status == .satisfied ? .connected : .disconnected
                self?.isConnectedToWiFi = path.usesInterfaceType(.wifi)
                self?.isConnectedToCellular = path.usesInterfaceType(.cellular)
            }
        }
        monitor.start(queue: queue)
    }

    func stopMonitoring() {
        monitor.cancel()
    }
}
