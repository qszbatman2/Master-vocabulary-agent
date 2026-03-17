import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { Providers } from '@/components/Providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: '英语单词学习平台',
    template: '%s | 英语单词学习平台',
  },
  description:
    '收录雅思、托福、GRE、日常等10000+词汇，支持英译中/中译英练习，智能追踪学习进度，助你高效记忆单词。',
  keywords: [
    '背单词',
    '英语学习',
    '雅思词汇',
    '托福词汇',
    'GRE词汇',
    '单词记忆',
    '英语词汇',
  ],
  authors: [{ name: '英语单词学习平台' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        <Providers>
          {isDev && <Inspector />}
          {children}
        </Providers>
      </body>
    </html>
  );
}
