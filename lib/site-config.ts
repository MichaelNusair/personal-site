import type { Metadata } from 'next';
import type { SiteProfileId } from './site-profile';
import { getSiteProfile } from './site-profile';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getPublicSiteUrl(): string {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://michaelnusair.tech',
  );
}

export function getChatApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_CHAT_API_BASE || 'https://chatapi.michaelnusair.tech/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

export interface SiteBranding {
  profile: SiteProfileId;
  title: string;
  titleTemplate: string;
  description: string;
  metadataBase: URL;
  openGraph: Metadata['openGraph'];
  twitter: Metadata['twitter'];
  /** Short disclaimer shown above chat before start */
  chatDisclaimerShort: string;
  /** Floating action button label */
  askAiLabel: string;
  /** GetVL funnel (optional overrides) */
  getvlStartIdeaUrl: string;
  getvlUploadRfqUrl: string;
}

export function getSiteConfig(profile?: SiteProfileId): SiteBranding {
  const p = profile ?? getSiteProfile();
  const base = getPublicSiteUrl();

  if (p === 'strike_labs') {
    return {
      profile: 'strike_labs',
      title: 'Strike Labs — Software & social agency',
      titleTemplate: '%s | Strike Labs',
      description:
        'Strike Labs ships web products, integrations, and AI-assisted workflows for teams that need velocity with judgment. Talk to our AI assistant or start a structured plan on GetVL.',
      metadataBase: new URL(`${base}/`),
      openGraph: {
        title: 'Strike Labs — Software & social agency',
        description:
          'Product engineering, technical leadership, and practical AI—scoped builds and clear outcomes.',
        url: `${base}/`,
        siteName: 'Strike Labs',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        site: '@NusairMichael',
        creator: '@NusairMichael',
      },
      chatDisclaimerShort:
        'AI may be inaccurate. Conversations are recorded so the Strike Labs team can review and send corrections.',
      askAiLabel: 'Ask Strike Labs AI',
      getvlStartIdeaUrl:
        process.env.NEXT_PUBLIC_GETVL_START_IDEA_URL ||
        'https://strike.getvl.shop/start/idea',
      getvlUploadRfqUrl:
        process.env.NEXT_PUBLIC_GETVL_UPLOAD_RFQ_URL ||
        'https://strike.getvl.shop/start/upload',
    };
  }

  return {
    profile: 'personal',
    title: 'Michael Nusair - Software Engineer',
    titleTemplate: '%s | Michael Nusair',
    description:
      'Full-stack engineer specializing in TypeScript, cloud-native architectures, and shipping products from 0 to scale.',
    metadataBase: new URL(`${base}/`),
    openGraph: {
      title: 'Michael Nusair - Software Engineer',
      description:
        'Full-stack engineer specializing in TypeScript, cloud-native architectures, and shipping products from 0 to scale.',
      url: `${base}/`,
      siteName: 'Michael Nusair',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      site: '@NusairMichael',
      creator: '@NusairMichael',
    },
    chatDisclaimerShort:
      'AI may be inaccurate. Conversations are recorded so Michael can review and send corrections.',
    askAiLabel: 'Ask my AI personal manager about me',
    getvlStartIdeaUrl:
      process.env.NEXT_PUBLIC_GETVL_START_IDEA_URL || 'https://strike.getvl.shop/start/idea',
    getvlUploadRfqUrl:
      process.env.NEXT_PUBLIC_GETVL_UPLOAD_RFQ_URL || 'https://strike.getvl.shop/start/upload',
  };
}
