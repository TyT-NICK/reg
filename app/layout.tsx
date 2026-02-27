import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Head from 'next/head';

import '@/styles/common.css';

const font = Montserrat({
  variable: '--font-main',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'Запись на заправку',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body className={`${font.variable}`}>{children}</body>
    </html>
  );
}
