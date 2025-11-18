import Foundation
import UIKit
import BackgroundTasks
import os.log

final class BackgroundTaskManager {
    static let shared = BackgroundTaskManager()
    
    static let storyGenerationTaskIdentifier = "com.infinitestories.storygeneration"
    static let audioProcessingTaskIdentifier = "com.infinitestories.audioprocessing"
    
    private var activeBackgroundTask: UIBackgroundTaskIdentifier = .invalid
    
    private init() {}
    
    func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.storyGenerationTaskIdentifier,
            using: nil
        ) { [weak self] task in
            self?.handleStoryGenerationTask(task as! BGProcessingTask)
        }
        
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.audioProcessingTaskIdentifier,
            using: nil
        ) { [weak self] task in
            self?.handleAudioProcessingTask(task as! BGProcessingTask)
        }
        
        print("INFO: Background tasks registered")
    }
    
    func scheduleStoryGenerationTask() {
        // Only schedule if handlers are registered
        guard ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] == nil else {
            print("INFO: Skipping background task scheduling in test environment")
            return
        }
        
        let request = BGProcessingTaskRequest(identifier: Self.storyGenerationTaskIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60) // Give more time before first run
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("INFO: Story generation background task scheduled")
        } catch {
            print("ERROR: Failed to schedule story generation task: \(error.localizedDescription)")
        }
    }
    
    func scheduleAudioProcessingTask() {
        // Only schedule if handlers are registered
        guard ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] == nil else {
            print("INFO: Skipping background task scheduling in test environment")
            return
        }
        
        let request = BGProcessingTaskRequest(identifier: Self.audioProcessingTaskIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60) // Give more time before first run
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("INFO: Audio processing background task scheduled")
        } catch {
            print("ERROR: Failed to schedule audio processing task: \(error.localizedDescription)")
        }
    }
    
    func beginBackgroundTask(withName name: String, expirationHandler: (() -> Void)? = nil) -> UIBackgroundTaskIdentifier {
        let taskId = UIApplication.shared.beginBackgroundTask(withName: name) { [weak self] in
            print("WARNING: Background task \(name) is about to expire")
            expirationHandler?()
            if let taskId = self?.activeBackgroundTask, taskId != .invalid {
                UIApplication.shared.endBackgroundTask(taskId)
                self?.activeBackgroundTask = .invalid
            }
        }
        
        activeBackgroundTask = taskId
        print("INFO: Started background task: \(name) with ID: \(taskId.rawValue)")
        return taskId
    }
    
    func endBackgroundTask(_ identifier: UIBackgroundTaskIdentifier) {
        if identifier != .invalid {
            UIApplication.shared.endBackgroundTask(identifier)
            print("INFO: Ended background task with ID: \(identifier.rawValue)")
            if identifier == activeBackgroundTask {
                activeBackgroundTask = .invalid
            }
        }
    }
    
    private func handleStoryGenerationTask(_ task: BGProcessingTask) {
        print("INFO: Handling story generation background task")
        
        task.expirationHandler = { [weak self] in
            print("WARNING: Story generation task expired")
            task.setTaskCompleted(success: false)
        }
        
        NotificationCenter.default.post(
            name: .resumeStoryGeneration,
            object: nil,
            userInfo: ["backgroundTask": task]
        )
    }
    
    private func handleAudioProcessingTask(_ task: BGProcessingTask) {
        print("INFO: Handling audio processing background task")
        
        task.expirationHandler = { [weak self] in
            print("WARNING: Audio processing task expired")
            task.setTaskCompleted(success: false)
        }
        
        NotificationCenter.default.post(
            name: .resumeAudioProcessing,
            object: nil,
            userInfo: ["backgroundTask": task]
        )
    }
}

extension Notification.Name {
    static let resumeStoryGeneration = Notification.Name("resumeStoryGeneration")
    static let resumeAudioProcessing = Notification.Name("resumeAudioProcessing")
}