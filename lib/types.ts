/** 축 순서: 0=CE(세계), 1=AQ(답), 2=TS(동행), 3=WL(획득). 각 -2..+2 정수. */
export type Axes = [number, number, number, number]

export type Work = {
  id: number
  media: 'movie' | 'tv'
  title: string
  year: number
  poster: string
  axes: Axes
  labeledAt: string
}

export type Choice = { winner: number; loser: number }

export const ROUNDS = 12

/** 음수가 [0], 양수가 [1] 방향. */
export const AXIS_LETTERS: readonly (readonly [string, string])[] = [
  ['C', 'E'],
  ['A', 'Q'],
  ['T', 'S'],
  ['W', 'L'],
] as const

export const AXIS_LABELS = [
  { neg: '세계를 바꾼다', pos: '세계를 견딘다' },
  { neg: '답을 찾는다', pos: '질문 속에 산다' },
  { neg: '함께 간다', pos: '혼자 간다' },
  { neg: '이겨서 얻는다', pos: '잃으며 깨닫는다' },
] as const

/** 페이로드가 작품 인덱스를 1바이트로 담으므로 풀 크기 상한. */
export const MAX_POOL_SIZE = 256
