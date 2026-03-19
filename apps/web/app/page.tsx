import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">Internal Tools</h1>
        <p className="text-muted-foreground mb-8">michaelnusair.tech</p>
        <div className="space-y-3">
          <Link
            href="/f"
            className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <p className="font-medium">Transcription</p>
            <p className="text-sm text-muted-foreground">Upload and transcribe audio/video files</p>
          </Link>
          <Link
            href="/realtime"
            className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <p className="font-medium">Realtime Playground</p>
            <p className="text-sm text-muted-foreground">Voice AI demo with Azure OpenAI</p>
          </Link>
          <Link
            href="/fun"
            className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <p className="font-medium">Fun Stuff</p>
            <p className="text-sm text-muted-foreground">Easter eggs and experiments</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
