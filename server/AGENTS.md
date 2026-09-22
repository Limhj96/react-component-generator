# AGENTS.md (server/)

이 파일은 `server/` 디렉토리 전용 규칙이다. 루트 `../AGENTS.md`의 규칙에 추가로 적용된다 (중복 서술 없음).

## Module Context

Bun으로 실행되는 단일 파일 API 프록시 서버(`index.ts`). 프론트엔드(Vite, `/api` 프록시 경유)의 요청을 받아 Anthropic/Google 생성 API를 호출하고, 응답을 `react-live`가 실행 가능한 코드로 정규화해 반환한다.

## Tech Stack & Constraints

- `Bun.serve` 하나로 라우팅한다 (Express/Hono 등 프레임워크 없음). 새 엔드포인트를 추가할 때도 `fetch(req)` 내 `url.pathname` 분기 패턴을 따른다 (`index.ts:140-219`).
- 외부 HTTP 호출은 Node `fetch` 전역만 사용한다 (`axios` 등 추가 의존성 없음, `callAnthropic`/`callGoogleModel` 참고).
- CORS는 `CORS_HEADERS` 상수 하나로 전 응답에 일괄 적용한다 (`index.ts:51-55`). 새 응답 분기를 추가할 때 이 헤더를 빠뜨리지 않는다.

## Implementation Patterns

- 부수효과 없는 로직(텍스트 정규화, 폴백 순회)은 `generator.ts`/`fallback.ts`처럼 별도 모듈의 순수 함수로 분리하고, `index.ts`에서 조합한다. `index.ts` 자체(`Bun.serve` 콜백)에는 새 순수 로직을 직접 추가하지 않는다.
- Google 계열 모델을 추가/변경할 때는 `GOOGLE_MODELS` 배열(`index.ts:5`)에 우선순위 순서로 추가한다. 배열 순서가 곧 폴백 시도 순서다.
- provider를 추가할 때는 `Provider` 타입(`index.ts:57`), `ENV_KEYS`(`index.ts:59-62`), `resolveApiKey` 분기, 그리고 `/api/generate` 핸들러의 provider 분기(`index.ts:183-186`)를 함께 수정해야 한다 — 하나만 고치면 해당 provider가 절반만 동작한다.

## Testing Strategy

- 테스트 명령: `bun run test` (루트에서 실행, `vite.config.ts`의 `test.include`가 `server/**/*.test.ts`를 포함).
- `generator.ts`/`fallback.ts`처럼 순수 함수만 단위 테스트 대상이다 (`generator.test.ts`, `fallback.test.ts`). `index.ts`의 `Bun.serve` 핸들러 자체는 테스트가 없다 — 이 경계를 벗어나 서버 진입점에 복잡한 분기를 직접 추가하면 테스트 커버리지 밖에 로직이 쌓인다. 가능하면 로직을 순수 함수로 뽑아 테스트를 추가한다.

## Local Golden Rules

- `resolveApiKey`는 클라이언트가 보낸 키를 서버 `.env` 키보다 우선한다 (`index.ts:64-66`, `clientKey || ENV_KEYS[provider] || null`). 이 우선순위를 뒤집으면 사용자가 직접 입력한 키를 무시하고 서버 키로 과금하게 된다.
- API 키는 요청 바디로만 주고받는다 (`apiKey` 필드). 쿼리스트링에 실어 로그에 남을 수 있는 방식(`callGoogleModel`의 `?key=` 부분은 Google API 자체 요구사항이므로 예외)을 새로 추가하지 않는다.
