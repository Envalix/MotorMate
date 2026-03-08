import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;

        if (!user.isEmailVerified) {
          throw new Error('email_not_verified');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const googleId = account.providerAccountId;
        const email = user.email!;

        let existing = await prisma.user.findUnique({ where: { googleId } });
        if (!existing) {
          existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { googleId, avatarUrl: existing.avatarUrl ?? user.image },
            });
          } else {
            existing = await prisma.user.create({
              data: {
                email,
                name: user.name ?? email,
                googleId,
                avatarUrl: user.image,
                authProvider: 'GOOGLE',
                isEmailVerified: true,
              },
            });
          }
        }
        user.id = existing.id;
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  session: { strategy: 'jwt', maxAge: 60 * 60 }, // 1 hour
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
