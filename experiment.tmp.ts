/**
 * 현재 선택기 vs 적응형 변형들 비교 실험 (임시 파일, 커밋 대상 아님).
 *
 * 기준은 "유형 분포가 고른가"가 아니라 "진짜 성향을 맞히는가".
 * 축 성향이 정해진 가상 인물을 만들어 응답시키고 진짜 코드를 복원하는지 본다.
 * 모든 전략에 같은 인물·같은 시드·같은 변덕 난수를 주는 대응 비교다.
 */
import works from './data/works.json'
import { makeRng, seededShuffle } from './lib/rng'
import { AXIS_LETTERS, ROUNDS, type Axes, type Choice, type Work } from './lib/types'

const POOL = works as Work[]

type Strategy = 'current' | 'margin' | 'margin+rounds' | 'norm' | 'margin+finegap'
const STRATEGIES: Strategy[] = ['current', 'margin', 'margin+rounds', 'norm', 'margin+finegap']

type Pair = { left: number; right: number; axis: number }

function bestPair(available: number[], axis: number, minGap: number, maxGap = 99): [number, number] | null {
  let best: [number, number] | null = null
  let bestScore = -Infinity
  for (let i = 0; i < available.length; i++) {
    const x = POOL[available[i]].axes
    for (let j = i + 1; j < available.length; j++) {
      const y = POOL[available[j]].axes
      const gap = Math.abs(x[axis] - y[axis])
      if (gap < minGap || gap > maxGap) continue
      let confound = 0
      for (let a = 0; a < 4; a++) if (a !== axis) confound += Math.abs(x[a] - y[a])
      const value = 2 * gap - confound
      if (value > bestScore) {
        bestScore = value
        best = [available[i], available[j]]
      }
    }
  }
  return best
}

function nextPair(choices: Choice[], seed: number, strategy: Strategy): Pair {
  const used = new Set<number>()
  const info = [0, 0, 0, 0] // 측정량: |차이| 합. 답과 무관하다.
  const margin = [0, 0, 0, 0] // 표차: 부호 있는 합. 답에 따라 달라진다.
  const rounds = [0, 0, 0, 0]

  for (const choice of choices) {
    const w = POOL[choice.winner].axes
    const l = POOL[choice.loser].axes
    used.add(choice.winner)
    used.add(choice.loser)
    let target = 0
    for (let a = 0; a < 4; a++) {
      info[a] += Math.abs(w[a] - l[a])
      margin[a] += w[a] - l[a]
      if (Math.abs(w[a] - l[a]) > Math.abs(w[target] - l[target])) target = a
    }
    rounds[target]++
  }

  const key: (a: number) => number =
    strategy === 'current'
      ? (a) => info[a]
      : strategy === 'margin'
        ? (a) => Math.abs(margin[a])
        : strategy === 'norm'
          ? (a) => (info[a] === 0 ? -1 : Math.abs(margin[a]) / info[a])
          : (a) => Math.abs(margin[a]) * 4 + rounds[a]

  const axisOrder = seededShuffle([0, 1, 2, 3], makeRng(seed))
  const axesByPriority = [...axisOrder].sort((x, y) => key(x) - key(y))

  const rng = makeRng(seed + choices.length * 7919)
  const available = seededShuffle(
    POOL.map((_, i) => i).filter((i) => !used.has(i)),
    rng,
  )

  // finegap: 표차가 작은(부호가 애매한) 축은 gap 3짜리 미세한 쌍으로 경계를 파고든다.
  const ambiguous =
    strategy === 'margin+finegap' && choices.length >= 4 && Math.abs(margin[axesByPriority[0]]) <= 2

  const attempts: [number, number][] = ambiguous
    ? [
        [3, 3],
        [3, 99],
        [2, 99],
        [0, 99],
      ]
    : [
        [3, 99],
        [2, 99],
        [0, 99],
      ]

  for (const [minGap, maxGap] of attempts) {
    for (const axis of axesByPriority) {
      const best = bestPair(available, axis, minGap, maxGap)
      if (best) {
        const [x, y] = best
        return rng() < 0.5 ? { left: x, right: y, axis } : { left: y, right: x, axis }
      }
    }
  }
  throw new Error('no available pair')
}

