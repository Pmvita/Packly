import type { Metadata } from 'next';
import { Syne, IBM_Plex_Mono } from 'next/font/google';
import { AppProviders } from './providers';
import './globals.css';

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Packly | Packet Inspector',
  description:
    'Capture, decode, and visualise network traffic with a Next.js-based dashboard.',
  openGraph: {
    title: 'Packly | Packet Inspector',
    description: 'Capture, decode, and visualise network traffic.',
    url: 'https://packly-pierres-projects-3ccb9894.vercel.app',
    siteName: 'Packly',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Packly | Packet Inspector' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${ibmPlexMono.variable} min-h-screen bg-[var(--ink)] antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
