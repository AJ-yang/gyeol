import { describe, expect, it } from 'vitest'
import { makeRng, seededShuffle } from './rng'

describe('makeRng', () => {
  it('같은 시드는 같은 수열을 낸다', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('다른 시드는 다른 수열을 낸다', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)())
  })

  it('0 이상 1 미만을 낸다', () => {
    const rng = makeRng(7)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('seededShuffle', () => {
  it('원본을 변형하지 않는다', () => {
    const input = [1, 2, 3, 4, 5]
    seededShuffle(input, makeRng(3))
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('같은 원소를 모두 보존한다', () => {
    const out = seededShuffle([1, 2, 3, 4, 5], makeRng(3))
    expect([...out].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5])
  })

  it('같은 시드는 같은 순서를 낸다', () => {
    expect(seededShuffle([1, 2, 3, 4, 5], makeRng(9))).toEqual(seededShuffle([1, 2, 3, 4, 5], makeRng(9)))
  })
})
