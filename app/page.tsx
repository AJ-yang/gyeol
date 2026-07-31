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
        <p className="mt-5 break-keep leading-relaxed text-neutral-400">
          재미있게 본 영화와 드라마를 고르면
          <br />
          당신의 이야기 취향에 이름을 붙여드립니다.
        </p>
      </div>

      <Link
        href="/pick/"
        className="rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:bg-neutral-200"
      >
        시작하기
      </Link>

      <p className="text-xs text-neutral-600">약 1분 소요 · 로그인 없음</p>
    </main>
  )
}
