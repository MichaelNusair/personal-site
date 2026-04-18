import Link from 'next/link';
import { ArrowRight, Lightbulb, Rocket, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSiteConfig } from '@/lib/site-config';

export function AgencyLanding() {
  const { getvlStartIdeaUrl, getvlUploadRfqUrl } = getSiteConfig('strike_labs');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto my-8 bg-white shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5 min-h-[80vh] px-4 sm:px-6 md:px-8 py-8">
        <div className="bg-gradient-to-r from-slate-800 to-slate-600 text-white px-4 sm:px-6 md:px-8 py-8 rounded-xl mb-8">
          <div className="flex flex-col items-center text-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Strike Labs
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Software &amp; social agency
            </h1>
            <p className="text-base sm:text-lg text-white/90 max-w-2xl">
              We ship web products, integrations, and AI-assisted workflows—clear scope, fast
              iteration, and outcomes you can measure.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <aside className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Focus
              </h2>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <Rocket className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                  MVPs &amp; greenfield builds
                </li>
                <li className="flex gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                  AI features &amp; automation
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                  Rescue &amp; technical leadership
                </li>
              </ul>
            </section>
            <section className="rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
              <p>
                Visit{' '}
                <a href="https://strikelabs.tech" className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-600">
                  strikelabs.tech
                </a>
                {' '}for our full agency site, AI chat, and lead intake.
              </p>
            </section>
          </aside>

          <div className="lg:col-span-2 space-y-8 order-1 lg:order-2">
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                How we help
              </h2>
              <p className="text-slate-800 leading-relaxed">
                Strike Labs pairs product thinking with full-stack delivery. We clarify goals,
                constraints, and success metrics, then ship in thin vertical slices—so you see
                working software early, not a slide deck six months later.
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                Get a structured plan (GetVL)
              </h2>
              <p className="text-slate-600 text-sm mb-4">
                Our tenant on GetVL turns ideas and RFQs into actionable product plans—instantly
                useful for scoping and next steps.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="gap-2">
                  <Link href={getvlStartIdeaUrl}>
                    Start with an idea
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href={getvlUploadRfqUrl}>
                    <Upload className="h-4 w-4" />
                    Upload RFQ
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
