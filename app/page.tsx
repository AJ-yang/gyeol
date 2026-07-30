import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-black leading-tight sm:text-5xl">
          당신은 어떤 이야기에
          <br />
          끌리는가
        </h1>
        {/* 한글은 어절 중간에서도 줄이 바뀌므로 break-keep으로 어절을 지킨다. */}
        <p className="mt-5 break-keep leading-relaxed text-neutral-400">
          영화와 드라마 두 편 중 하나를 고르는 일을 열두 번.
          <br />그 선택이 당신의 이야기 취향을
          <br />네 글자로 말해줍니다.
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
