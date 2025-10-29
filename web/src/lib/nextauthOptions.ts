import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  debug: true,
  pages: {
    signIn: "/login",
    error: "/login?error=OAuthSignIn",
  },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "google") return true;
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      console.log("[nextauth] signIn", { userId: (message.user as any)?.id, provider: message.account?.provider });
    },
    async createUser(message) {
      console.log("[nextauth] createUser", { userId: (message.user as any)?.id, email: message.user?.email });
    },
    async linkAccount(message) {
      console.log("[nextauth] linkAccount", { userId: message.user?.id, provider: message.account?.provider });
    },
    async session(message) {
      console.log("[nextauth] session", { sessionUser: message.session?.user });
    },
    async error(message) {
      console.error("[nextauth] error", message);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};


