//
//  AuthenticationView.swift
//  InfiniteStories
//
//  Authentication screen for sign in and sign up
//

import SwiftUI

struct AuthenticationView: View {
    @EnvironmentObject var authState: AuthStateManager
    @StateObject private var viewModel = AuthenticationViewModel()
    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var confirmPassword = ""
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var animateGradient = false
    @FocusState private var focusedField: Field?

    enum Field: Hashable {
        case email, password, confirmPassword, name
    }

    var body: some View {
        ZStack {
            // Animated gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color.purple.opacity(0.15),
                    Color.orange.opacity(0.1),
                    Color.blue.opacity(0.05)
                ]),
                startPoint: animateGradient ? .topLeading : .bottomTrailing,
                endPoint: animateGradient ? .bottomTrailing : .topLeading
            )
            .ignoresSafeArea()
            .animation(
                Animation.linear(duration: 10)
                    .repeatForever(autoreverses: true),
                value: animateGradient
            )

            ScrollView {
                VStack(spacing: 30) {
                    // Header
                    VStack(spacing: 15) {
                        Image(systemName: "sparkles.rectangle.stack.fill")
                            .font(.system(size: 70))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.purple, Color.orange],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .symbolEffect(.pulse.wholeSymbol, options: .repeating)

                        Text("Infinite Stories")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.purple, Color.orange],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )

                        Text(isSignUp ? "Create your magical account" : "Welcome back")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 40)

                    // Auth toggle
                    HStack(spacing: 0) {
                        Button(action: {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                isSignUp = false
                                clearForm()
                            }
                        }) {
                            Text("Sign In")
                                .font(.headline)
                                .foregroundColor(isSignUp ? .secondary : .white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background {
                                    if isSignUp {
                                        Color.clear
                                    } else {
                                        LinearGradient(
                                            colors: [Color.purple, Color.orange],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    }
                                }
                                .cornerRadius(15)
                        }

                        Button(action: {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                isSignUp = true
                                clearForm()
                            }
                        }) {
                            Text("Sign Up")
                                .font(.headline)
                                .foregroundColor(isSignUp ? .white : .secondary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background {
                                    if isSignUp {
                                        LinearGradient(
                                            colors: [Color.purple, Color.orange],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    } else {
                                        Color.clear
                                    }
                                }
                                .cornerRadius(15)
                        }
                    }
                    .padding(4)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(Color.gray.opacity(0.1))
                    )
                    .padding(.horizontal, 30)

                    // Form fields
                    VStack(spacing: 20) {
                        if isSignUp {
                            MagicalTextField(
                                icon: "person.fill",
                                placeholder: "Full Name",
                                text: $name,
                                isSecure: false,
                                keyboardType: .default
                            )
                            .focused($focusedField, equals: .name)
                            .submitLabel(.next)
                            .onSubmit {
                                focusedField = .email
                            }
                        }

                        MagicalTextField(
                            icon: "envelope.fill",
                            placeholder: "Email",
                            text: $email,
                            isSecure: false,
                            keyboardType: .emailAddress
                        )
                        .focused($focusedField, equals: .email)
                        .textInputAutocapitalization(.never)
                        .submitLabel(.next)
                        .onSubmit {
                            focusedField = .password
                        }

                        MagicalTextField(
                            icon: "lock.fill",
                            placeholder: "Password",
                            text: $password,
                            isSecure: true,
                            keyboardType: .default
                        )
                        .focused($focusedField, equals: .password)
                        .submitLabel(isSignUp ? .next : .done)
                        .onSubmit {
                            if isSignUp {
                                focusedField = .confirmPassword
                            } else {
                                handleAuthentication()
                            }
                        }

                        if isSignUp {
                            MagicalTextField(
                                icon: "lock.rotation",
                                placeholder: "Confirm Password",
                                text: $confirmPassword,
                                isSecure: true,
                                keyboardType: .default
                            )
                            .focused($focusedField, equals: .confirmPassword)
                            .submitLabel(.done)
                            .onSubmit {
                                handleAuthentication()
                            }
                        }
                    }
                    .padding(.horizontal, 30)

                    // Action buttons
                    VStack(spacing: 15) {
                        // Main auth button
                        Button(action: handleAuthentication) {
                            if viewModel.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .frame(height: 22)
                            } else {
                                HStack {
                                    Text(isSignUp ? "Create Account" : "Sign In")
                                        .font(.headline)
                                    Image(systemName: "arrow.right.circle.fill")
                                }
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: [Color.purple, Color.orange],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(25)
                        .shadow(color: Color.purple.opacity(0.3), radius: 10, x: 0, y: 5)
                        .disabled(viewModel.isLoading || !isFormValid)
                        .opacity(isFormValid ? 1.0 : 0.6)
                        .padding(.horizontal, 30)

                        // Test buttons (development only)
                        #if DEBUG
                        HStack(spacing: 12) {
                            // Login with test user
                            Button(action: loginWithTestUser) {
                                HStack {
                                    Image(systemName: "person.fill.checkmark")
                                    Text("Login Test User")
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                }
                                .foregroundColor(.blue)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .padding(.horizontal, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 20)
                                        .fill(Color.blue.opacity(0.1))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 20)
                                                .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                                        )
                                )
                            }
                            .disabled(viewModel.isLoading)

                            // Create new test account
                            Button(action: createTestAccount) {
                                HStack {
                                    Image(systemName: "hammer.fill")
                                    Text("Create Test")
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                }
                                .foregroundColor(.orange)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .padding(.horizontal, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 20)
                                        .fill(Color.orange.opacity(0.1))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 20)
                                                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
                                        )
                                )
                            }
                            .disabled(viewModel.isLoading)
                        }
                        .padding(.horizontal, 30)
                        #endif
                    }
                    .padding(.top, 10)

                    Spacer(minLength: 50)
                }
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .onAppear {
            animateGradient = true
            // Default to sign-up for new users, sign-in for returning users
            isSignUp = !authState.hasEverAuthenticated
        }
        .alert("Authentication Error", isPresented: $showError) {
            Button("OK", role: .cancel) {
                errorMessage = ""
            }
        } message: {
            Text(errorMessage)
        }
    }

    private var isFormValid: Bool {
        if isSignUp {
            return !email.isEmpty &&
                   !password.isEmpty &&
                   !name.isEmpty &&
                   password == confirmPassword &&
                   password.count >= 8 &&
                   email.contains("@")
        } else {
            return !email.isEmpty && !password.isEmpty &&
                   email.contains("@")
        }
    }

    private func clearForm() {
        email = ""
        password = ""
        confirmPassword = ""
        name = ""
        errorMessage = ""
        focusedField = nil
    }

    private func handleAuthentication() {
        guard isFormValid else { return }

        // Hide keyboard
        focusedField = nil

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()

        Task {
            do {
                if isSignUp {
                    let (token, userId) = try await viewModel.signUp(email: email, password: password, name: name)
                    await MainActor.run {
                        authState.signIn(token: token, userId: userId)

                        // Success haptic
                        let successFeedback = UINotificationFeedbackGenerator()
                        successFeedback.notificationOccurred(.success)
                    }
                } else {
                    let (token, userId) = try await viewModel.signIn(email: email, password: password)
                    await MainActor.run {
                        authState.signIn(token: token, userId: userId)

                        // Success haptic
                        let successFeedback = UINotificationFeedbackGenerator()
                        successFeedback.notificationOccurred(.success)
                    }
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true

                    // Error haptic
                    let errorFeedback = UINotificationFeedbackGenerator()
                    errorFeedback.notificationOccurred(.error)
                }
            }
        }
    }

    private func loginWithTestUser() {
        // Auto-fill test credentials for login
        email = "test@example.com"
        password = "testpass123"
        isSignUp = false

        // Clear other fields
        confirmPassword = ""
        name = ""
        errorMessage = ""

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()

        // Wait a moment for UI to update, then authenticate
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            handleAuthentication()
        }
    }

    private func createTestAccount() {
        // Auto-fill test credentials for sign up (same as login test user)
        email = "test@example.com"
        password = "testpass123"
        confirmPassword = "testpass123"
        name = "Test User"
        isSignUp = true

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()

        // Wait a moment for UI to update, then authenticate
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            handleAuthentication()
        }
    }
}

