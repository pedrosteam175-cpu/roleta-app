import type { Metadata } from 'next';
import Script from "next/script";
import { Outfit, JetBrains_Mono } from 'next/font/google';
import { HappySeedsWatermark } from '@/components/HappySeedsWatermark';
import './globals.css';
import jsonMetadata from '../../metadata.json';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = jsonMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>

      <body>
        {children}
        <HappySeedsWatermark />
      </body>
    </html>
  );
}
