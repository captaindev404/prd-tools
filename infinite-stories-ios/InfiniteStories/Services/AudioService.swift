//
//  AudioService.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import Foundation
import AVFoundation
import Combine
import UIKit
import MediaPlayer

enum AudioServiceError: Error {
    case fileCreationFailed
    case playbackFailed
    case audioGenerationFailed(String)
}

protocol AudioNavigationDelegate: AnyObject {
    func playNextStory()
    func playPreviousStory()
}

struct AudioMetadata {
    let title: String
    let artist: String?
    let artwork: UIImage?
}

protocol AudioServiceProtocol {
    func generateAudioFile(from text: String, fileName: String, voice: String, language: String) async throws -> URL
    func playAudio(from url: URL) throws
    func playAudio(from url: URL, metadata: AudioMetadata?) throws
    func pauseAudio()
    func resumeAudio()
    func seek(to time: TimeInterval)
    func stopAudio()
    func setPlaybackSpeed(_ speed: Float)
    var isPlaying: Bool { get }
    var currentTime: TimeInterval { get }
    var duration: TimeInterval { get }
}

class AudioService: NSObject, ObservableObject, AudioServiceProtocol {
    // Use AVPlayer instead of AVAudioPlayer for remote URL support
    private var audioPlayer: AVPlayer?
    private var playerItem: AVPlayerItem?
    private var currentAudioURL: URL?
    private var currentPlaybackSpeed: Float = 1.0

    @Published var isPlaying: Bool = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0

    private var playbackTimer: Timer?
    private var playerItemObserver: NSKeyValueObservation?
    private var playerRateObserver: NSKeyValueObservation?

    // Lock screen controls
    private let commandCenter = MPRemoteCommandCenter.shared()
    private let nowPlayingInfo = MPNowPlayingInfoCenter.default()
    weak var navigationDelegate: AudioNavigationDelegate?
    
    override init() {
        super.init()
        setupAudioSession()
        setupNotificationObservers()
        setupRemoteCommandCenter()
    }
    
