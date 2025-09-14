//
//  CustomEventCreationView.swift
//  InfiniteStories
//
//  Created on 2025-09-14.
//

import SwiftUI
import SwiftData

struct CustomEventCreationView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    // Form state
    @State private var currentStep = 0
    @State private var eventTitle = ""
    @State private var eventDescription = ""
    @State private var selectedCategory: EventCategory = .custom
    @State private var selectedAgeRange: AgeRange = .all
    @State private var selectedTone: StoryTone = .balanced
    @State private var keywords: [String] = []
    @State private var newKeyword = ""
    @State private var promptSeed = ""
    @State private var isEnhancingWithAI = false
    @State private var showingError = false
    @State private var errorMessage = ""
    
    @StateObject private var aiAssistant = CustomEventAIAssistant()
    
    private let totalSteps = 4
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress indicator
                ProgressBar(currentStep: currentStep, totalSteps: totalSteps)
                    .padding()
                
                // Step content
                TabView(selection: $currentStep) {
                    BasicInfoStepView(
                        title: $eventTitle,
                        description: $eventDescription,
                        onSuggestTitle: suggestTitleWithAI
                    )
                    .tag(0)
                    
                    CategorizationStepView(
                        category: $selectedCategory,
                        ageRange: $selectedAgeRange,
                        tone: $selectedTone
                    )
                    .tag(1)
                    
                    AIEnhancementStepView(
                        promptSeed: $promptSeed,
                        keywords: $keywords,
                        newKeyword: $newKeyword,
                        isEnhancing: isEnhancingWithAI,
                        onEnhance: enhanceWithAI,
                        onGenerateKeywords: generateKeywordsWithAI
                    )
                    .tag(2)
                    
                    PreviewStepView(
                        event: buildPreviewEvent(),
                        onSave: saveCustomEvent
                    )
                    .tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentStep)
                
                // Navigation buttons
                HStack(spacing: 16) {
                    if currentStep > 0 {
                        Button(action: { 
                            withAnimation { currentStep -= 1 }
                        }) {
                            Label("Previous", systemImage: "chevron.left")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                    
                    if currentStep < totalSteps - 1 {
                        Button(action: { 
                            withAnimation { currentStep += 1 }
                        }) {
                            Label("Next", systemImage: "chevron.right")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!isStepValid(currentStep))
                    }
                    
                    if currentStep == totalSteps - 1 {
                        Button(action: saveCustomEvent) {
                            Label("Save Event", systemImage: "checkmark.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!isFormValid())
                    }
                }
                .padding()
            }
            .navigationTitle("Create Custom Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    // MARK: - Validation
    
    private func isStepValid(_ step: Int) -> Bool {
        switch step {
        case 0:
            return !eventTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
                   !eventDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case 1:
            return true // Category, age, and tone all have defaults
        case 2:
            return !promptSeed.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        default:
            return true
        }
    }
    
    private func isFormValid() -> Bool {
        return !eventTitle.isEmpty && !eventDescription.isEmpty && !promptSeed.isEmpty
    }
    
    // MARK: - AI Integration
    
    private func suggestTitleWithAI() {
        guard !eventDescription.isEmpty else { return }
        
        Task {
            do {
                if let suggestedTitle = await aiAssistant.generateTitle(from: eventDescription) {
                    await MainActor.run {
                        withAnimation {
                            eventTitle = suggestedTitle
                        }
                    }
                }
            }
        }
    }
    
    private func enhanceWithAI() {
        guard !eventTitle.isEmpty && !eventDescription.isEmpty else { return }
        
        isEnhancingWithAI = true
        
        Task {
            do {
                let enhanced = await aiAssistant.enhancePromptSeed(
                    title: eventTitle,
                    description: eventDescription,
                    category: selectedCategory,
                    ageRange: selectedAgeRange,
                    tone: selectedTone
                )
                
                await MainActor.run {
                    withAnimation {
                        promptSeed = enhanced
                        isEnhancingWithAI = false
                    }
                }
            }
        }
    }
    
    private func generateKeywordsWithAI() {
        guard !eventTitle.isEmpty && !eventDescription.isEmpty else { return }
        
        Task {
            do {
                let generatedKeywords = await aiAssistant.generateKeywords(
                    for: eventTitle,
                    description: eventDescription
                )
                
                await MainActor.run {
                    withAnimation {
                        keywords = generatedKeywords
                    }
                }
            }
        }
    }
    
    // MARK: - Data Operations
    
    private func buildPreviewEvent() -> CustomStoryEvent {
        let event = CustomStoryEvent(
            title: eventTitle.isEmpty ? "New Event" : eventTitle,
            description: eventDescription.isEmpty ? "Description" : eventDescription,
            promptSeed: promptSeed.isEmpty ? eventDescription : promptSeed,
            category: selectedCategory,
            ageRange: selectedAgeRange,
            tone: selectedTone
        )
        event.keywords = keywords
        event.isAIEnhanced = !promptSeed.isEmpty && promptSeed != eventDescription
        return event
    }
    
    private func saveCustomEvent() {
        let event = CustomStoryEvent(
            title: eventTitle.trimmingCharacters(in: .whitespacesAndNewlines),
            description: eventDescription.trimmingCharacters(in: .whitespacesAndNewlines),
            promptSeed: promptSeed.isEmpty ? eventDescription : promptSeed,
            category: selectedCategory,
            ageRange: selectedAgeRange,
            tone: selectedTone
        )
        
        event.keywords = keywords
        event.isAIEnhanced = !promptSeed.isEmpty && promptSeed != eventDescription
        
        modelContext.insert(event)
        
        do {
            try modelContext.save()
            dismiss()
        } catch {
            errorMessage = "Failed to save custom event: \(error.localizedDescription)"
            showingError = true
        }
    }
}

// MARK: - Step Views

struct BasicInfoStepView: View {
    @Binding var title: String
    @Binding var description: String
    let onSuggestTitle: () -> Void
    
    private let exampleDescriptions = [
        "A story about overcoming fear of the dark",
        "An adventure about learning to ride a bike",
        "A tale about sharing toys with siblings",
        "A journey of trying new foods"
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "wand.and.stars")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.orange, .pink],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("Let's create a special story event!")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .multilineTextAlignment(.center)
                }
                .padding(.top)
                
                // Title input
                VStack(alignment: .leading, spacing: 8) {
                    Label("Event Title", systemImage: "textformat")
                        .font(.headline)
                    
                    HStack {
                        TextField("e.g., First Day at School", text: $title)
                            .textFieldStyle(.roundedBorder)
                        
                        Button(action: onSuggestTitle) {
                            Image(systemName: "sparkles")
                                .foregroundColor(.orange)
                        }
                        .buttonStyle(.bordered)
                        .disabled(description.isEmpty)
                    }
                    
                    Text("Give your event a memorable name")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Description input
                VStack(alignment: .leading, spacing: 8) {
                    Label("What's this event about?", systemImage: "text.alignleft")
                        .font(.headline)
                    
                    TextEditor(text: $description)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(.systemGray4), lineWidth: 1)
                        )
                    
                    Text("Describe the situation or experience for the story")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Example prompts
                VStack(alignment: .leading, spacing: 8) {
                    Text("Need inspiration?")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    ForEach(exampleDescriptions, id: \.self) { example in
                        Button(action: { 
                            withAnimation {
                                description = example
                            }
                        }) {
                            HStack {
                                Image(systemName: "lightbulb")
                                    .font(.caption)
                                Text(example)
                                    .font(.subheadline)
                                    .multilineTextAlignment(.leading)
                                Spacer()
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.orange.opacity(0.1))
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding()
        }
    }
}

struct CategorizationStepView: View {
    @Binding var category: EventCategory
    @Binding var ageRange: AgeRange
    @Binding var tone: StoryTone
    
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "tag.circle.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("Let's categorize your event")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .multilineTextAlignment(.center)
                }
                .padding(.top)
                
                // Category selection
                VStack(alignment: .leading, spacing: 12) {
                    Label("Category", systemImage: "folder")
                        .font(.headline)
                    
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(EventCategory.allCases, id: \.self) { cat in
                            CategoryButton(
                                category: cat,
                                isSelected: category == cat,
                                action: { category = cat }
                            )
                        }
                    }
                }
                
                // Age range selection
                VStack(alignment: .leading, spacing: 12) {
                    Label("Age Range", systemImage: "person.2")
                        .font(.headline)
                    
                    ForEach(AgeRange.allCases, id: \.self) { age in
                        AgeRangeButton(
                            ageRange: age,
                            isSelected: ageRange == age,
                            action: { ageRange = age }
                        )
                    }
                }
                
                // Tone selection
                VStack(alignment: .leading, spacing: 12) {
                    Label("Story Tone", systemImage: "waveform")
                        .font(.headline)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(StoryTone.allCases, id: \.self) { t in
                                ToneChip(
                                    tone: t,
                                    isSelected: tone == t,
                                    action: { tone = t }
                                )
                            }
                        }
                    }
                    
                    Text(tone.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 4)
                }
            }
            .padding()
        }
    }
}

