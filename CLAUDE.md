# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InfiniteStories** is a SwiftUI iOS/macOS app that generates personalized audio bedtime stories for children. Parents create a hero character with customizable traits, then generate AI-powered stories for different daily events. Each story is converted to audio for playback during bedtime.

## Architecture

### Core Data Models (SwiftData)
- **Hero**: Character with name, personality traits, appearance, and special abilities
- **Story**: Generated story content linked to a hero with audio file reference
- **CharacterTrait**: Enum defining personality options (brave, kind, curious, etc.)
- **StoryEvent**: Enum for story contexts (bedtime, school day, birthday, etc.)

### Services Layer
- **AIService**: Handles story generation via OpenAI/Anthropic APIs with mock implementation
- **AudioService**: Text-to-speech conversion and audio playback management
- **AppSettings**: User preferences and API configuration

### View Architecture (MVVM)
- **ContentView**: Main dashboard showing hero and story library
- **HeroCreationView**: Multi-step wizard for creating/editing heroes
- **StoryGenerationView**: Event selection and story generation interface
- **AudioPlayerView**: Story playback with controls and progress tracking
- **StoryLibraryView**: List of generated stories with metadata

### ViewModels
- **StoryViewModel**: Manages story generation, audio playback, and error handling

## Key Features

1. **Hero Creation**: Step-by-step character building with trait selection
2. **Story Generation**: AI-powered stories based on hero traits and selected events
3. **Audio Generation**: Text-to-speech with iOS AVSpeechSynthesizer
4. **Story Library**: Persistent storage with favorites, play counts, and filtering
5. **Audio Playback**: Full-featured player with speed control and progress tracking

## Development Commands

### Building and Testing
```bash
# Build (requires Xcode installation)
xcodebuild -project InfiniteStories.xcodeproj -scheme InfiniteStories build

# Run tests
xcodebuild -project InfiniteStories.xcodeproj -scheme InfiniteStories test
```

### API Configuration
The app uses mock services by default. To enable real AI generation:
1. Configure OpenAI API key in `AppSettings`
2. Replace `MockAIService` with `OpenAIService` in `StoryViewModel`

## Key Technologies

- **SwiftUI**: Declarative UI with navigation and sheets
- **SwiftData**: Model persistence with relationships
- **AVFoundation**: Audio playback and text-to-speech
- **Combine**: Reactive programming for ViewModels
- **URLSession**: HTTP requests for AI APIs

## File Structure

```
InfiniteStories/
├── Models/
│   ├── Hero.swift              # Character model
│   ├── Story.swift             # Story model  
│   └── CharacterTraits.swift   # Enums for traits/events
├── Views/
│   ├── HeroCreation/
│   │   └── HeroCreationView.swift
│   ├── StoryGeneration/
│   │   └── StoryGenerationView.swift
│   ├── AudioPlayer/
│   │   └── AudioPlayerView.swift
│   └── ContentView.swift       # Main dashboard
├── Services/
│   ├── AIService.swift         # Story generation
│   └── AudioService.swift      # Audio handling
├── ViewModels/
│   └── StoryViewModel.swift    # Business logic
└── InfiniteStoriesApp.swift    # App entry point
```

## Development Notes

- Models use SwiftData `@Model` and `@Relationship` for persistence
- Views follow SwiftUI patterns with `@State`, `@Query`, and `@Environment`
- Services implement protocols for easy mocking and testing
- Audio files are stored in Documents directory with UUID-based names
- Error handling includes user-friendly messages for API failures