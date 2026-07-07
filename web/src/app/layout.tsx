import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarketPulse — 财经情绪日报',
  description: 'AI 驱动的市场情绪雷达，每日自动抓取财经新闻并分析情绪',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
