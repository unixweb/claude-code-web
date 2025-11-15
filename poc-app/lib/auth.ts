import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// For POC: hardcoded users (in production, use database)
const users = [
  {
    id: "1",
    username: "admin",
    password: "$2a$10$X5Z9Z5Z5Z5Z5Z5Z5Z5Z5ZeK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5", // "admin123"
    role: "admin",
  },
];

// Pre-hash the password for POC
const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Helper to create admin user hash
// Password: "admin123"
const ADMIN_PASSWORD_HASH = "$2a$10$7qZ5VqW5qZ5qZ5qZ5qZ5qeKXJXJXJXJXJXJXJXJXJXJXJXJXJXJXJ";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // For POC: simple check
        if (
          credentials.username === "admin" &&
          credentials.password === "admin123"
        ) {
          return {
            id: "1",
            name: "admin",
            email: "admin@example.com",
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
});
