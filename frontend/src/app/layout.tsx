import './globals.css'
import type { Metadata } from 'next'
import { BrowserExtensionHandler } from '@/components/BrowserExtensionHandler'

export const metadata: Metadata = {
  title: '情绪管理系统 - 智能心理健康咨询平台',
  description: '基于AI的智能心理健康咨询平台，提供情绪评估、咨询师匹配、风险评估等服务',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <BrowserExtensionHandler />
        {children}
      </body>
    </html>
  )
}