struct AIEnhancementStepView: View {
    @Binding var promptSeed: String
    @Binding var keywords: [String]
    @Binding var newKeyword: String
    let isEnhancing: Bool
    let onEnhance: () -> Void
    let onGenerateKeywords: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "sparkles.rectangle.stack")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.purple, .pink],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("Enhance with AI")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("Let AI help make your event even better")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top)
                
                // Prompt seed
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Label("Story Prompt", systemImage: "text.bubble")
                            .font(.headline)
                        
                        Spacer()
                        
                        Button(action: onEnhance) {
                            if isEnhancing {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else {
                                Label("Enhance", systemImage: "sparkles")
                                    .font(.caption)
                            }
                        }
                        .buttonStyle(.bordered)
                        .disabled(isEnhancing)
                    }
                    
                    TextEditor(text: $promptSeed)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(.systemGray4), lineWidth: 1)
                        )
                    
                    Text("This prompt will guide the AI in creating stories")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Keywords
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Label("Keywords", systemImage: "tag")
                            .font(.headline)
                        
                        Spacer()
                        
                        Button(action: onGenerateKeywords) {
                            Label("Generate", systemImage: "sparkles")
                                .font(.caption)
                        }
                        .buttonStyle(.bordered)
                    }
                    
                    // Keyword input
                    HStack {
                        TextField("Add keyword", text: $newKeyword)
                            .textFieldStyle(.roundedBorder)
                            .onSubmit {
                                if !newKeyword.isEmpty {
                                    withAnimation {
                                        keywords.append(newKeyword)
                                        newKeyword = ""
                                    }
                                }
                            }
                        
                        Button(action: {
                            if !newKeyword.isEmpty {
                                withAnimation {
                                    keywords.append(newKeyword)
                                    newKeyword = ""
                                }
                            }
                        }) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.orange)
                        }
                        .disabled(newKeyword.isEmpty)
                    }
                    
                    // Keyword chips
                    if !keywords.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                ForEach(keywords, id: \.self) { keyword in
                                    KeywordChip(
                                        keyword: keyword,
                                        onDelete: {
                                            withAnimation {
                                                keywords.removeAll { $0 == keyword }
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    } else {
                        Text("No keywords added yet")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding(.vertical, 8)
                    }
                }
            }
            .padding()
        }
    }
}

