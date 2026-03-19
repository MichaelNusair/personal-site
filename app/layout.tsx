import './globals.css';

export const metadata = {
  title: 'Internal Tools',
  description: 'Michael Nusair internal tools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
