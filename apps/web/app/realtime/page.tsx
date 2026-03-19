/**
 * Realtime voice AI playground.
 *
 * TODO: Copy the full implementation from the GetVL repo:
 *   Sources:
 *     - apps/web/app/[locale]/(public)/realtime/page.tsx
 *     - apps/web/app/[locale]/(public)/realtime/realtime-playground.tsx
 *     - apps/web/app/[locale]/(public)/realtime/realtime-login.tsx
 *     - apps/web/lib/realtime/voice-manager.ts
 *     - apps/web/lib/realtime/tools.ts
 *     - apps/web/lib/realtime/mock-store.ts
 *     - apps/web/app/api/realtime/session/route.ts
 *
 * Adapt: remove tenant dependencies, simplify auth.
 */
export default function RealtimePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <p className="text-neutral-400">Realtime playground - migrated from GetVL /realtime</p>
    </div>
  );
}
