import React from 'react';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Oblivion Damage Calculator',
  description:
    'Calculate exact weapon, hand-to-hand, and spell damage in The Elder Scrolls IV: Oblivion using the complete UESP damage formula. Factor in skills, attributes, fatigue, armor rating, sneak attacks, power attacks, and more.',
  openGraph: {
    title: 'Oblivion Damage Calculator',
    description:
      'Calculate exact weapon, hand-to-hand, and spell damage in The Elder Scrolls IV: Oblivion using the complete UESP damage formula. Factor in skills, attributes, fatigue, armor rating, sneak attacks, power attacks, and more.',
    url: 'https://damage.oblivion.tools',
    siteName: 'Oblivion Damage Calculator',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oblivion Damage Calculator',
    description:
      'Calculate exact weapon, hand-to-hand, and spell damage in The Elder Scrolls IV: Oblivion using the complete UESP damage formula. Factor in skills, attributes, fatigue, armor rating, sneak attacks, power attacks, and more.',
  },
  alternates: {
    canonical: 'https://damage.oblivion.tools',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1e1e1e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body id="root" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
