# Idle Timer Management Implementation

## Overview
The InfiniteStories app now prevents the phone from sleeping when a bedtime story is playing. This ensures parents don't have to worry about the phone's screen timing out during story playback.

## Implementation Details

### Core Changes in AudioService.swift

1. **Import UIKit**: Added UIKit import to access `UIApplication.shared.isIdleTimerDisabled`

2. **Idle Timer Control Methods**:
   - `disableIdleTimer()`: Sets `UIApplication.shared.isIdleTimerDisabled = true`
   - `enableIdleTimer()`: Sets `UIApplication.shared.isIdleTimerDisabled = false`
   - Both methods use `DispatchQueue.main.async` to ensure UI updates happen on the main thread

3. **Playback State Management**:
   - When audio starts playing (MP3 or TTS): Idle timer is disabled
   - When audio pauses: Idle timer is re-enabled
   - When audio stops: Idle timer is re-enabled
   - When audio resumes: Idle timer is disabled again
   - When audio finishes naturally: Idle timer is re-enabled

4. **App Lifecycle Handling**:
   - `appWillResignActive`: Checks if audio is playing, re-enables idle timer if not
   - `appDidBecomeActive`: Checks if audio is playing, disables idle timer if yes
   - Audio interruption handling: Manages idle timer during phone calls or other interruptions

5. **Delegate Methods Updated**:
   - `AVAudioPlayerDelegate`: Handles idle timer when audio finishes or encounters errors
   - `AVSpeechSynthesizerDelegate`: Manages idle timer for text-to-speech playback

### Safety Measures

1. **Cleanup in deinit**: The AudioService deinit ensures idle timer is re-enabled when the service is deallocated

2. **View Lifecycle**: AudioPlayerView.onDisappear explicitly re-enables idle timer as a safety measure

3. **Error Handling**: Idle timer is re-enabled on any playback errors

## User Experience

### When Idle Timer is Disabled (Phone Won't Sleep):
- Story is actively playing (audio or TTS)
- Audio is resumed after being paused

### When Idle Timer is Enabled (Phone Can Sleep):
- No audio is playing
- Audio is paused
- Audio is stopped
- Audio finishes playing
- User leaves the audio player screen
- App encounters an error during playback

## Technical Considerations

1. **Power Management**: The implementation follows iOS best practices by only disabling the idle timer during active playback

2. **Background Audio**: The app uses `.playback` audio session category, allowing:
   - Audio to continue when the screen is manually locked
   - Audio to continue when the app goes to background
   - Proper handling of audio interruptions (phone calls, etc.)

3. **Thread Safety**: All idle timer updates are dispatched to the main queue

## Testing Recommendations

1. **Manual Testing**:
   - Start playing a story and wait to confirm the screen doesn't dim/lock
   - Pause the story and verify the screen can dim/lock normally
   - Test interruptions (receive a phone call during playback)
   - Test app backgrounding and foregrounding scenarios

2. **Edge Cases to Test**:
   - Switching between MP3 and TTS playback
   - Using playback speed controls
   - Seeking through audio
   - Multiple pause/resume cycles

## Benefits

1. **User Convenience**: Parents don't need to adjust their phone's auto-lock settings
2. **Battery Optimization**: Idle timer is only disabled when necessary
3. **Consistent Experience**: Works for both MP3 files and text-to-speech
4. **Robust Error Handling**: Fails safely by re-enabling idle timer on any error