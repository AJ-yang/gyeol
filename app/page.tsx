import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-black leading-tight sm:text-5xl">
          당신은 어떤 이야기의
          <br />
          주인공인가
        </h1>
        <p className="mt-5 leading-relaxed text-neutral-400">
          영화와 드라마 두 편 중 하나를 고르는 일을 열두 번.
          <br />그 선택이 당신의 서사 정체성을 네 글자로 말해줍니다.
        </p>
      </div>

      <Link
        href="/play"
        className="rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:bg-neutral-200"
      >
        시작하기
      </Link>

      <p className="text-xs text-neutral-600">약 1분 소요 · 로그인 없음</p>
    </main>
  )
}
