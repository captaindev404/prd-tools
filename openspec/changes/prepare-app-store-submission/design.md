# Design: App Store Submission Preparation

## Architecture Decisions

### Privacy Manifest Structure

Apple requires a Privacy Manifest (`PrivacyInfo.xcprivacy`) for apps using certain APIs. Based on the codebase analysis:

**APIs likely requiring declaration:**

| API Category | Usage in App | Required Reason |
|-------------|--------------|-----------------|
| UserDefaults | App settings, preferences | `CA92.1` - App-specific data |
| File timestamp APIs | Audio/image caching | `DDA9.1` - Display to user |
| System boot time | Potentially in logging | `35F9.1` - Measure time intervals |
| Disk space APIs | Cache management | `E174.1` - Check available space |

**Privacy Manifest Template:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <!-- UserDefaults -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

### Launch Screen Strategy

**Current state:** Using empty `UILaunchScreen` dictionary (minimal launch screen)

**Options:**
1. **Storyboard Launch Screen** - More control, supports complex layouts
2. **SwiftUI Launch Screen** - Modern approach, but limited features
3. **Enhanced Info.plist** - Use `UILaunchScreen` keys for simple branding

**Decision:** Use enhanced Info.plist with background color and image for:
- Simpler maintenance
- Faster launch time
- Consistent with SwiftUI app structure

### Kids Category Considerations

If targeting the Kids Category:

1. **No third-party ads** - Not applicable (no ads in app)
2. **No analytics without consent** - Ensure no automatic data collection
3. **No external links** - Review all links in app
4. **Parental gate for purchases** - Review IAP flow if applicable
5. **COPPA compliance** - No personal data collection from children

**Decision:** Target 4+ age rating, consider Kids Category separately post-launch.

### App Store Screenshots

**Required sizes:**
- 6.9" (iPhone 16 Pro Max): 1320 x 2868 or 1290 x 2796
- 6.7" (iPhone 15 Pro Max): 1290 x 2796
- 6.5" (iPhone 14 Plus): 1284 x 2778
- 5.5" (iPhone 8 Plus): 1242 x 2208
- 12.9" iPad Pro: 2048 x 2732
- 11" iPad Pro: 1668 x 2388

**Recommended screenshots:**
1. Hero creation flow
2. Story generation
3. Audio player with illustrations
4. Story library
5. Reading journey statistics

## Testing Strategy

### Minimum Test Coverage

| Area | Current | Target |
|------|---------|--------|
| Unit Tests | ~2 files | Core services |
| UI Tests | ~2 files | Critical flows |
| Integration | None | API connectivity |

### Critical Test Scenarios

1. **Offline behavior** - App should block operations gracefully
2. **Authentication flow** - Sign in/up must work flawlessly
3. **Story generation** - End-to-end story creation
4. **Audio playback** - Background audio, lock screen controls
5. **Data persistence** - Heroes and stories persist correctly

## Deployment Configuration

### Signing & Provisioning

Required setup in Xcode:
1. Apple Developer Team selected
2. Automatic signing enabled (recommended)
3. App ID registered with capabilities:
   - Background Modes (audio, fetch, processing)
   - Push Notifications (if used)

### Build Settings for Release

```
ENABLE_BITCODE = NO  (deprecated)
SWIFT_OPTIMIZATION_LEVEL = -O
DEBUG_INFORMATION_FORMAT = dwarf-with-dsym
```

### Archive Checklist

Before archiving:
1. Select "Any iOS Device" as destination
2. Verify Release configuration
3. Check version/build numbers
4. Clean build folder
5. Archive and validate
