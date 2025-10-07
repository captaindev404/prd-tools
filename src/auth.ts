import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import AzureADProvider from "next-auth/providers/azure-ad";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { ulid } from "ulid";
import { Role } from "@prisma/client";

/**
 * NextAuth v5 Configuration for Gentil Feedback platform
 *
 * Supports multi-village identity management with:
 * - Azure AD provider for Club Med employees
 * - Keycloak provider for alternative SSO
 * - Credentials provider for development/testing
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  providers: [
    // Azure AD Provider for Club Med employees
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
      profile(profile: any) {
        return {
          id: profile.sub,
          email: profile.email || profile.preferred_username,
          displayName: profile.name,
          employeeId: profile.employee_id || profile.oid,
          image: profile.picture,
        };
      },
    }),

    // Keycloak Provider for alternative SSO
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      profile(profile: any) {
        return {
          id: profile.sub,
          email: profile.email,
          displayName: profile.name || profile.preferred_username,
          employeeId: profile.employee_id || profile.sub,
          image: profile.picture,
        };
      },
    }),

    // Credentials Provider for development/testing
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            id: "credentials",
            name: "Development Credentials",
            credentials: {
              email: { label: "Email", type: "email" },
              employeeId: { label: "Employee ID", type: "text" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.employeeId) {
                return null;
              }

              // In development, create or find user
              let user = await prisma.user.findUnique({
                where: { email: credentials.email as string },
              });

              if (!user) {
                user = await prisma.user.create({
                  data: {
                    id: `usr_${ulid()}`,
                    email: credentials.email as string,
                    employeeId: credentials.employeeId as string,
                    displayName: (credentials.email as string).split("@")[0],
                    role: Role.USER,
                    villageHistory: "[]",
                    consents: "[]",
                  },
                });
              }

              return {
                id: user.id,
                email: user.email,
                displayName: user.displayName ?? undefined,
                employeeId: user.employeeId,
                role: user.role,
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.employeeId = (user as any).employeeId;
        token.role = (user as any).role || Role.USER;
      }

      // On sign in or profile update, sync with database
      if (trigger === "signIn" || trigger === "update") {
        if (account && profile) {
          const email = (profile as any).email || (profile as any).preferred_username;
          const employeeId = (profile as any).employee_id || (profile as any).oid || (profile as any).sub;
          const displayName = (profile as any).name || (profile as any).preferred_username;

          if (email && employeeId) {
            // Upsert user in database
            const dbUser = await prisma.user.upsert({
              where: { email },
              update: {
                displayName,
                employeeId,
                updatedAt: new Date(),
              },
              create: {
                id: `usr_${ulid()}`,
                email,
                employeeId,
                displayName,
                role: Role.USER,
                villageHistory: "[]",
                consents: "[]",
              },
            });

            // Update token with database user info
            token.userId = dbUser.id;
            token.employeeId = dbUser.employeeId;
            token.role = dbUser.role;
            token.currentVillageId = dbUser.currentVillageId;
            token.consents = dbUser.consents;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId as string;
        (session.user as any).employeeId = token.employeeId as string;
        (session.user as any).role = token.role as Role;
        (session.user as any).currentVillageId = token.currentVillageId as string | undefined;
        (session.user as any).consents = token.consents as string | undefined;
      }

      return session;
    },

    async signIn({ user, account, profile }) {
      if (account?.provider !== "credentials") {
        const email = (profile as any)?.email || (profile as any)?.preferred_username;

        // Optional: Restrict to Club Med email domains
        // if (email && !email.endsWith("@clubmed.com")) {
        //   return false;
        // }
      }

      return true;
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (!user.email) return;

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser) return;

      // Log sign-in event
      await prisma.event.create({
        data: {
          type: "user.signed_in",
          userId: dbUser.id,
          payload: JSON.stringify({
            provider: account?.provider,
            isNewUser,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    },
  },

  debug: process.env.NODE_ENV === "development",
});

// Type augmentation for NextAuth
declare module "next-auth" {
  interface User {
    employeeId?: string;
    displayName?: string;
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      displayName?: string | null;
      employeeId: string;
      role: Role;
      currentVillageId?: string | null;
      consents?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    employeeId?: string;
    role?: Role;
    currentVillageId?: string | null;
    consents?: string;
  }
}
