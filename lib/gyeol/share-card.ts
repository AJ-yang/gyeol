import { wrapText } from './wrap-text'
import type { CatalogEntry } from './types'

/**
 * 공유 카드 크기. 4:5 세로다.
 *
 * 카카오톡 대화방에서 세로 카드가 가장 크게 보이고 인스타그램 피드에도 그대로
 * 올라간다. OG 이미지(1200×630 가로)와는 용도가 다르므로 별개로 둔다.
 */
export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

const PADDING = 80
const CONTENT_WIDTH = CARD_WIDTH - PADDING * 2

/** 포스터 격자. 6열 2행이면 12편이 들어가고 세로 442px를 쓴다. */
const POSTER_COLUMNS = 6
const POSTER_ROWS = 2
const POSTER_GAP = 12
const POSTER_WIDTH = (CONTENT_WIDTH - POSTER_GAP * (POSTER_COLUMNS - 1)) / POSTER_COLUMNS
const POSTER_HEIGHT = POSTER_WIDTH * 1.5

export const MAX_POSTERS = POSTER_COLUMNS * POSTER_ROWS

/**
 * 앱과 같은 폰트 스택을 쓴다. 웹폰트가 없으므로 로딩을 기다릴 필요가 없다.
 * 스캐폴드 기본값인 Arial에는 한글 글리프가 없어 폴백으로 밀린다.
 */
const FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", Pretendard, "Segoe UI", "Malgun Gothic", system-ui, sans-serif'

export type ShareCardData = {
  gyeolName: string
  description: string
  /** 고른 작품. 앞에서부터 최대 MAX_POSTERS편만 그린다. */
  posters: HTMLImageElement[]
  siteUrl: string
}

/**
 * 브라우저에서 TMDB 이미지를 canvas에 그릴 수 있는 형태로 받는다.
 *
 * **`crossOrigin`을 반드시 켠다.** 안 켜면 canvas가 오염되어 `toBlob`이 보안
 * 오류로 실패한다. TMDB는 Origin 헤더가 붙은 요청에 `access-control-allow-origin: *`
 * 를 주므로 익명 CORS로 받을 수 있다.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`이미지를 못 받았다: ${src}`))
    image.src = src
  })
}

/**
 * 포스터 경로에서 카드용 이미지 주소를 만든다.
 *
 * **질의 문자열을 덧붙여 캐시를 우회한다.** 화면의 `<img>`는 `crossOrigin` 없이
 * 같은 주소를 받으므로 CORS 헤더가 없는 응답이 캐시에 남는다. canvas가 그
 * 캐시를 재사용하려 하면 실패해 카드에서 포스터만 통째로 빠진다.
 *
 * 화면 쪽에 `crossOrigin`을 붙이는 방법도 있지만, 이미 방문한 적 있는 사용자는
 * 오염된 캐시 때문에 **화면의 포스터까지 안 보이게 된다.** 실제로 그렇게
 * 만들었다가 되돌렸다. 공유를 누를 때만 한 번 더 받는 편이 안전하다.
 */
export function posterUrl(work: CatalogEntry): string {
  return `https://image.tmdb.org/t/p/w342/${work.p}?card=1`
}

/**
 * 공유 카드를 그린다.
 *
 * 세로 배치를 위에서부터 쌓아 내려간다. 설명 줄 수가 결마다 달라 포스터의
 * 시작 높이가 유동적이므로, 하단(링크·고지)은 아래에서부터 역산해 고정한다.
 */
export function drawShareCard(context: CanvasRenderingContext2D, data: ShareCardData): void {
  context.fillStyle = '#0a0a0a'
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  context.textBaseline = 'top'

  let y = PADDING + 20

  // 머리말
  context.font = `34px ${FONT}`
  context.fillStyle = '#737373'
  context.fillText('당신이 자꾸 고르는 이야기', PADDING, y)
  y += 58

  // 결 이름
  context.font = `bold 76px ${FONT}`
  context.fillStyle = '#ffffff'
  context.fillText(data.gyeolName, PADDING, y)
  y += 110

  // 설명. 넘치면 아래가 밀리므로 줄 수를 제한한다.
  context.font = `36px ${FONT}`
  context.fillStyle = '#d4d4d4'
  const lines = wrapText(data.description, CONTENT_WIDTH, (t) => context.measureText(t).width)
  for (const line of lines.slice(0, 4)) {
    context.fillText(line, PADDING, y)
    y += 52
  }

  // 포스터 격자를 설명과 하단 고정 영역 사이의 한가운데에 둔다.
  //
  // 아래에서만 역산하면 설명이 짧을 때 위쪽에 큰 구멍이 생긴다. 반대로 위에서만
  // 쌓으면 설명이 길 때 링크를 덮는다. 남는 공간을 위아래로 나눠 가지면 설명이
  // 세 줄이든 네 줄이든 균형이 잡힌다.
  const gridHeight = POSTER_HEIGHT * POSTER_ROWS + POSTER_GAP
  const spaceTop = y + 40
  const spaceBottom = CARD_HEIGHT - PADDING - 180
  const gridTop = Math.max(spaceTop, spaceTop + (spaceBottom - spaceTop - gridHeight) / 2)
  data.posters.slice(0, MAX_POSTERS).forEach((image, index) => {
    const column = index % POSTER_COLUMNS
    const row = Math.floor(index / POSTER_COLUMNS)
    const x = PADDING + column * (POSTER_WIDTH + POSTER_GAP)
    const top = gridTop + row * (POSTER_HEIGHT + POSTER_GAP)
    context.drawImage(image, x, top, POSTER_WIDTH, POSTER_HEIGHT)
  })

  // 링크. 이미지만 받은 사람이 돌아올 유일한 길이라 눈에 띄게 둔다.
  context.font = `bold 38px ${FONT}`
  context.fillStyle = '#ffffff'
  context.fillText(data.siteUrl, PADDING, CARD_HEIGHT - PADDING - 96)

  // TMDB 고지. 이미지가 사이트 밖으로 나가므로 여기 박혀 있어야 약관을 지킨다.
  context.font = `24px ${FONT}`
  context.fillStyle = '#525252'
  context.fillText(
    'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    PADDING,
    CARD_HEIGHT - PADDING - 40,
  )
}
