//
//  NetworkMonitor.swift
//  InfiniteStories
//
//  Network connectivity monitoring for offline detection
//

import Foundation
import Network
import Combine

// MARK: - Network Monitor

@MainActor
class NetworkMonitor: ObservableObject {
    @Published var isConnected = false
    @Published var connectionType: NWInterface.InterfaceType?
    @Published var isExpensive = false

    private let monitor: NWPathMonitor
    private let queue = DispatchQueue(label: "NetworkMonitor")

    init() {
        self.monitor = NWPathMonitor()
        startMonitoring()
    }

    deinit {
        stopMonitoring()
    }

    // MARK: - Monitoring

    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                guard let self = self else { return }

                let wasConnected = self.isConnected
                self.isConnected = path.status == .satisfied
                self.connectionType = path.availableInterfaces.first?.type
                self.isExpensive = path.isExpensive

                // Log status changes
                if self.isConnected && !wasConnected {
                    Logger.network.info("✅ Network connected: \(self.connectionType?.description ?? "unknown")")
                    NotificationCenter.default.post(name: .networkAvailable, object: nil)
                } else if !self.isConnected && wasConnected {
                    Logger.network.warning("⚠️ Network disconnected")
                }

                // Log network type
                if self.isConnected {
                    if self.isExpensive {
                        Logger.network.info("📱 Expensive network (cellular)")
                    } else {
                        Logger.network.info("📶 Inexpensive network (WiFi)")
                    }
                }
            }
        }

        monitor.start(queue: queue)
        Logger.network.info("✅ Network monitoring started")
    }

    private func stopMonitoring() {
        monitor.cancel()
        Logger.network.debug("Network monitoring stopped")
    }

    // MARK: - Network Status

    var isConnectedToWiFi: Bool {
        return isConnected && connectionType == .wifi
    }

    var isConnectedToCellular: Bool {
        return isConnected && connectionType == .cellular
    }

    var shouldSyncMedia: Bool {
        // Only sync media on WiFi or if user allows expensive network
        if isConnectedToWiFi {
            return true
        }

        if isConnectedToCellular {
            return UserDefaults.standard.bool(forKey: "allowCellularSync")
        }

        return false
    }
}

// MARK: - Interface Type Extension

extension NWInterface.InterfaceType {
    var description: String {
        switch self {
        case .wifi:
            return "WiFi"
        case .cellular:
            return "Cellular"
        case .wiredEthernet:
            return "Ethernet"
        case .loopback:
            return "Loopback"
        case .other:
            return "Other"
        @unknown default:
            return "Unknown"
        }
    }
}

// MARK: - Shared Instance

extension NetworkMonitor {
    static let shared = NetworkMonitor()
}
