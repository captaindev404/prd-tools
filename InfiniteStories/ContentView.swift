//
//  ContentView.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject private var themeSettings: ThemeSettings
    @Query private var heroes: [Hero]
    @Query private var stories: [Story]
    
    @State private var showingHeroCreation = false
    @State private var showingStoryGeneration = false
    @State private var showingSettings = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 10) {
                    Image(systemName: "book.pages.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.purple)
                    
                    Text("Infinite Stories")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Magical bedtime stories for children")
                        .font(.headline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                
                // Main Content
                if heroes.isEmpty {
                    // First time user - create hero
                    VStack(spacing: 20) {
                        Text("Welcome! Let's create your story hero")
                            .font(.title2)
                            .multilineTextAlignment(.center)
                        
                        Button(action: { showingHeroCreation = true }) {
                            Label("Create Your First Hero", systemImage: "person.crop.circle.badge.plus")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .background(Color.purple)
                                .cornerRadius(12)
                        }
                    }
                } else {
                    // Show existing heroes and stories
                    VStack(spacing: 20) {
                        if let currentHero = heroes.first {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Text("Your Hero")
                                        .font(.headline)
                                        .foregroundColor(.secondary)
                                    
                                    Spacer()
                                    
                                    Button("Edit") {
                                        showingHeroCreation = true
                                    }
                                    .font(.subheadline)
                                    .foregroundColor(.purple)
                                }
                                
                                HStack {
                                    Image(systemName: "person.circle.fill")
                                        .font(.largeTitle)
                                        .foregroundColor(.purple)
                                    
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(currentHero.name)
                                            .font(.title2)
                                            .fontWeight(.semibold)
                                        Text(currentHero.traitsDescription)
                                            .font(.subheadline)
                                            .foregroundColor(.secondary)
                                        
                                        if !currentHero.specialAbility.isEmpty {
                                            Text("Special: \(currentHero.specialAbility)")
                                                .font(.caption)
                                                .foregroundColor(.purple)
                                        }
                                    }
                                    
                                    Spacer()
                                }
                                .padding()
                                .background(Color(.systemGray6).opacity(colorScheme == .dark ? 0.5 : 1.0))
                                .cornerRadius(12)
                            }
                        }
                        
                        VStack(spacing: 15) {
                            Button(action: { showingStoryGeneration = true }) {
                                Label("Generate New Story", systemImage: "sparkles")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .padding()
                                    .frame(maxWidth: .infinity)
                                    .background(Color.orange)
                                    .cornerRadius(12)
                            }
                            .disabled(heroes.isEmpty)
                            
                            if !stories.isEmpty {
                                NavigationLink(destination: ImprovedStoryLibraryView()) {
                                    HStack {
                                        Image(systemName: "books.vertical.fill")
                                            .font(.system(size: 20))
                                        Text("View Story Library")
                                        Spacer()
                                        Text("\(stories.count)")
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.purple.opacity(0.2))
                                            .cornerRadius(8)
                                    }
                                    .font(.headline)
                                    .foregroundColor(.purple)
                                    .padding()
                                    .background(Color(.systemGray6).opacity(colorScheme == .dark ? 0.5 : 1.0))
                                    .cornerRadius(12)
                                }
                            }
                        }
                    }
                }
                
                Spacer()
            }
            .padding()
            .navigationBarHidden(false)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingSettings = true }) {
                        Image(systemName: "gear")
                            .foregroundColor(.purple)
                    }
                }
            }
            .sheet(isPresented: $showingHeroCreation) {
                HeroCreationView()
            }
            .sheet(isPresented: $showingStoryGeneration) {
                if let hero = heroes.first {
                    StoryGenerationView(hero: hero)
                }
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView()
                    .environmentObject(themeSettings)
            }
        }
    }
}

// Note: This is the original StoryLibraryView
// For the improved version, use ImprovedStoryLibraryView
struct StoryLibraryView: View {
    @Query(sort: \Story.createdAt, order: .reverse) private var stories: [Story]
    @State private var selectedStory: Story?
    
    var body: some View {
        List(stories) { story in
            StoryRow(story: story) {
                selectedStory = story
            }
        }
        .navigationTitle("Story Library")
        .sheet(item: $selectedStory) { story in
            NavigationStack {
                AudioPlayerView(story: story)
                    .onAppear {
                        print("📚 Opening AudioPlayerView for story: \(story.title)")
                    }
            }
        }
    }
}

struct StoryRow: View {
    let story: Story
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(story.title)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        if story.isFavorite {
                            Image(systemName: "heart.fill")
                                .foregroundColor(.red)
                                .font(.caption)
                        }
                    }
                    
                    Text(story.shortContent)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                    
                    HStack {
                        Text(story.formattedDate)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        HStack(spacing: 15) {
                            if story.hasAudio {
                                Label("\(Int(story.estimatedDuration / 60))min", systemImage: "speaker.wave.2")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                            
                            if story.playCount > 0 {
                                Label("\(story.playCount)", systemImage: "play")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Label(story.event.rawValue, systemImage: "sparkles")
                                .font(.caption)
                                .foregroundColor(.purple)
                        }
                    }
                }
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }
}


#Preview {
    ContentView()
        .modelContainer(for: Hero.self, inMemory: true)
}
