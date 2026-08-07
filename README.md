# 결 (gyeol)

재미있게 본 영화·드라마를 고르면 **당신의 이야기 취향에 이름을 붙여주는** 서비스.

**→ [aj-yang.github.io/gyeol](https://aj-yang.github.io/gyeol/)**

이 서비스가 파는 것은 추천 정확도가 아니다. 시청 이력을 가진 왓챠피디아·넷플릭스를 그것으로 이길 방법은 없다. 대신 취향을 **언어로** 만들어준다 — "액션 4.2점"이 아니라 "서늘한 복수의 결"이라고.

- **취향 정의** — 제품의 본체. 25개 결 중 하나로 판정한다
- **추천** — 그 정의가 맞다는 증거
- **공유** — 그 정의의 얼굴

결과에는 **판정을 가른 한 편**이 함께 나온다 — 고른 것을 하나씩 빼보고 결이 바뀌는 작품을 찾는다. 그리고 친구에게 링크를 보내면 **둘의 궁합**(`/vs/`)이 나온다. 둘 다 서버 없이 주소만으로 돈다.

공유 카드는 두 규격으로 만든다. 카카오톡은 4:5가, 인스타그램 스토리는 9:16이 크게 잡힌다. 25개 결은 [`/gyeols/`](https://aj-yang.github.io/gyeol/gyeols/)에 모아 두었다.

## 구조

서버도 데이터베이스도 없다. Next.js 정적 익스포트를 GitHub Pages에 올리고, 카탈로그 색인(12,595편)을 브라우저가 받아 전부 클라이언트에서 계산한다. 선택 기록은 URL에 TMDB id로 담아 서버 없이 결과를 재현한다.

```
lib/gyeol/     매칭 엔진 (순수 함수, 전부 테스트됨)
data/          결 25종 정의
scripts/       TMDB 파이프라인
docs/superpowers/specs/   PRD와 결 정의 (정본)
```

## 데이터 만들기

`.env.local`에 `TMDB_API_KEY`가 필요하다.

```bash
npm run build:data   # 카탈로그 → 키워드 → 색인 → 추천. TMDB 호출 2만 건, 오래 걸린다
npm run dev
```

산출물(`public/catalog.json`, `public/recommendations.json`)은 재생성 가능하므로 커밋하지 않는다.

## 배포

```bash
npm run deploy:pages
```

정적 빌드를 `gh-pages` 브랜치로 강제 푸시한다.

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
