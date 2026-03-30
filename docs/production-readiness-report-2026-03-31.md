# Production Readiness Report — excalidraw-converter

**Date:** 2026-03-31
**Verdict: NEEDS WORK**
**Agents:** code-reviewer, security-reviewer, typescript-reviewer, architect

---

## Executive Summary

빌드는 성공하고, 라이브러리 계층(`src/lib/`)의 테스트 커버리지는 100%/96%로 우수합니다.
그러나 **보안(인증 부재, Rate Limiting 없음, Path Traversal), 운영 인프라(CI/CD, 로깅, 에러 트래킹 미구성),
코드 품질(God Component, 타입 안전성 부족)**에서 프로덕션 배포를 차단하는 이슈가 다수 발견되었습니다.

---

## Build & Test Status

| Item | Result |
|------|--------|
| `next build` | SUCCESS (0 type errors) |
| Unit Tests | 123 passed, **1 failed** (`generateId` base64url vs alphanumeric regex mismatch) |
| Coverage (src/lib) | 100% Stmts, 96.22% Branch, 100% Funcs, 100% Lines |
| ESLint | **설정 파일 없음** (`eslint.config.js` 미존재) |
| E2E Tests | 5 spec files, API mocking 기반 |

---

## Consolidated Findings (중복 제거, 우선순위순)

### CRITICAL — 배포 차단

| # | Issue | Source | File |
|---|-------|--------|------|
| C-1 | **API 인증 없음** — 누구나 `/api/convert` 호출 가능. `assertOAuthAuth()`는 서버->Anthropic 인증 방식만 검증하며, 요청자 인증은 하지 않음 | Security | `route.ts:160` |
| C-2 | **Rate Limiting 없음** — 요청당 $0.25 Claude 호출. 무제한 요청 시 금전적 DoS | Security, Architect | `route.ts` |
| C-3 | **Path Traversal + Prompt Injection** — `file.name`에서 추출한 확장자가 파일 경로와 LLM 프롬프트에 직접 삽입됨 | Code, Security, TS | `route.ts:57-63` |
| C-4 | **MIME Spoofing** — 파일 타입 검증이 `file.type`(브라우저 설정값)에만 의존. Magic bytes 미검증 | Security | `route.ts:134-154` |
| C-5 | **CI/CD 파이프라인 없음** — `main` push 시 테스트/린트 없이 바로 배포 | Architect | Missing |
| C-6 | **구조화된 로깅 없음** — API 에러가 어디에도 기록되지 않음. 장애 추적 불가 | Architect | `route.ts` |

### HIGH — 릴리스 전 수정 필요

| # | Issue | Source | File |
|---|-------|--------|------|
| H-1 | **Prompt Injection** — 사용자 텍스트/파일 내용이 `---` 구분자로만 분리되어 LLM 프롬프트에 삽입됨 | Code, Security | `route.ts:74-88` |
| H-2 | **Temp 디렉토리 미정리** — `unlink(tempFile)`만 수행, 부모 디렉토리 `excalidraw-XXXXXX` 잔류 | Code, Security | `route.ts:56,253` |
| H-3 | **HTTP 보안 헤더 없음** — CSP, HSTS, X-Frame-Options 등 미설정 | Security | `next.config.ts` |
| H-4 | **내부 에러 메시지 노출** — `assertOAuthAuth` 에러가 클라이언트에 그대로 전달 | Code, Security | `route.ts:250-253` |
| H-5 | **`as unknown as ExcalidrawElement` 이중 캐스트** — LLM 응답의 타입 안전성 완전 소실 | Code, TS | `element-helpers.ts:213` |
| H-6 | **ExcalidrawWrapper 무한 루프 위험** — `isUpdatingFromProps` ref 기반 가드가 단일 프레임 레이스에 취약 | Code | `ExcalidrawWrapper.tsx:47-53` |
| H-7 | **ESLint 설정 없음** — `react-hooks/exhaustive-deps` 등 핵심 규칙 미적용 | TS, Architect | Missing |
| H-8 | **API 라우트 단위 테스트 없음** — 가장 중요한 코드 경로에 테스트가 전무 | Architect | `route.ts` |
| H-9 | **God Component** — `ConverterApp.tsx`가 314줄, useState 11개, 모든 상태와 핸들러를 단독 관리 | Architect | `ConverterApp.tsx` |
| H-10 | **TextInput 다크모드 깨짐** — 하드코딩된 `bg-white`, `text-[#1b1b1f]` 사용 | Code, Architect | `TextInput.tsx:30` |

### MEDIUM — 품질 개선

