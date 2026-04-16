import { AgencyLanding } from '@/components/agency/AgencyLanding';
import { Resume } from '@/components/Resume';
import AskAiButton from '@/components/AskAiButton';
import { getSiteProfile } from '@/lib/site-profile';

export default function HomePage() {
  const profile = getSiteProfile();
  return (
    <>
      {profile === 'strike_labs' ? <AgencyLanding /> : <Resume />}
      <AskAiButton />
    </>
  );
}
