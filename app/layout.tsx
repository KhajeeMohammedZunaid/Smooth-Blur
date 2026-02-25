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
  description: 'Create and tweak progressive blur effects and box shadows. Export as HTML/CSS or Tailwind code.',
  openGraph: {
    title: 'Smooth Blur Generator',
    description: 'Create and tweak progressive blur effects and box shadows. Export as HTML/CSS or Tailwind code.',
    type: 'website',
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
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
