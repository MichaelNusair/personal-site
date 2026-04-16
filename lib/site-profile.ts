/**
 * White-label site profiles: one codebase, multiple branded deployments.
 * Set NEXT_PUBLIC_SITE_PROFILE at build time (see Dockerfile ARG / CI).
 */

export type SiteProfileId = 'personal' | 'strike_labs';

export function normalizeSiteProfile(raw: string | undefined | null): SiteProfileId {
  if (raw === 'strike_labs') return 'strike_labs';
  return 'personal';
}

/** Build-time profile (inlined from NEXT_PUBLIC_SITE_PROFILE). */
export function getSiteProfile(): SiteProfileId {
  return normalizeSiteProfile(process.env.NEXT_PUBLIC_SITE_PROFILE);
}

export function getChatPersonaForProfile(profile: SiteProfileId): 'personal' | 'strike_labs' {
  return profile === 'strike_labs' ? 'strike_labs' : 'personal';
}
