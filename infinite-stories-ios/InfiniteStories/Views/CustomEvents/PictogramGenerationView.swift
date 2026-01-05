//
//  PictogramGenerationView.swift
//  InfiniteStories
//
//  View for generating and managing custom event pictograms
//  NOTE: Pictogram generation is deferred to a future iteration.
//        This view is a placeholder for future functionality.
//

import SwiftUI

struct PictogramGenerationView: View {
    @Environment(\.dismiss) private var dismiss

    let event: CustomStoryEvent

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                // Coming soon illustration
                VStack(spacing: 16) {
                    Image(systemName: "photo.badge.plus")
                        .font(.system(size: 80))
                        .foregroundColor(.purple.opacity(0.6))
                        .symbolEffect(.pulse)

                    Text("customEvent.pictogram.title")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("customEvent.pictogram.comingSoon")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }

                Spacer()

                // Event info
                VStack(spacing: 8) {
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(hex: event.colorHex).opacity(0.2))
                            .frame(width: 60, height: 60)
                            .overlay(
                                Image(systemName: event.iconName)
                                    .font(.title2)
                                    .foregroundColor(Color(hex: event.colorHex))
                            )

                        VStack(alignment: .leading, spacing: 4) {
                            Text(event.title)
                                .font(.headline)

                            Text(event.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }

                        Spacer()
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(16)
                }
                .padding(.horizontal)

                Spacer()
            }
            .padding()
            .navigationTitle("customEvent.pictogram.navigationTitle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("customEvent.pictogram.close") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    PictogramGenerationView(
        event: CustomStoryEvent.previewData[0]
    )
}