// MARK: - View Model
@MainActor
class AuthenticationViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var isAuthenticated = false

    private let baseURL = AppConfiguration.backendBaseURL

    func signIn(email: String, password: String) async throws -> (String, String) {
        isLoading = true
        defer { isLoading = false }

        let url = URL(string: "\(baseURL)/api/auth/sign-in/email")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(baseURL, forHTTPHeaderField: "Origin")
        request.setValue("InfiniteStories/1.0", forHTTPHeaderField: "User-Agent")

        let body = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthenticationError.networkError
        }

        #if DEBUG
        print("Sign in response status: \(httpResponse.statusCode)")
        if let responseString = String(data: data, encoding: .utf8) {
            print("Sign in response body: \(responseString)")
        }
        #endif

        if httpResponse.statusCode == 200 {
            // Parse response - better-auth can return different structures
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                #if DEBUG
                print("Failed to parse JSON")
                #endif
                throw AuthenticationError.invalidResponse
            }

            #if DEBUG
            print("Parsed JSON keys: \(json.keys)")
            if let jsonData = try? JSONSerialization.data(withJSONObject: json, options: .prettyPrinted),
               let prettyJson = String(data: jsonData, encoding: .utf8) {
                print("Full JSON structure:\n\(prettyJson)")
            }
            #endif

            // Try different response structures
            var token: String?
            var userId: String?

            // Structure 1: { user: {...}, session: {...} }
            if let session = json["session"] as? [String: Any] {
                #if DEBUG
                print("Found session object, keys: \(session.keys)")
                #endif
                token = session["token"] as? String ?? session["sessionToken"] as? String ?? session["id"] as? String
            }

            // Structure 2: Token might be at root level
            if token == nil {
                token = json["token"] as? String ?? json["sessionToken"] as? String ?? json["accessToken"] as? String
                #if DEBUG
                if token != nil {
                    print("Found token at root level")
                }
                #endif
            }

            // Structure 3: Check for data wrapper { data: { user, session } }
            if token == nil, let data = json["data"] as? [String: Any] {
                #if DEBUG
                print("Found data wrapper, keys: \(data.keys)")
                #endif
                if let session = data["session"] as? [String: Any] {
                    token = session["token"] as? String ?? session["sessionToken"] as? String ?? session["id"] as? String
                }
                token = token ?? data["token"] as? String
            }

            guard let token = token else {
                #if DEBUG
                print("❌ No token found in any expected location")
                #endif
                throw AuthenticationError.invalidResponse
            }

            // Get user ID - try different structures
            if let user = json["user"] as? [String: Any] {
                userId = user["id"] as? String
            } else if let data = json["data"] as? [String: Any],
                      let user = data["user"] as? [String: Any] {
                userId = user["id"] as? String
            } else {
                userId = json["userId"] as? String ?? json["id"] as? String
            }

            guard let userId = userId else {
                #if DEBUG
                print("❌ No user ID found in response")
                #endif
                throw AuthenticationError.invalidResponse
            }

            #if DEBUG
            print("✅ Sign in successful! User ID: \(userId), Token: \(token.prefix(10))...")
            #endif

            isAuthenticated = true
            return (token, userId)
        } else {
            #if DEBUG
            print("❌ Sign in failed with status \(httpResponse.statusCode)")
            #endif
            throw AuthenticationError.invalidCredentials
        }
    }

    func signUp(email: String, password: String, name: String) async throws -> (String, String) {
        isLoading = true
        defer { isLoading = false }

        let url = URL(string: "\(baseURL)/api/auth/sign-up/email")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(baseURL, forHTTPHeaderField: "Origin")
        request.setValue("InfiniteStories/1.0", forHTTPHeaderField: "User-Agent")

        let body = ["email": email, "password": password, "name": name]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthenticationError.networkError
        }

        #if DEBUG
        print("Sign up request to: \(url)")
        print("Sign up response status: \(httpResponse.statusCode)")
        if let responseString = String(data: data, encoding: .utf8) {
            print("Sign up response body: \(responseString)")
        }
        #endif

        if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
            // Parse response - better-auth can return different structures
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                #if DEBUG
                print("Failed to parse JSON")
                #endif
                throw AuthenticationError.invalidResponse
            }

            #if DEBUG
            print("Parsed JSON keys: \(json.keys)")
            if let jsonData = try? JSONSerialization.data(withJSONObject: json, options: .prettyPrinted),
               let prettyJson = String(data: jsonData, encoding: .utf8) {
                print("Full JSON structure:\n\(prettyJson)")
            }
            #endif

            // Try different response structures
            var token: String?
            var userId: String?

            // Structure 1: { user: {...}, session: {...} }
            if let session = json["session"] as? [String: Any] {
                #if DEBUG
                print("Found session object, keys: \(session.keys)")
                #endif
                token = session["token"] as? String ?? session["sessionToken"] as? String ?? session["id"] as? String
            }

            // Structure 2: Token might be at root level
            if token == nil {
                token = json["token"] as? String ?? json["sessionToken"] as? String ?? json["accessToken"] as? String
                #if DEBUG
                if token != nil {
                    print("Found token at root level")
                }
                #endif
            }

            // Structure 3: Check for data wrapper { data: { user, session } }
            if token == nil, let data = json["data"] as? [String: Any] {
                #if DEBUG
                print("Found data wrapper, keys: \(data.keys)")
                #endif
                if let session = data["session"] as? [String: Any] {
                    token = session["token"] as? String ?? session["sessionToken"] as? String ?? session["id"] as? String
                }
                token = token ?? data["token"] as? String
            }

            guard let token = token else {
                #if DEBUG
                print("❌ No token found in any expected location")
                #endif
                throw AuthenticationError.invalidResponse
            }

            // Get user ID - try different structures
            if let user = json["user"] as? [String: Any] {
                userId = user["id"] as? String
            } else if let data = json["data"] as? [String: Any],
                      let user = data["user"] as? [String: Any] {
                userId = user["id"] as? String
            } else {
                userId = json["userId"] as? String ?? json["id"] as? String
            }

            guard let userId = userId else {
                #if DEBUG
                print("❌ No user ID found in response")
                #endif
                throw AuthenticationError.invalidResponse
            }

            #if DEBUG
            print("✅ Sign up successful! User ID: \(userId), Token: \(token.prefix(10))...")
            #endif

            isAuthenticated = true
            return (token, userId)
        } else if httpResponse.statusCode == 409 {
            #if DEBUG
            print("⚠️ User already exists")
            #endif
            throw AuthenticationError.userAlreadyExists
        } else {
            #if DEBUG
            print("❌ Sign up failed with status \(httpResponse.statusCode)")
            #endif
            throw AuthenticationError.signUpFailed
        }
    }
}

enum AuthenticationError: LocalizedError {
    case invalidCredentials
    case networkError
    case userAlreadyExists
    case signUpFailed
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .invalidCredentials:
            return "Invalid email or password"
        case .networkError:
            return "Network error. Please check your connection."
        case .userAlreadyExists:
            return "An account with this email already exists. Try logging in instead."
        case .signUpFailed:
            return "Failed to create account. Please try again."
        case .invalidResponse:
            return "Server response error. Please check console logs."
        }
    }
}

#Preview {
    AuthenticationView()
}