import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, Amiri } from 'next/font/google';
import './globals.css';
import { PWARegister } from '@/components/PWARegister'
import { LanguageProvider } from '@/lib/language-context'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant-garamond',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
});

export const metadata: Metadata = {
  title: 'Khatt-GPT | Collaborative Arabic Manuscript Transcription',
  description: 'A platform connecting a community of contributors to transcribe segmented Maghrebi Arabic manuscripts into text, preserving history.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorantGaramond.variable} ${dmSans.variable} ${amiri.variable} font-sans antialiased`}
      >
        <PWARegister />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