function scoreCode(choices: Choice[]): { code: string; norm: Axes } {
  const theta = [0, 0, 0, 0]
  const denom = [0, 0, 0, 0]
  for (const c of choices) {
    const w = POOL[c.winner].axes
    const l = POOL[c.loser].axes
    for (let a = 0; a < 4; a++) {
      theta[a] += w[a] - l[a]
      denom[a] += Math.abs(w[a] - l[a])
    }
  }
  const norm = theta.map((t, a) => t / Math.max(denom[a], 1)) as Axes
  return { code: norm.map((n, a) => AXIS_LETTERS[a][n < 0 ? 0 : 1]).join(''), norm }
}

type Person = { theta: Axes; code: string }

function makePerson(rng: () => number): Person {
  const theta = Array.from({ length: 4 }, () => rng() * 2 - 1) as Axes
  return { theta, code: theta.map((t, a) => AXIS_LETTERS[a][t < 0 ? 0 : 1]).join('') }
}

const NOISE = 1.2 // 로지스틱 온도. 클수록 변덕스럽다.

function choose(person: Person, pair: Pair, rng: () => number): Choice {
  const utility = (i: number) => POOL[i].axes.reduce((s, v, a) => s + person.theta[a] * v, 0)
  const pLeft = 1 / (1 + Math.exp(-(utility(pair.left) - utility(pair.right)) / NOISE))
  return rng() < pLeft
    ? { winner: pair.left, loser: pair.right }
    : { winner: pair.right, loser: pair.left }
}

const N = 4000
type Acc = {
  exact: number
  axisHits: number
  axisTotal: number
  decisiveHits: number
  decisiveTotal: number
  codes: Map<string, number>
  conf: number[]
  flags: boolean[]
}
const results = Object.fromEntries(
  STRATEGIES.map((s) => [
    s,
    {
      exact: 0,
      axisHits: 0,
      axisTotal: 0,
      decisiveHits: 0,
      decisiveTotal: 0,
      codes: new Map<string, number>(),
      conf: [] as number[],
      flags: [] as boolean[],
    },
  ]),
) as Record<Strategy, Acc>

const personRng = makeRng(20260730)
for (let i = 0; i < N; i++) {
  const person = makePerson(personRng)
  const seed = 1000 + i
  for (const strategy of STRATEGIES) {
    const answerRng = makeRng(500000 + i)
    const choices: Choice[] = []
    for (let r = 0; r < ROUNDS; r++) choices.push(choose(person, nextPair(choices, seed, strategy), answerRng))
    const { code, norm } = scoreCode(choices)

    const r = results[strategy]
    const isExact = code === person.code
    r.flags.push(isExact)
    if (isExact) r.exact++
    for (let a = 0; a < 4; a++) {
      const hit = code[a] === person.code[a]
      r.axisTotal++
      if (hit) r.axisHits++
      if (Math.abs(person.theta[a]) > 0.3) {
        r.decisiveTotal++
        if (hit) r.decisiveHits++
      }
    }
    r.codes.set(code, (r.codes.get(code) ?? 0) + 1)
    r.conf.push(...norm.map(Math.abs))
  }
}

const pct = (n: number, d: number) => ((n / d) * 100).toFixed(1) + '%'
console.log(`가상 인물 ${N}명 · 노이즈 ${NOISE} · 모든 전략에 동일 조건\n`)
console.log(
  '전략'.padEnd(18) + ['네글자', '축부호', '뚜렷한축', '막대길이', '유형수'].map((h) => h.padStart(10)).join(''),
)
for (const s of STRATEGIES) {
  const r = results[s]
  console.log(
    s.padEnd(18) +
      [
        pct(r.exact, N),
        pct(r.axisHits, r.axisTotal),
        pct(r.decisiveHits, r.decisiveTotal),
        (r.conf.reduce((a, b) => a + b, 0) / r.conf.length).toFixed(3),
        `${r.codes.size}/16`,
      ]
        .map((v) => v.padStart(10))
        .join(''),
  )
}

console.log('\n현재 방식 대비 (같은 사람이 뒤집힌 수)')
for (const s of STRATEGIES.slice(1)) {
  let win = 0
  let lose = 0
  for (let i = 0; i < N; i++) {
    if (results[s].flags[i] && !results.current.flags[i]) win++
    else if (!results[s].flags[i] && results.current.flags[i]) lose++
  }
  const z = (win - lose) / Math.sqrt(win + lose)
  console.log(
    `  ${s.padEnd(18)} 새로 맞힘 ${String(win).padStart(4)} | 새로 틀림 ${String(lose).padStart(4)} | 순증 ${String(win - lose).padStart(4)}  z=${z.toFixed(2)}`,
  )
}