struct PreviewStepView: View {
    let event: CustomStoryEvent
    let onSave: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.green, .blue],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("Review Your Event")
                        .font(.title2)
                        .fontWeight(.semibold)
                }
                .padding(.top)
                
                // Event preview card
                VStack(alignment: .leading, spacing: 16) {
                    // Title
                    HStack {
                        Image(systemName: event.iconName)
                            .font(.title2)
                            .foregroundColor(.orange)
                        
                        Text(event.title)
                            .font(.title3)
                            .fontWeight(.bold)
                        
                        Spacer()
                    }
                    
                    Divider()
                    
                    // Details
                    VStack(alignment: .leading, spacing: 12) {
                        DetailRow(
                            icon: "text.alignleft",
                            label: "Description",
                            value: event.eventDescription
                        )
                        
                        DetailRow(
                            icon: "folder",
                            label: "Category",
                            value: event.category.rawValue
                        )
                        
                        DetailRow(
                            icon: "person.2",
                            label: "Age Range",
                            value: event.ageRange.rawValue
                        )
                        
                        DetailRow(
                            icon: "waveform",
                            label: "Tone",
                            value: event.tone.rawValue
                        )
                        
                        if event.isAIEnhanced {
                            DetailRow(
                                icon: "sparkles",
                                label: "AI Enhanced",
                                value: "Yes"
                            )
                        }
                        
                        if !event.keywords.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Label("Keywords", systemImage: "tag")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                Text(event.keywords.joined(separator: ", "))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    Divider()
                    
                    // Prompt preview
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Story Prompt", systemImage: "text.bubble")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        Text(event.promptSeed)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(8)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
                
                // Ready message
                VStack(spacing: 8) {
                    Image(systemName: "sparkles")
                        .font(.title)
                        .foregroundColor(.orange)
                    
                    Text("Your custom event is ready!")
                        .font(.headline)
                    
                    Text("You can now use this event to generate personalized stories")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
            }
            .padding()
        }
    }
}

// MARK: - Supporting Views

struct ProgressBar: View {
    let currentStep: Int
    let totalSteps: Int
    
    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<totalSteps, id: \.self) { step in
                RoundedRectangle(cornerRadius: 4)
                    .fill(step <= currentStep ? Color.orange : Color(.systemGray4))
                    .frame(height: 6)
                    .animation(.easeInOut, value: currentStep)
            }
        }
    }
}

struct CategoryButton: View {
    let category: EventCategory
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: category.icon)
                    .font(.title2)
                Text(category.rawValue)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(isSelected ? Color.orange.opacity(0.2) : Color(.systemGray6))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.orange : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

struct AgeRangeButton: View {
    let ageRange: AgeRange
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .orange : .secondary)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(ageRange.rawValue)
                        .font(.subheadline)
                        .fontWeight(isSelected ? .medium : .regular)
                    
                    Text("Ages \(ageRange.minAge)-\(ageRange.maxAge)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .padding()
            .background(isSelected ? Color.orange.opacity(0.1) : Color(.systemGray6))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

struct ToneChip: View {
    let tone: StoryTone
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(tone.rawValue)
                .font(.subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.orange : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
        .buttonStyle(.plain)
    }
}

struct KeywordChip: View {
    let keyword: String
    let onDelete: () -> Void
    
    var body: some View {
        HStack(spacing: 4) {
            Text(keyword)
                .font(.caption)
            
            Button(action: onDelete) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.orange.opacity(0.2))
        .cornerRadius(15)
    }
}

struct DetailRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundColor(.orange)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(value)
                    .font(.subheadline)
            }
            
            Spacer()
        }
    }
}

// MARK: - Preview

struct CustomEventCreationView_Previews: PreviewProvider {
    static var previews: some View {
        CustomEventCreationView()
    }
}