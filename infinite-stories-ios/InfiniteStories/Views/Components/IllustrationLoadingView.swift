//
//  IllustrationLoadingView.swift
//  InfiniteStories
//
//  Created by Captain Dev on 16/09/2025.
//

import SwiftUI

struct IllustrationLoadingView: View {
    let sceneNumber: Int
    let progress: Double?

    var body: some View {
        ZStack {
            // System background
            Color(.secondarySystemBackground)

            VStack(spacing: 20) {
                // Static icon
                Image(systemName: "wand.and.stars")
                    .font(.system(size: 50))
                    .foregroundColor(.accentColor)
                    .frame(height: 80)

                Text("Generating Scene \(sceneNumber)")
                    .font(.headline)
                    .foregroundColor(.primary)

                if let progress = progress {
                    // Progress indicator
                    VStack(spacing: 8) {
                        ProgressView(value: progress)
                            .progressViewStyle(LinearProgressViewStyle())
                            .tint(.accentColor)
                            .scaleEffect(y: 2)

                        Text("\(Int(progress * 100))%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .monospacedDigit()
                    }
                    .frame(width: 200)
                } else {
                    // Indeterminate progress
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .accentColor))
                        .scaleEffect(1.5)
                }

                Text("Creating magical illustration...")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .italic()
            }
            .padding(30)
        }
    }
}

// MARK: - Skeleton Loading View

struct IllustrationSkeletonView: View {
    @State private var shimmerPhase: CGFloat = -1

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Base skeleton
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.2))

                // Shimmer effect
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.gray.opacity(0.2),
                                Color.gray.opacity(0.3),
                                Color.gray.opacity(0.2)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .offset(x: shimmerPhase * geometry.size.width)
                    .mask(
                        RoundedRectangle(cornerRadius: 12)
                    )

                // Content placeholders
                VStack(spacing: 16) {
                    // Image placeholder
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: geometry.size.height * 0.6)

                    // Text placeholders
                    VStack(alignment: .leading, spacing: 8) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 16)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: geometry.size.width * 0.7, height: 16)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: geometry.size.width * 0.5, height: 16)
                    }
                }
                .padding()
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                shimmerPhase = 2
            }
        }
    }
}

// MARK: - Error State View

struct IllustrationErrorView: View {
    let sceneNumber: Int
    let retryAction: () -> Void

    var body: some View {
        ZStack {
            // System background
            Color(.secondarySystemBackground)

            VStack(spacing: 20) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.orange)

                Text("Unable to Load Scene \(sceneNumber)")
                    .font(.headline)
                    .foregroundColor(.primary)

                Text("The illustration could not be generated")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)

                Button(action: retryAction) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("Retry")
                    }
                    .font(.subheadline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.orange)
                    .cornerRadius(10)
                }
            }
            .padding()
        }
    }
}

// MARK: - Empty Illustrations View

struct EmptyIllustrationsView: View {
    let onGenerateAction: () -> Void

    var body: some View {
        ZStack {
            // System background
            Color(.systemBackground)

            VStack(spacing: 24) {
                // Static icon
                ZStack {
                    Circle()
                        .fill(Color.accentColor.opacity(0.1))
                        .frame(width: 120, height: 120)

                    Image(systemName: "photo.stack.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.accentColor)
                }

                VStack(spacing: 8) {
                    Text("No Illustrations Yet")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Bring your story to life with beautiful AI-generated illustrations")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }

                Button(action: onGenerateAction) {
                    HStack(spacing: 8) {
                        Image(systemName: "wand.and.stars")
                        Text("Generate Illustrations")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.accentColor)
                    .cornerRadius(12)
                    .shadow(color: Color.accentColor.opacity(0.3), radius: 8, x: 0, y: 4)
                }
            }
        }
    }
}

// MARK: - Preview

struct IllustrationLoadingView_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            IllustrationLoadingView(sceneNumber: 1, progress: 0.65)
                .frame(height: 300)
                .cornerRadius(12)
                .padding()

            IllustrationSkeletonView()
                .frame(height: 300)
                .padding()

            IllustrationErrorView(sceneNumber: 2, retryAction: {})
                .frame(height: 300)
                .cornerRadius(12)
                .padding()
        }
    }
}