import NextAuth from "next-auth";
import { authOptions } from "@/lib/nextauthOptions";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


