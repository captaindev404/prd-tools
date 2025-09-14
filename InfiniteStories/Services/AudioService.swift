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

enum AudioServiceError: Error {
    case fileCreationFailed
    case playbackFailed
    case audioGenerationFailed(String)
    case noAIService
}

protocol AudioServiceProtocol {
    func generateAudioFile(from text: String, fileName: String, voice: String, language: String) async throws -> URL
    func playAudio(from url: URL) throws
    func pauseAudio()
    func resumeAudio()
    func seek(to time: TimeInterval)
    func setAIService(_ service: AIServiceProtocol)
    func stopAudio()
    func setPlaybackSpeed(_ speed: Float)
    var isPlaying: Bool { get }
    var currentTime: TimeInterval { get }
    var duration: TimeInterval { get }
}

class AudioService: NSObject, ObservableObject, AudioServiceProtocol, AVAudioPlayerDelegate {
    private var audioPlayer: AVAudioPlayer?
    private var currentAudioURL: URL?
    private var aiService: AIServiceProtocol?
    private var currentPlaybackSpeed: Float = 1.0
    
    @Published var isPlaying: Bool = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    
    private var playbackTimer: Timer?
    
    override init() {
        super.init()
        setupAudioSession()
        setupNotificationObservers()
    }
    
    deinit {
        // Clean up and ensure idle timer is re-enabled
        IdleTimerManager.shared.enableIdleTimer(for: "AudioService")
        NotificationCenter.default.removeObserver(self)
    }
    
    func setAIService(_ service: AIServiceProtocol) {
        self.aiService = service
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
            try AVAudioSession.sharedInstance().setActive(true)
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
            // Interruption began (phone call, etc.)
            if isPlaying {
                pauseAudio()
            }
        case .ended:
            // Interruption ended
            if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                if options.contains(.shouldResume) {
                    // Resume playback if appropriate
                    resumeAudio()
                }
            }
        @unknown default:
            break
        }
    }
    
    func generateAudioFile(from text: String, fileName: String, voice: String = "nova", language: String = "English") async throws -> URL {
        print("🎵 === Audio Generation Started ===")
        print("🎵 Using voice: \(voice)")
        print("🎵 Text length: \(text.count) characters")
        
        // Check if AI service is available
        guard let aiService = aiService else {
            print("🎵 ❌ No AI service configured")
            throw AudioServiceError.noAIService
        }
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioFileName = "\(fileName).mp3"
        let audioURL = documentsPath.appendingPathComponent(audioFileName)
        
        do {
            print("🎵 Generating audio with OpenAI API...")
            let audioData = try await aiService.generateSpeech(text: text, voice: voice, language: language)
            
            // Save the MP3 data to file
            try audioData.write(to: audioURL)
            print("🎵 ✅ Audio file saved: \(audioURL.path)")
            print("🎵 File size: \(audioData.count) bytes")
            return audioURL
            
        } catch {
            print("🎵 ❌ Audio generation failed: \(error.localizedDescription)")
            throw AudioServiceError.audioGenerationFailed(error.localizedDescription)
        }
    }
    
    func playAudio(from url: URL) throws {
        stopAudio()
        
        print("🎵 Playing audio file from: \(url.path)")
        print("🎵 File extension: \(url.pathExtension)")
        
        // Only play MP3 files - no TTS fallback
        guard url.pathExtension == "mp3" else {
            print("🎵 ❌ Invalid audio file format. Only MP3 files are supported.")
            throw AudioServiceError.playbackFailed
        }
        
        do {
            audioPlayer = try AVAudioPlayer(contentsOf: url)
            audioPlayer?.delegate = self
            audioPlayer?.prepareToPlay()
            
            guard let player = audioPlayer else {
                throw AudioServiceError.playbackFailed
            }
            
            // Enable rate adjustment for playback speed control
            player.enableRate = true
            player.rate = currentPlaybackSpeed
            
            duration = player.duration
            currentAudioURL = url
            
            print("🎵 MP3 duration: \(duration) seconds")
            print("🎵 Playback rate: \(currentPlaybackSpeed)x")
            
            if player.play() {
                isPlaying = true
                startPlaybackTimer()
                disableIdleTimer()  // Prevent phone from sleeping during playback
                print("🎵 ✅ Audio playback started successfully")
            } else {
                throw AudioServiceError.playbackFailed
            }
        } catch {
            print("🎵 ❌ Failed to play audio file: \(error)")
            throw AudioServiceError.playbackFailed
        }
    }
    
    func stopAudio() {
        audioPlayer?.stop()
        stopPlaybackTimer()
        isPlaying = false
        currentTime = 0
        enableIdleTimer()  // Re-enable idle timer when stopping
    }
    
    func pauseAudio() {
        audioPlayer?.pause()
        stopPlaybackTimer()
        isPlaying = false
        enableIdleTimer()  // Re-enable idle timer when pausing
    }
    
    func resumeAudio() {
        guard let player = audioPlayer else { return }
        if player.play() {
            isPlaying = true
            startPlaybackTimer()
            disableIdleTimer()  // Disable idle timer when resuming
        }
    }
    
    func setPlaybackSpeed(_ speed: Float) {
        currentPlaybackSpeed = speed
        
        if let player = audioPlayer {
            player.rate = speed
            print("🎵 Set playback rate to: \(speed)x")
        }
    }
    
    func seek(to time: TimeInterval) {
        print("🎵 Seeking to: \(time) seconds")
        
        if let player = audioPlayer, player.duration > 0 {
            let seekTime = min(max(time, 0), player.duration)
            print("🎵 Seeking to time: \(seekTime)")
            player.currentTime = seekTime
            currentTime = seekTime
            print("🎵 Seek completed - new time: \(currentTime)")
        } else {
            print("🎵 No valid audio player or duration available for seeking")
        }
    }
    
    private func startPlaybackTimer() {
        playbackTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self, let player = self.audioPlayer else { return }
            self.currentTime = player.currentTime
        }
    }
    
    private func stopPlaybackTimer() {
        playbackTimer?.invalidate()
        playbackTimer = nil
    }
    
    // MARK: - AVAudioPlayerDelegate
    
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        isPlaying = false
        currentTime = 0
        stopPlaybackTimer()
        enableIdleTimer()  // Re-enable idle timer when playback finishes
        print("🎵 Audio playback finished")
    }
    
    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        isPlaying = false
        stopPlaybackTimer()
        enableIdleTimer()  // Re-enable idle timer on error
        print("Audio decode error: \(error?.localizedDescription ?? "Unknown error")")
    }
}