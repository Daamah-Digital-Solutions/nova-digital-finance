import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL ||
            "http://localhost:8000/api/v1";

          const response = await fetch(`${apiUrl}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
              errorData?.detail || "Invalid email or password"
            );
          }

          const data = await response.json();

          return {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            clientId: data.user.clientId,
            accountNumber: data.user.accountNumber,
            isEmailVerified: data.user.isEmailVerified,
            mfaEnabled: data.user.mfaEnabled,
            authProvider: data.user.authProvider,
            kycStatus: data.user.kycStatus,
            accessToken: data.tokens.access,
            refreshToken: data.tokens.refresh,
          };
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("Authentication failed");
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = (user as Record<string, unknown>).firstName as string;
        token.lastName = (user as Record<string, unknown>).lastName as string;
        token.clientId = (user as Record<string, unknown>).clientId as string;
        token.accountNumber = (user as Record<string, unknown>).accountNumber as string;
        token.isEmailVerified = (user as Record<string, unknown>).isEmailVerified as boolean;
        token.mfaEnabled = (user as Record<string, unknown>).mfaEnabled as boolean;
        token.authProvider = (user as Record<string, unknown>).authProvider as string;
        token.kycStatus = (user as Record<string, unknown>).kycStatus as string;
        token.accessToken = (user as Record<string, unknown>).accessToken as string;
        token.refreshToken = (user as Record<string, unknown>).refreshToken as string;
      }

      // Handle OAuth providers
      if (account && account.provider !== "credentials") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.authProvider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.clientId = token.clientId as string;
        session.user.accountNumber = token.accountNumber as string;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
        session.user.mfaEnabled = token.mfaEnabled as boolean;
        session.user.authProvider = token.authProvider as string;
        session.user.kycStatus = token.kycStatus as string;
      }

      (session as Record<string, unknown>).accessToken = token.accessToken;
      (session as Record<string, unknown>).refreshToken = token.refreshToken;

      return session;
    },
  },
};
