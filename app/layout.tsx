import './globals.css';
import Providers from './providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Michael Nusair - Software Engineer',
    template: '%s | Michael Nusair',
  },
  description:
    'Full-stack engineer specializing in TypeScript, cloud-native architectures, and shipping products from 0 to scale.',
  metadataBase: new URL('https://michaelnusair.tech'),
  openGraph: {
    title: 'Michael Nusair - Software Engineer',
    description:
      'Full-stack engineer specializing in TypeScript, cloud-native architectures, and shipping products from 0 to scale.',
    url: 'https://michaelnusair.tech',
    siteName: 'Michael Nusair',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    site: '@NusairMichael',
    creator: '@NusairMichael',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
