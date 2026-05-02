import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

type JwtWithId = JWT & { id?: string };
type SessionUserWithId = { id?: string };

/** Mixed OAuth providers — widen type so Facebook + Google both satisfy NextAuth's provider union. */
const providers: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
];

if (process.env.FACEBOOK_CLIENT_ID?.trim() && process.env.FACEBOOK_CLIENT_SECRET?.trim()) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  pages: {
    signIn: "/login",
    error: "/login?error=OAuthSignIn",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      const jwtToken = token as JwtWithId;
      if (user && "id" in user) jwtToken.id = String(user.id);
      return jwtToken;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as SessionUserWithId;
        sessionUser.id = (token as JwtWithId).id;
      }
      return session;
    },
  },
  events: process.env.NEXTAUTH_DEBUG === "true"
    ? {
        async signIn(message) {
          console.log("[nextauth] signIn", { userId: message.user?.id, provider: message.account?.provider });
        },
        async createUser(message) {
          console.log("[nextauth] createUser", { userId: message.user?.id, email: message.user?.email });
        },
        async linkAccount(message) {
          console.log("[nextauth] linkAccount", { userId: message.user?.id, provider: message.account?.provider });
        },
        async session(message) {
          console.log("[nextauth] session", { sessionUser: message.session?.user });
        },
      }
    : {},
  secret: process.env.NEXTAUTH_SECRET,
};