    deinit {
        // Clean up command center
        commandCenter.playCommand.removeTarget(nil)
        commandCenter.pauseCommand.removeTarget(nil)
        commandCenter.skipForwardCommand.removeTarget(nil)
        commandCenter.skipBackwardCommand.removeTarget(nil)
        commandCenter.previousTrackCommand.removeTarget(nil)
        commandCenter.nextTrackCommand.removeTarget(nil)
        commandCenter.changePlaybackPositionCommand.removeTarget(nil)
        commandCenter.changePlaybackRateCommand.removeTarget(nil)

        UIApplication.shared.endReceivingRemoteControlEvents()

        // Clean up observers
        playerItemObserver = nil
        playerRateObserver = nil
        NotificationCenter.default.removeObserver(self)

        // Stop playback and clean up player
        stopPlaybackTimer()
        audioPlayer?.pause()
        audioPlayer = nil
        playerItem = nil

        // Clean up and ensure idle timer is re-enabled
        IdleTimerManager.shared.enableIdleTimer(for: "AudioService")
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                mode: .spokenAudio,
                options: [.allowAirPlay, .allowBluetoothA2DP, .allowBluetooth]
            )
            try AVAudioSession.sharedInstance().setActive(true)
            UIApplication.shared.beginReceivingRemoteControlEvents()
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }
    
    private func setupNotificationObservers() {
        // Listen for app lifecycle events
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioSessionInterruption),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }

    private func setupRemoteCommandCenter() {
        // Play command
        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.resumeAudio()
            return .success
        }

        // Pause command
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.pauseAudio()
            return .success
        }

        // Skip forward (15 seconds)
        commandCenter.skipForwardCommand.isEnabled = true
        commandCenter.skipForwardCommand.preferredIntervals = [15]
        commandCenter.skipForwardCommand.addTarget { [weak self] event in
            guard let self = self,
                  let skipEvent = event as? MPSkipIntervalCommandEvent else {
                return .commandFailed
            }

            let interval = skipEvent.interval
            self.seek(to: min(self.currentTime + interval, self.duration))
            return .success
        }

        // Skip backward (15 seconds)
        commandCenter.skipBackwardCommand.isEnabled = true
        commandCenter.skipBackwardCommand.preferredIntervals = [15]
        commandCenter.skipBackwardCommand.addTarget { [weak self] event in
            guard let self = self,
                  let skipEvent = event as? MPSkipIntervalCommandEvent else {
                return .commandFailed
            }

            let interval = skipEvent.interval
            self.seek(to: max(self.currentTime - interval, 0))
            return .success
        }

        // Previous track
        commandCenter.previousTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.navigationDelegate?.playPreviousStory()
            return .success
        }

        // Next track
        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.navigationDelegate?.playNextStory()
            return .success
        }

        // Change playback position (scrubbing)
        commandCenter.changePlaybackPositionCommand.isEnabled = true
        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let self = self,
                  let positionEvent = event as? MPChangePlaybackPositionCommandEvent else {
                return .commandFailed
            }

            self.seek(to: positionEvent.positionTime)
            return .success
        }

        // Playback rate command (for speed control)
        commandCenter.changePlaybackRateCommand.isEnabled = true
        commandCenter.changePlaybackRateCommand.supportedPlaybackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
        commandCenter.changePlaybackRateCommand.addTarget { [weak self] event in
            guard let self = self,
                  let rateEvent = event as? MPChangePlaybackRateCommandEvent else {
                return .commandFailed
            }

            self.setPlaybackSpeed(rateEvent.playbackRate)
            return .success
        }
    }
    
    // MARK: - Idle Timer Management
    
    private func disableIdleTimer() {
        IdleTimerManager.shared.disableIdleTimer(for: "AudioService-Playback")
        print("📱 ✅ Idle timer disabled - phone will not sleep during playback")
    }
    
    private func enableIdleTimer() {
        IdleTimerManager.shared.enableIdleTimer(for: "AudioService-Playback")
        print("📱 ✅ Idle timer enabled - phone can sleep normally")
    }
    
    // MARK: - App Lifecycle Handlers
    
    @objc private func appWillResignActive() {
        // App is going to background or being interrupted
        // The audio session will continue playing in background due to .playback category
        // But we should re-enable idle timer for safety
        if !isPlaying {
            enableIdleTimer()
        }
    }
    
    @objc private func appDidBecomeActive() {
        // App became active again
        // If audio is playing, ensure idle timer is disabled
        if isPlaying {
            disableIdleTimer()
        }
    }
    
    @objc private func handleAudioSessionInterruption(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }

        switch type {
        case .began:
            // Store playback state before interruption
            let wasPlaying = isPlaying
            UserDefaults.standard.set(wasPlaying, forKey: "wasPlayingBeforeInterruption")

            if isPlaying {
                pauseAudio()
            }

        case .ended:
            guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)

            // Check if we should resume
            let wasPlaying = UserDefaults.standard.bool(forKey: "wasPlayingBeforeInterruption")

            if options.contains(.shouldResume) && wasPlaying {
                // Delay resume slightly to ensure audio session is ready
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                    self?.resumeAudio()
                }
            }

        @unknown default:
            break
        }
    }

    @objc private func handleRouteChange(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }

        switch reason {
        case .oldDeviceUnavailable:
            // Headphones were unplugged, pause playback
            if isPlaying {
                pauseAudio()
            }

        case .categoryChange:
            // Audio category changed, ensure our category is still set
            setupAudioSession()

        default:
            break
        }
    }
    
    func updateNowPlayingInfo(title: String, artist: String? = nil, duration: TimeInterval? = nil, artwork: UIImage? = nil) {
        var info = [String: Any]()

        // Basic metadata
        info[MPMediaItemPropertyTitle] = title
        info[MPMediaItemPropertyArtist] = artist ?? "InfiniteStories"
        info[MPMediaItemPropertyAlbumTitle] = "Bedtime Stories"

        // Playback info - use provided duration or current duration
        if let duration = duration {
            info[MPMediaItemPropertyPlaybackDuration] = duration
        } else if self.duration > 0 {
            info[MPMediaItemPropertyPlaybackDuration] = self.duration
        } else if let player = audioPlayer,
                  let item = player.currentItem {
            let itemDuration = CMTimeGetSeconds(item.duration)
            if itemDuration.isFinite && itemDuration > 0 {
                info[MPMediaItemPropertyPlaybackDuration] = itemDuration
            }
        }

        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = self.currentTime
        info[MPNowPlayingInfoPropertyPlaybackRate] = self.audioPlayer?.rate ?? 1.0

        // Artwork
        if let artwork = artwork {
            let artworkItem = MPMediaItemArtwork(boundsSize: artwork.size) { _ in artwork }
            info[MPMediaItemPropertyArtwork] = artworkItem
        } else {
            // Use default artwork
            if let defaultImage = UIImage(named: "AppIcon") {
                let artworkItem = MPMediaItemArtwork(boundsSize: defaultImage.size) { _ in defaultImage }
                info[MPMediaItemPropertyArtwork] = artworkItem
            }
        }

        // Language/additional metadata
        info[MPNowPlayingInfoPropertyIsLiveStream] = false
        info[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue

        nowPlayingInfo.nowPlayingInfo = info
    }

    // Note: Audio generation is now handled by backend API via StoryRepository.generateAudio()
    // This method is kept for backward compatibility but throws a deprecation error
    @available(*, deprecated, message: "Use StoryRepository.generateAudio() instead - audio generation is now handled by backend API")
    func generateAudioFile(from text: String, fileName: String, voice: String = "nova", language: String = "English") async throws -> URL {
        throw AudioServiceError.audioGenerationFailed("Audio generation is now handled by backend API via StoryRepository.generateAudio()")
    }

    func playAudio(from url: URL, metadata: AudioMetadata? = nil) throws {
        stopAudio()

        print("🎵 Playing audio file from: \(url.absoluteString)")
        print("🎵 Is remote URL: \(url.scheme == "http" || url.scheme == "https")")
        print("🎵 File extension: \(url.pathExtension)")

        // Only play MP3 files - no TTS fallback
        guard url.pathExtension == "mp3" else {
            print("🎵 ❌ Invalid audio file format. Only MP3 files are supported.")
            throw AudioServiceError.playbackFailed
        }

        do {
            // Create AVPlayerItem from URL (supports both local and remote URLs)
            playerItem = AVPlayerItem(url: url)

            guard let item = playerItem else {
                throw AudioServiceError.playbackFailed
            }

            // Create or reuse AVPlayer
            if let existingPlayer = audioPlayer {
                existingPlayer.replaceCurrentItem(with: item)
            } else {
                audioPlayer = AVPlayer(playerItem: item)
            }

            guard let player = audioPlayer else {
                throw AudioServiceError.playbackFailed
            }

            currentAudioURL = url

            // Observe player item status to know when it's ready
            playerItemObserver = item.observe(\.status, options: [.new]) { [weak self] item, _ in
                guard let self = self else { return }

                switch item.status {
                case .readyToPlay:
                    // Get duration from player item
                    let itemDuration = CMTimeGetSeconds(item.duration)
                    if itemDuration.isFinite && itemDuration > 0 {
                        DispatchQueue.main.async {
                            self.duration = itemDuration
                            print("🎵 MP3 duration: \(self.duration) seconds")
                        }
                    }

                case .failed:
                    print("🎵 ❌ Player item failed: \(item.error?.localizedDescription ?? "Unknown error")")
                    DispatchQueue.main.async {
                        self.isPlaying = false
                        self.enableIdleTimer()
                    }

                case .unknown:
                    print("🎵 Player item status unknown")

                @unknown default:
                    break
                }
            }

            // Observe when playback finishes
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(playerDidFinishPlaying),
                name: .AVPlayerItemDidPlayToEndTime,
                object: item
            )

            // Set playback speed
            player.rate = currentPlaybackSpeed
            print("🎵 Playback rate: \(currentPlaybackSpeed)x")

            // Start playback
            player.play()
            isPlaying = true
            startPlaybackTimer()
            disableIdleTimer()  // Prevent phone from sleeping during playback
            print("🎵 ✅ Audio playback started successfully")

            // Update Now Playing info when starting playback
            if let metadata = metadata {
                updateNowPlayingInfo(
                    title: metadata.title,
                    artist: metadata.artist,
                    duration: nil, // Will be set when duration is available
                    artwork: metadata.artwork
                )
            }

        } catch {
            print("🎵 ❌ Failed to play audio file: \(error)")
            throw AudioServiceError.playbackFailed
        }
    }

    @objc private func playerDidFinishPlaying() {
        print("🎵 Audio playback finished")
        isPlaying = false
        currentTime = 0
        stopPlaybackTimer()
        enableIdleTimer()
    }

    // Convenience method for backward compatibility
    func playAudio(from url: URL) throws {
        try playAudio(from: url, metadata: nil)
    }
    
    func stopAudio() {
        audioPlayer?.pause()
        audioPlayer?.replaceCurrentItem(with: nil)
        stopPlaybackTimer()
        isPlaying = false
        currentTime = 0
        duration = 0
        playerItemObserver = nil
        enableIdleTimer()  // Re-enable idle timer when stopping
    }

    func pauseAudio() {
        audioPlayer?.pause()
        stopPlaybackTimer()
        isPlaying = false
        enableIdleTimer()  // Re-enable idle timer when pausing
    }

    func resumeAudio() {
        guard let player = audioPlayer, player.currentItem != nil else { return }
        player.play()
        isPlaying = true
        startPlaybackTimer()
        disableIdleTimer()  // Disable idle timer when resuming
    }

    func setPlaybackSpeed(_ speed: Float) {
        currentPlaybackSpeed = speed

        if let player = audioPlayer, isPlaying {
            player.rate = speed
            print("🎵 Set playback rate to: \(speed)x")
        }
    }

    func seek(to time: TimeInterval) {
        print("🎵 Seeking to: \(time) seconds")

        guard let player = audioPlayer,
              let item = player.currentItem,
              item.duration.isNumeric else {
            print("🎵 No valid audio player or duration available for seeking")
            return
        }

        let itemDuration = CMTimeGetSeconds(item.duration)
        let seekTime = min(max(time, 0), itemDuration)
        print("🎵 Seeking to time: \(seekTime)")

        let cmSeekTime = CMTime(seconds: seekTime, preferredTimescale: 600)
        player.seek(to: cmSeekTime, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] completed in
            guard let self = self, completed else { return }

            DispatchQueue.main.async {
                self.currentTime = seekTime
                print("🎵 Seek completed - new time: \(self.currentTime)")

                // Update Now Playing elapsed time
                if var info = self.nowPlayingInfo.nowPlayingInfo {
                    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = seekTime
                    self.nowPlayingInfo.nowPlayingInfo = info
                }
            }
        }
    }

    private func startPlaybackTimer() {
        playbackTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self,
                  let player = self.audioPlayer,
                  let item = player.currentItem else { return }

            let time = CMTimeGetSeconds(player.currentTime())
            if time.isFinite {
                self.currentTime = time
            }

            // Update duration if it wasn't available initially
            let itemDuration = CMTimeGetSeconds(item.duration)
            if itemDuration.isFinite && itemDuration > 0 && self.duration == 0 {
                self.duration = itemDuration
            }
        }
    }

    private func stopPlaybackTimer() {
        playbackTimer?.invalidate()
        playbackTimer = nil
    }
}