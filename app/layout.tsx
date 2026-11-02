import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nalar — AI Notebook Pribadi',
  description: 'Upload dokumenmu, tanya-jawab dengan AI berbasis sumber dengan sitasi akurat.',
  icons: {
    icon: '/logo-icon.png',
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {children}
      </body>
    </html>
  );
}

