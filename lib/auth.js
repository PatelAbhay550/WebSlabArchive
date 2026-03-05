import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { getDb, initDb } from "@/lib/db";
import { nanoid } from "nanoid";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        await initDb();
        const db = getDb();

        // Check if user exists
        const existing = await db.execute({
          sql: "SELECT id FROM users WHERE provider = ? AND provider_id = ?",
          args: [account.provider, account.providerAccountId],
        });

        if (existing.rows.length === 0) {
          // Create new user
          const id = nanoid(12);
          await db.execute({
            sql: `INSERT INTO users (id, name, email, image, provider, provider_id) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              user.name || "",
              user.email || "",
              user.image || "",
              account.provider,
              account.providerAccountId,
            ],
          });
          user.dbId = id;
        } else {
          user.dbId = existing.rows[0].id;
          // Update user info
          await db.execute({
            sql: "UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?",
            args: [
              user.name || "",
              user.email || "",
              user.image || "",
              existing.rows[0].id,
            ],
          });
        }
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return true; // Still allow sign in
      }
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // On initial sign in, look up the DB user id
        try {
          await initDb();
          const db = getDb();
          const result = await db.execute({
            sql: "SELECT id FROM users WHERE provider = ? AND provider_id = ?",
            args: [account.provider, account.providerAccountId],
          });
          if (result.rows.length > 0) {
            token.dbId = result.rows[0].id;
          }
        } catch {
          // fallback
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.dbId) {
        session.user.dbId = token.dbId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
