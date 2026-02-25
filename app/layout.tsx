import type { Metadata, Viewport } from 'next';
import { Inter_Tight } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SileoToaster } from '@/components/sileo-toaster';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E9EAEF' },
    { media: '(prefers-color-scheme: dark)', color: '#151618' },
  ],
};

export const metadata: Metadata = {
  title: 'Smooth Blur Generator',
  description: 'Create and tweak progressive blur effects for you images . Export as HTML/CSS or Tailwind code.',
  metadataBase: new URL('https://smooth-blur-seven.vercel.app'),
  openGraph: {
    title: 'Smooth Blur Generator',
    description: 'Create and tweak progressive blur effects for your images. Export as HTML/CSS or Tailwind code.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Smooth Blur Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smooth Blur Generator',
    description: 'Create and tweak progressive blur effects for your images. Export as HTML/CSS or Tailwind code.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={interTight.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <SileoToaster />
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-GQ9YRPJXRC" />
    </html>
  );
}
