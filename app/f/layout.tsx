import Providers from '../providers';

export default function TranscriptionLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
