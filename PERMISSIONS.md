# iOS Permissions Guide for InfiniteStories

## Current Status: NO PERMISSIONS REQUIRED ✅

The InfiniteStories app currently works without requiring any user permissions because it only uses:

- **SwiftData**: App's private database
- **AVSpeechSynthesizer**: System text-to-speech (no mic access)
- **AVAudioPlayer**: Audio playback
- **FileManager**: App's Documents directory
- **URLSession**: Network requests (automatically granted)

## Future Permissions (if you add these features)

### 1. Microphone Access
**When needed**: If you add voice input features
```xml
<!-- Add to Info.plist -->
<key>NSMicrophoneUsageDescription</key>
<string>InfiniteStories needs microphone access to record custom voices for stories.</string>
```

### 2. Speech Recognition
**When needed**: If you add speech-to-text features
```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>InfiniteStories uses speech recognition to help create stories from voice input.</string>
```

### 3. Photo Library
**When needed**: If you add custom hero images
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>InfiniteStories needs access to your photos to set custom hero images.</string>
```

### 4. Camera
**When needed**: If you add photo capture for heroes
```xml
<key>NSCameraUsageDescription</key>
<string>InfiniteStories needs camera access to take photos of your child's drawings for heroes.</string>
```

## Implementation Notes

### Current Audio Setup
The app uses `AVAudioSession` with `.playback` category, which doesn't require user permission:

```swift
try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
```

### Network Requests
URLSession requests to AI APIs work automatically without user permission. iOS handles network connectivity transparently.

### File Storage
All app data is stored in the app's sandbox:
- **SwiftData**: Automatic app database
- **Audio files**: App's Documents directory
- **Settings**: UserDefaults

## Testing Permissions

To test your app's permission handling:

1. **iOS Simulator**: Permissions are automatically granted
2. **Real Device**: Same behavior - no permissions needed
3. **App Store**: No additional permission requirements

## App Store Considerations

### Required Info.plist Entries
None required for current functionality.

### Optional Recommendations
Add these for better App Store presentation:

```xml
<key>NSSupportsLiveActivities</key>
<false/>
<key>UIRequiresPersistentWiFi</key>
<false/>
<key>LSApplicationCategoryType</key>
<string>public.app-category.education</string>
```

## Summary

🎉 **Your app is ready to ship without any permission dialogs!** 

This provides a great user experience since parents can immediately start using the app without any permission barriers.