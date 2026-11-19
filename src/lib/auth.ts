import "server-only";
import { connection } from "next/server";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signInSchema } from "@/lib/validators/auth";
import type { Role } from "@/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // JWT sessions let the proxy read the role without a DB call. Credentials requires JWT.
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    // TODO: add Google or email magic-link sign-in if wanted.
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});

/** Returns the signed-in user, or null. Always call on the server. */
export async function getCurrentUser() {
  // Session reads are per-request; keep them out of the prerendered shell.
  await connection();
  const session = await auth();
  return session?.user ?? null;
}

/** Throws unless the signed-in user has the given role. Use in Server Actions and route handlers. */
export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user || (role === "ADMIN" && user.role !== "ADMIN")) {
    throw new Error("Forbidden");
  }
  return user;
}
