# AGENTS.md

이 파일은 이 저장소에서 작업하는 AI 에이전트를 위한 규칙을 정의한다. README.md에 없는, 에이전트 전용 지침만 담는다.

## Operational Commands

- 패키지 매니저는 **bun 고정**. npm/yarn/pnpm 사용 금지 (`bun.lock` 존재, `package.json` scripts가 `bun --watch` 전제).
- `bun install` — 의존성 설치
- `bun run dev` — API 서버(3002) + Vite(5173) 동시 실행 (`concurrently`로 묶여 있음, 둘 중 하나만 켜면 프론트엔드에서 `/api/*` 호출이 실패한다)
- `bun run server` — API 서버만 실행 (`server/index.ts`, watch 모드)
- `bun run test` — Vitest 1회 실행 (`server/**/*.test.ts` + `src/**/*.test.{ts,tsx}` 포함)
- `bun run test:watch` — Vitest watch 모드
- `bun run lint` — ESLint
- `bun run build` — `tsc -b && vite build`

## Golden Rules

### Immutable

- API 키 원문은 클라이언트로 응답하지 않는다. `/api/config`는 키 보유 여부(boolean)만 반환한다 (`server/index.ts:147-157`). 이 엔드포인트나 유사한 상태 조회 엔드포인트에 실제 키 값을 포함시키지 않는다.
- `.env`는 절대 커밋하지 않는다 (`.gitignore`에 등록됨). API 키를 코드에 하드코딩하거나 로그(`console.log` 등)에 출력하지 않는다.

### Do's & Don'ts

- AI가 생성하는 컴포넌트 코드는 `react-live`의 `noInline` 모드로 실행된다 (`src/components/LivePreview.tsx:14`). 이 코드는 `import` 문을 쓸 수 없고 반드시 `render(<Component />)` 호출로 끝나야 한다 (`server/index.ts:10-20`의 SYSTEM_PROMPT 규칙). `server/generator.ts`의 `ensureRenderCall`/`stripCodeFences`가 이 계약을 보정하는 안전망이므로, SYSTEM_PROMPT 규칙을 바꿀 때는 이 두 함수도 함께 검토한다.
- `server/generator.ts`, `server/fallback.ts`는 부수효과 없는 순수 함수로 유지한다 — 그래야 `Bun.serve` 없이 단위 테스트가 가능하다 (파일 최상단 주석, `generator.test.ts`, `fallback.test.ts` 참고). 새 정규화/폴백 로직을 추가할 때도 이 패턴(순수 함수 + 별도 `server/index.ts`에서 호출)을 따른다.
- Provider별 호출 로직은 대칭이 아니다: Anthropic은 단일 모델(`callAnthropic`)을 직접 호출하지만, Google은 `GOOGLE_MODELS` 우선순위 배열을 `withModelFallback`으로 순회한다 (`server/index.ts:4-5, 98-136`). Google 모델 배열의 순서를 바꾸면 실제 우선순위가 바뀐다. 새 provider를 추가할 때 폴백이 필요한지 먼저 판단한다.
- 에러 처리는 두 곳에서 각각 다른 실패를 방어한다: `server/index.ts:194-206`의 HTTP 상태코드(503/429) 문자열 매칭과, `server/index.ts:122-125`의 Gemini `finishReason === 'MAX_TOKENS'` 체크. 둘 중 하나만 보고 "중복"이라 판단해 제거하지 않는다 — 각각 다른 실패 모드를 막는다.

## Project Context

프롬프트를 입력하면 AI(Anthropic Claude 또는 Google Gemini)가 React 컴포넌트를 생성하고, 실시간으로 미리보고 코드를 확인하는 도구.

Tech Stack: React 19, TypeScript, Vite, Bun(API 프록시 서버), react-live, Vitest.

## Standards & References

- 커밋 메시지: `type(scope): 한국어 요약` 또는 `type: 한국어 요약` (`feat`, `fix`, `chore`, `refactor` 등). `git log --oneline`으로 기존 스타일 확인.
- 코딩 컨벤션 상세는 README.md 및 `eslint.config.js` 참고.
- **Maintenance Policy**: 이 문서의 규칙(특히 Golden Rules의 파일·라인 근거)이 코드와 어긋나면, 임의로 무시하지 말고 업데이트를 제안한다.
- `server/` 디렉토리는 별도 규칙이 있다: `./server/AGENTS.md` 참고.
