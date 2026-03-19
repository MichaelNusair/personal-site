import { getServerSession } from 'next-auth';
import { authOptions, REALTIME_ALLOWED_EMAILS } from '@/lib/auth';
import { RealtimePlayground } from './realtime-playground';
import { RealtimeLogin } from './realtime-login';

export const dynamic = 'force-dynamic';

export default async function RealtimePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return <RealtimeLogin />;
  }

  if (!REALTIME_ALLOWED_EMAILS.includes(email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-8">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-neutral-400 text-sm">
              Your account ({email}) does not have access to the TalkPilot playground.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <RealtimePlayground userEmail={email} />;
}
