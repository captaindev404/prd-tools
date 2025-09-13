//
//  HeroCreationView.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import SwiftUI
import SwiftData

struct HeroCreationView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    
    let heroToEdit: Hero?
    
    @State private var heroName: String = ""
    @State private var primaryTrait: CharacterTrait = .brave
    @State private var secondaryTrait: CharacterTrait = .kind
    @State private var appearance: String = ""
    @State private var specialAbility: String = ""
    @State private var currentStep = 0
    
    private let totalSteps = 4
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Progress indicator
                ProgressView(value: Double(currentStep), total: Double(totalSteps))
                    .progressViewStyle(LinearProgressViewStyle(tint: .purple))
                    .padding(.horizontal)
                
                ScrollView {
                    VStack(spacing: 30) {
                        headerView
                        currentStepView
                    }
                    .padding()
                }
                
                // Navigation buttons
                HStack {
                    if currentStep > 0 {
                        Button("Back") {
                            withAnimation {
                                currentStep -= 1
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                    
                    Spacer()
                    
                    Button(currentStep == totalSteps - 1 ? (heroToEdit != nil ? "Update Hero" : "Create Hero") : "Next") {
                        withAnimation {
                            if currentStep == totalSteps - 1 {
                                saveHero()
                            } else {
                                currentStep += 1
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!canProceed)
                }
                .padding()
            }
            .navigationTitle(heroToEdit != nil ? "Edit Hero" : "Create Your Hero")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            if let hero = heroToEdit {
                heroName = hero.name
                primaryTrait = hero.primaryTrait
                secondaryTrait = hero.secondaryTrait
                appearance = hero.appearance
                specialAbility = hero.specialAbility
            }
        }
    }
    
    @ViewBuilder
    private var headerView: some View {
        VStack(spacing: 10) {
            Image(systemName: "person.crop.circle.badge.star.fill")
                .font(.system(size: 60))
                .foregroundColor(.purple)
            
            Text("Let's Create Your Story Hero!")
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            
            Text("Step \(currentStep + 1) of \(totalSteps)")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    @ViewBuilder
    private var currentStepView: some View {
        switch currentStep {
        case 0:
            nameStep
        case 1:
            primaryTraitStep
        case 2:
            secondaryTraitStep
        case 3:
            customizationStep
        default:
            EmptyView()
        }
    }
    
    @ViewBuilder
    private var nameStep: some View {
        VStack(spacing: 20) {
            Text("What's your hero's name?")
                .font(.title3)
                .fontWeight(.semibold)
            
            TextField("Enter hero name", text: $heroName)
                .textFieldStyle(.roundedBorder)
                .font(.title2)
                .multilineTextAlignment(.center)
            
            Text("Choose a name that your child will love to hear in stories!")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
    
    @ViewBuilder
    private var primaryTraitStep: some View {
        VStack(spacing: 20) {
            Text("What's \(heroName)'s main personality?")
                .font(.title3)
                .fontWeight(.semibold)
                .multilineTextAlignment(.center)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 15) {
                ForEach(CharacterTrait.allCases, id: \.self) { trait in
                    TraitCard(
                        trait: trait,
                        isSelected: trait == primaryTrait
                    ) {
                        primaryTrait = trait
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    private var secondaryTraitStep: some View {
        VStack(spacing: 20) {
            Text("What's \(heroName)'s secondary trait?")
                .font(.title3)
                .fontWeight(.semibold)
                .multilineTextAlignment(.center)
            
            Text("This adds more depth to your hero's personality!")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 15) {
                ForEach(CharacterTrait.allCases.filter { $0 != primaryTrait }, id: \.self) { trait in
                    TraitCard(
                        trait: trait,
                        isSelected: trait == secondaryTrait
                    ) {
                        secondaryTrait = trait
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    private var customizationStep: some View {
        VStack(spacing: 25) {
            Text("Let's add some special details!")
                .font(.title3)
                .fontWeight(.semibold)
            
            VStack(alignment: .leading, spacing: 15) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("How does \(heroName) look?")
                        .font(.headline)
                    
                    TextField("e.g., has sparkly blue eyes and curly hair", text: $appearance)
                        .textFieldStyle(.roundedBorder)
                    
                    Text("Optional - helps make stories more vivid")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("What's \(heroName)'s special ability?")
                        .font(.headline)
                    
                    TextField("e.g., can talk to animals, creates magical rainbows", text: $specialAbility)
                        .textFieldStyle(.roundedBorder)
                    
                    Text("Optional - adds magical elements to stories")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Hero preview
            HeroPreviewCard(
                name: heroName,
                primaryTrait: primaryTrait,
                secondaryTrait: secondaryTrait,
                appearance: appearance,
                specialAbility: specialAbility
            )
        }
    }
    
    private var canProceed: Bool {
        switch currentStep {
        case 0:
            return !heroName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        default:
            return true
        }
    }
    
    private func saveHero() {
        if let heroToEdit = heroToEdit {
            // Update existing hero
            heroToEdit.name = heroName.trimmingCharacters(in: .whitespacesAndNewlines)
            heroToEdit.primaryTrait = primaryTrait
            heroToEdit.secondaryTrait = secondaryTrait
            heroToEdit.appearance = appearance.trimmingCharacters(in: .whitespacesAndNewlines)
            heroToEdit.specialAbility = specialAbility.trimmingCharacters(in: .whitespacesAndNewlines)
        } else {
            // Create new hero
            let hero = Hero(
                name: heroName.trimmingCharacters(in: .whitespacesAndNewlines),
                primaryTrait: primaryTrait,
                secondaryTrait: secondaryTrait,
                appearance: appearance.trimmingCharacters(in: .whitespacesAndNewlines),
                specialAbility: specialAbility.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            modelContext.insert(hero)
        }
        
        do {
            try modelContext.save()
            dismiss()
        } catch {
            print("Failed to save hero: \(error)")
        }
    }
}

struct TraitCard: View {
    @Environment(\.colorScheme) private var colorScheme
    let trait: CharacterTrait
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(trait.rawValue)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text(trait.description)
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding()
            .frame(maxWidth: .infinity, minHeight: 100)
            .background(isSelected ? Color.purple.opacity(colorScheme == .dark ? 0.2 : 0.1) : Color(.systemGray6).opacity(colorScheme == .dark ? 0.5 : 1.0))
            .foregroundColor(isSelected ? .purple : .primary)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.purple : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

struct HeroPreviewCard: View {
    @Environment(\.colorScheme) private var colorScheme
    let name: String
    let primaryTrait: CharacterTrait
    let secondaryTrait: CharacterTrait
    let appearance: String
    let specialAbility: String
    
    var body: some View {
        VStack(spacing: 15) {
            Text("Hero Preview")
                .font(.headline)
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: "person.circle.fill")
                        .font(.largeTitle)
                        .foregroundColor(.purple)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(name)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("\(primaryTrait.rawValue) and \(secondaryTrait.rawValue)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                
                if !appearance.isEmpty {
                    Text("Appearance: \(appearance)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                if !specialAbility.isEmpty {
                    Text("Special Ability: \(specialAbility)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .background(Color(.systemGray6).opacity(colorScheme == .dark ? 0.5 : 1.0))
            .cornerRadius(12)
        }
    }
}


#Preview {
    HeroCreationView(heroToEdit: nil)
        .modelContainer(for: Hero.self, inMemory: true)
}