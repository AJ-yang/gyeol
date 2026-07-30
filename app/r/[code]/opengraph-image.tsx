import { ImageResponse } from 'next/og'
import { STORY_TYPES } from '@/data/story-types'

export const alt = 'Story Compass 결과'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const type = STORY_TYPES[code]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: 150, letterSpacing: '-0.04em', lineHeight: 1 }}>{code}</div>
        <div style={{ fontSize: 58, marginTop: 24 }}>{type?.name ?? '서사 정체성 유형'}</div>
        <div style={{ fontSize: 28, color: '#a3a3a3', marginTop: 40 }}>Story Compass</div>
      </div>
    ),
    size,
  )
}