| # | Issue | Source | File |
|---|-------|--------|------|
| M-1 | `loadFromStorage<T>`가 `JSON.parse` 결과를 미검증 캐스트 | Code, TS | `ConverterApp.tsx:29` |
| M-2 | `formData.get("file") as File`에 `instanceof` 검증 없음 | TS | `route.ts:113-114` |
| M-3 | `buildConversionPrompt(inputType: string)` — `InputType`이 아닌 `string` 수용 | Code, TS | `excalidraw-prompt.ts:161` |
| M-4 | `TextInput`의 `onSubmit`이 매 키 입력마다 호출 + localStorage 쓰기 | Code, TS, Architect | `TextInput.tsx:20-22` |
| M-5 | npm audit: DOMPurify XSS 취약점 5건 (transitive) | Security | `package.json` |
| M-6 | `ImageUpload`의 FileReader가 언마운트 시 정리되지 않음 | Code, TS | `ImageUpload.tsx:32-38` |
| M-7 | `autoLayout`에서 화살표 좌표가 재계산되지 않음 | Code | `element-helpers.ts:290-313` |
| M-8 | `ExcalidrawWrapper`의 elements prop이 `Record<string, unknown>[]`로 타입 약화 | TS | `ExcalidrawWrapper.tsx:14` |
| M-9 | FileUpload에 클라이언트측 크기/타입 검증 없음 | Code, Security | `FileUpload.tsx` |
| M-10 | `Content-Type` 헤더 미검증 후 `formData()` 파싱 | Security | `route.ts:99` |
| M-11 | `maxDuration: 150`이 내부 타임아웃(120s)보다 30s 초과 | Security | `route.ts:12` |
| M-12 | 접근성: textarea에 `<label>` 없음, resize handle에 aria 속성 없음 | Architect | Multiple |

### LOW — 편의 개선

| # | Issue | Source |
|---|-------|--------|
| L-1 | 테스트 실패: `generateId` regex가 base64url 문자(`_`, `-`) 미허용 | Build |
| L-2 | `modes` 배열이 매 렌더마다 재생성 | Code |
| L-3 | `autoLayout` 매직 넘버 (360, 230, 100) 상수 미추출 | Code |
| L-4 | DragLeave 이벤트에서 `relatedTarget` 미확인으로 깜빡임 | TS |
| L-5 | `type="button"` 탭 버튼에 미설정 | Code, TS |
| L-6 | Open Graph, robots.txt, sitemap.xml 없음 | Architect |
| L-7 | Web Vitals / 성능 모니터링 없음 | Architect |

---

## Remediation Priority

### Phase 1 — 배포 차단 해소 (CRITICAL)

1. **인증 추가** (C-1) — 최소한 shared secret 또는 Vercel OIDC
2. **Rate Limiting** (C-2) — `@upstash/ratelimit` 또는 Vercel WAF
3. **파일 확장자 새니타이징** (C-3) — MIME type 기반 allowlist 사용
4. **Magic bytes 검증** (C-4) — 파일 헤더 바이트 검증
5. **CI/CD 파이프라인** (C-5) — GitHub Actions: tsc, eslint, vitest, playwright
6. **구조화된 로깅** (C-6) — pino + JSON 포맷

### Phase 2 — HIGH 해소

7. Prompt injection 방어 (H-1) — `<user_content>` XML 태그 래핑
8. Temp 디렉토리 정리 (H-2) — `rm(tempDir, { recursive: true })`
9. HTTP 보안 헤더 (H-3) — next.config.ts `headers()` 추가
10. 에러 메시지 제네릭화 (H-4) — 서버 로깅 + 클라이언트에 generic 메시지
11. ESLint 설정 (H-7) — `eslint.config.mjs` 생성
12. API 라우트 테스트 (H-8) — `extractJsonArray`, 입력 검증 테스트
13. ConverterApp 분해 (H-9) — custom hooks 추출
14. 다크모드 수정 (H-10) — CSS 변수 사용

### Phase 3 — MEDIUM/LOW

15-27. 위 테이블 순서대로 진행

---

## Strengths (잘된 점)

- `src/lib/` 유틸리티 계층: 높은 응집도, 100% 커버리지, 불변 패턴
- `src/types/excalidraw.ts`: Discriminated union 타입 정의 우수
- 클라이언트/서버 경계 명확 (App Router)
- localStorage 지속성 + 하이드레이션 불일치 방어
- 계층적 타임아웃 (서버 120s + 클라이언트 130s + Vercel 150s)
- Claude Agent SDK 비용 제한 (`maxBudgetUsd: 0.25`, `effort: "low"`)

---

## Verdict

**NEEDS WORK** — CRITICAL 6건, HIGH 10건 해소 후 재평가 필요.
유틸리티 계층의 품질은 프로덕션급이나, API 보안과 운영 인프라가 부재합니다.
