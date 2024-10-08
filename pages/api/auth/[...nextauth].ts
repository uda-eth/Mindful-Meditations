import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // If user doesn't exist, return null
        if (!user) {
          return null;
        }

        // Verify the password using bcrypt
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        // Return the user object for NextAuth session
        return { id: user.id, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: '/login',  // Adjust this route if your login page is located elsewhere
  },
  callbacks: {
    async session({ session, token }) {
      // Attach the user's ID to the session
      session.user.id = token.id;
      return session;
    },
    async jwt({ token, user }) {
      // Attach the user's ID to the token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in your .env file
});

