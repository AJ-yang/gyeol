import { describe, expect, it } from 'vitest'
import { compatibleCode, oppositeCode, score } from './scoring'
import type { Axes, Work } from './types'

function work(id: number, axes: Axes): Work {
  return { id, media: 'movie', title: `W${id}`, year: 2000, poster: '/p.jpg', axes, labeledAt: '2026-07-30' }
}

describe('score', () => {
  it('음수 방향으로 몰린 선택은 첫 글자 코드를 낸다', () => {
    const pool = [work(1, [-2, -2, -2, -2]), work(2, [2, 2, 2, 2])]
    const result = score(pool, [{ winner: 0, loser: 1 }])
    expect(result.code).toBe('CATW')
    expect(result.norm).toEqual([-1, -1, -1, -1])
  })

  it('양수 방향으로 몰린 선택은 두 번째 글자 코드를 낸다', () => {
    const pool = [work(1, [-2, -2, -2, -2]), work(2, [2, 2, 2, 2])]
    const result = score(pool, [{ winner: 1, loser: 0 }])
    expect(result.code).toBe('EQSL')
    expect(result.norm).toEqual([1, 1, 1, 1])
  })

  it('선택이 없으면 모든 축이 0이고 두 번째 글자로 결정된다', () => {
    const pool = [work(1, [0, 0, 0, 0])]
    const result = score(pool, [])
    expect(result.norm).toEqual([0, 0, 0, 0])
    expect(result.code).toBe('EQSL')
  })

  it('상반된 두 선택은 서로를 상쇄해 0에 수렴한다', () => {
    const pool = [work(1, [-2, 0, 0, 0]), work(2, [2, 0, 0, 0])]
    const result = score(pool, [
      { winner: 0, loser: 1 },
      { winner: 1, loser: 0 },
    ])
    expect(result.norm[0]).toBe(0)
  })

  it('축 점수 차가 큰 선택일수록 강한 신호로 잡힌다', () => {
    const pool = [work(1, [-2, 0, 0, 0]), work(2, [2, 0, 0, 0]), work(3, [-1, 0, 0, 0]), work(4, [1, 0, 0, 0])]
    const strong = score(pool, [{ winner: 0, loser: 1 }])
    const weak = score(pool, [
      { winner: 2, loser: 3 },
      { winner: 3, loser: 2 },
      { winner: 2, loser: 3 },
    ])
    expect(Math.abs(strong.norm[0])).toBeGreaterThan(Math.abs(weak.norm[0]))
  })
})

describe('oppositeCode / compatibleCode', () => {
  it('상극 유형은 네 글자가 모두 뒤집힌다', () => {
    expect(oppositeCode('CATW')).toBe('EQSL')
    expect(oppositeCode('EQSL')).toBe('CATW')
  })

  it('궁합 유형은 세 번째 글자만 유지된다', () => {
    expect(compatibleCode('CATW')).toBe('EQTL')
    expect(compatibleCode('EQSL')).toBe('CASW')
  })

  it('비정상 코드는 그럴듯한 오답 대신 예외를 낸다', () => {
    // 코드는 /r/[code] 경로에서 오는 사용자 입력이다. 검증이 없으면 소문자 URL이
    // 전부 첫 글자로 접혀 'catw' → 'CATW' 같은 조용한 오답이 나온다.
    expect(() => oppositeCode('catw')).toThrow(/invalid type code/)
    expect(() => oppositeCode('C-TW')).toThrow(/invalid type code/)
    expect(() => oppositeCode('CAT')).toThrow(/invalid type code/)
    expect(() => oppositeCode('')).toThrow(/invalid type code/)
    expect(() => compatibleCode('catw')).toThrow(/invalid type code/)
  })
})
