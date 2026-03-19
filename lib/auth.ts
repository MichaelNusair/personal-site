import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const ALLOWED_EMAILS = [
  'mnpcmw6444@gmail.com',
  'efrat.wolde@gmail.com',
];

export const REALTIME_ALLOWED_EMAILS = [
  'mnpcmw6444@gmail.com',
  'flighter98311@gmail.com',
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

let _authOptions: NextAuthOptions | null = null;

export function getAuthOptions(): NextAuthOptions {
  if (_authOptions) return _authOptions;
  _authOptions = {
    secret: requireEnv('NEXTAUTH_SECRET'),
    providers: [
      GoogleProvider({
        clientId: requireEnv('GOOGLE_CLIENT_ID'),
        clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
      }),
    ],
    session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
    callbacks: {
      async signIn({ user }) {
        const email = user?.email?.toLowerCase();
        if (!email) return false;
        if (ALLOWED_EMAILS.includes(email)) return true;
        if (REALTIME_ALLOWED_EMAILS.includes(email)) return true;
        return false;
      },
      jwt({ token, user }) {
        if (user?.email) {
          token.email = user.email;
        }
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          session.user.email = (token.email as string) ?? session.user.email;
        }
        return session;
      },
    },
  };
  return _authOptions;
}

export const authOptions: NextAuthOptions = new Proxy({} as NextAuthOptions, {
  get(_, prop) {
    return getAuthOptions()[prop as keyof NextAuthOptions];
  },
});
