//
//  Hero.swift
//  InfiniteStories
//
//  Created by Captain Dev on 10/09/2025.
//

import Foundation
import SwiftData

@Model
final class Hero {
    var name: String
    var primaryTrait: CharacterTrait
    var secondaryTrait: CharacterTrait
    var appearance: String
    var specialAbility: String
    var createdAt: Date
    var isActive: Bool
    
    @Relationship(deleteRule: .cascade) var stories: [Story] = []
    
    init(name: String, primaryTrait: CharacterTrait, secondaryTrait: CharacterTrait, appearance: String = "", specialAbility: String = "") {
        self.name = name
        self.primaryTrait = primaryTrait
        self.secondaryTrait = secondaryTrait
        self.appearance = appearance
        self.specialAbility = specialAbility
        self.createdAt = Date()
        self.isActive = true
    }
    
    var traitsDescription: String {
        return "\(primaryTrait.rawValue) and \(secondaryTrait.rawValue)"
    }
    
    var fullDescription: String {
        var description = "\(name) is a \(primaryTrait.rawValue.lowercased()) and \(secondaryTrait.rawValue.lowercased()) character"
        
        if !appearance.isEmpty {
            description += " who looks like \(appearance)"
        }
        
        if !specialAbility.isEmpty {
            description += " and has the special ability to \(specialAbility)"
        }
        
        return description + "."
    }
}