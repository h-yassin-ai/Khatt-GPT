import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { PWARegister } from '@/components/PWARegister'
import { LanguageProvider } from '@/lib/language-context'
import { ToastProvider } from '@/hooks/use-toast'

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
  title: 'Khatt-GPT | Collaborative Arabic Manuscript Transcription',
  description: 'A platform connecting a community of contributors to transcribe segmented Maghrebi Arabic manuscripts into text, preserving history.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
};

import { cookies } from 'next/headers';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('waraka_lang')?.value || 'fr') as 'en' | 'fr' | 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <PWARegister />
        <LanguageProvider>
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
