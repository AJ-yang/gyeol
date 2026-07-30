import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  // og:image는 절대 URL이어야 카카오톡·인스타 크롤러가 읽는다.
  // 없으면 localhost로 박혀 공유 미리보기가 통째로 깨진다.
  metadataBase: new URL(process.env.PAGES_SITE_URL ?? 'http://localhost:3100'),
  title: 'Story Compass — 당신은 어떤 이야기의 주인공인가',
  description: '영화와 드라마 12번의 선택으로 알아보는 서사 정체성 유형',
  openGraph: {
    title: 'Story Compass — 당신은 어떤 이야기의 주인공인가',
    description: '영화와 드라마 12번의 선택으로 알아보는 서사 정체성 유형',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-neutral-950 text-white">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
