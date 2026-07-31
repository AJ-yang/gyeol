// lib/gyeol/types.ts

/** 0 = 영화, 1 = TV. 색인 크기를 줄이려고 문자열 대신 숫자를 쓴다. */
export type Media = 0 | 1

/** movie/tv에서 TMDB 장르 id가 갈리므로 빌드 시점에 이 라벨로 통일한다. */
export const GENRE_LABELS = [
  '액션', '모험', '애니', '코미디', '범죄', '다큐', '드라마', '가족',
  '판타지', '역사', '공포', '음악', '미스터리', '로맨스', 'SF', '스릴러',
  '전쟁', '서부',
] as const

export type GenreLabel = (typeof GENRE_LABELS)[number]

/**
 * 브라우저로 내려가는 작품 한 건.
 *
 * 키를 한 글자로 줄인 이유는 색인이 통째로 다운로드되기 때문이다. 작품 하나가
 * 44바이트 안팎이어야 13,000편을 감당할 수 있다.
 *
 * `k`는 키워드 이름이 아니라 **조건 키워드 어휘의 인덱스**다. 결 조건에 등장하지
 * 않는 키워드(`sequel`, `aftercreditsstinger` 등)는 점수에 절대 들어가지 않으므로
 * 색인에도 담지 않는다.
 */
export type CatalogEntry = {
  /** TMDB id */
  i: number
  m: Media
  /** 제목 */
  t: string
  /** 연도. 미상이면 0 */
  y: number
  /** 포스터 경로. 앞 슬래시를 뗀 형태 */
  p: string
  /** GENRE_LABELS 인덱스 */
  g: number[]
  /** 조건 키워드 어휘 인덱스 */
  k: number[]
  /** 한국어 작품이면 1 */
  ko: 0 | 1
}

/** 브라우저가 받는 색인 전체. IDF를 같이 실어 클라이언트가 계산하지 않게 한다. */
export type Catalog = {
  /** 조건 키워드 어휘. CatalogEntry.k가 이 배열의 인덱스를 가리킨다 */
  vocabulary: string[]
  /** vocabulary와 같은 길이. 인덱스별 IDF 점수 */
  idf: number[]
  works: CatalogEntry[]
}

export type Gyeol = {
  /** 안정적인 식별자. 공유 링크나 통계에서 쓰므로 바꾸지 않는다 */
  id: string
  name: string
  description: string
  /** TMDB 키워드 이름. 실존하는 것만 쓴다 */
  keywords: string[]
  genres: GenreLabel[]
}

export type GyeolScore = { id: string; score: number }

/**
 * 작품을 가리키는 유일한 키.
 *
 * TMDB id는 매체별로 독립이라 id만으로는 작품이 특정되지 않는다. 실제
 * 카탈로그에서 177건이 겹치며, id 670은 영화 「올드보이」이자 TV
 * 「Baby Looney Tunes」다. 선택 상태·중복 판정·추천 조회가 전부 이 키를 쓴다.
 */
export function workKey(work: { i: number; m: Media }): string {
  return `${work.m}-${work.i}`
}
