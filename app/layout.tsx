import './globals.css';
import type { Metadata } from 'next';
import { getSiteConfig } from '@/lib/site-config';

export async function generateMetadata(): Promise<Metadata> {
  const c = getSiteConfig();
  return {
    title: {
      default: c.title,
      template: c.titleTemplate,
    },
    description: c.description,
    metadataBase: c.metadataBase,
    openGraph: c.openGraph,
    twitter: c.twitter,
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
