| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Lemmo Frontend Rules & Agent Constraints |
| **Title (FA)** | قوانین فرانت‌اند و الزامات ایجنت‌ها در پروژه Lemmo |
| **ID** | DOC-ARCH-001 |
| **Category** | `architecture` |
| **Status** | `Active` |
| **Owner** | Core Architecture Team |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Mandatory engineering constraints, import boundaries, token rules, and coding standards for developers and AI agents. |
| **Summary (FA)** | الزامات مهندسی، مرزهای مجاز ایمپورت، قوانین توکن‌ها و استانداردهای کدنویسی برای توسعه‌دهندگان و ایجنت‌ها. |
| **Tags** | `architecture`, `agents`, `rules`, `boundaries`, `tokens` |

---

# AGENTS.md — Lemmo Frontend Rules

These rules are binding for every human contributor AND every AI agent working in
`frontend/`. They are enforced by `pnpm run lint` / `pnpm run typecheck` /
`pnpm run build` and by architecture review. Values/sizes/colors that are not
already in `src/design-system/tokens` must NOT be invented.

---

## 0. Single source of truth — the golden rule

There is exactly **one** source of truth for every decision in this project.
Authoritative sources, by priority:

1. Token code (`src/design-system/tokens/` + `src/styles/tokens.css`) — values.
2. Locked decisions (`AGENTS.md`, `docs/decisions/*.md`).
3. Design-system documentation (`src/design-system/docs/`, `primitives/README.md`).

If a decision appears in **two places with different values**, that is a defect,
not a judgment call:

- **STOP immediately.** Do not silently "fix" the value and do not ship a third
  version of it.
- Ask the team in a short document (see `docs/decisions/_template.md`) which
  source is authoritative, and record the resolution there.
- Only after the team confirms may the conflicting source be corrected to match
  the single authoritative source.
- **Never write a contradictory decision into any documentation**, doc, README,
  ADR, or roadmap. If a doc is outdated, mark it `SUPERSEDED` with a pointer to
  the authoritative source instead of leaving two live truths.

This rule applies to humans and to AI agents alike.

---

## 1. Architecture and boundaries (Workspace — Next.js)

> Authoritative reference: [DOC-FE-001 — Workspace Frontend Architecture](../frontend/workspace-architecture.md) and [DOC-FE-002 — Workspace Architectural Decisions](../frontend/workspace-decisions.md).

Strict unidirectional dependency flow (enforced by linting and architecture review):
`app → modules → tool-engine → sdk → backend` (and `shared` as utility layer across all levels, never reversed).

```
src/
├── app/                  ← Next.js App Router only (route & layout, zero domain logic)
├── modules/              ← Domain logic (independent of routes, unit-testable)
│   ├── tool-engine/      ← Single source of truth for tools (registry, schema-renderer, job-manager)
│   ├── chat/             ← Chat surface (window, command parser)
│   ├── canvas/           ← Canvas surface (board, tool nodes, socket connection rules)
│   ├── gallery/          ← Showcase & community templates
│   ├── assets/           ← Generated asset management
│   └── billing/          ← Token balance and plan management
├── sdk/                  ← ONLY gateway to backend (auto-generated typed client, token interceptors)
├── shared/               ← Reusable UI, generic hooks, pure utilities, zero domain knowledge
└── stores/               ← Global client UI state (sidebar, theme)
```

- `app/` contains only routes and layouts. No domain logic, no direct API calls.
- `modules/tool-engine` is the single source of truth for tools; `chat` and `canvas` are both consumers of it, not owners of tool logic.
- `sdk/` is the sole contact point with backend. Raw `fetch` / `axios` anywhere in components or modules is strictly forbidden.
- `shared/` has zero domain knowledge (no chat, canvas, or tool domain awareness).

---

## 2. Styling (CSS strategy — finalized)

Strategy: **Vanilla CSS + CSS Modules**, scoped per component.

- Every component gets a co-located `X.module.css` (`camelCaseOnly`; unitClass
  is reachable as `styles.unitClass`).
- Values come ONLY from tokens: `var(--lemmo-*)`. `padding: var(--lemmo-space-300)`
  is legal; `padding: 17px` is NOT.
- No hardcoded hex anywhere (linted). No "design by eye" — if a token does not
  exist, REQUEST it from the designer.
- Layout-only/global styles may live in `src/styles/*.css` (e.g. tokens.css,
  global.css); component styles must be CSS Modules.

## 3. Design system constraints

- Icons: ONLY `synthline` (`synthline/react`). Always `strokeWidth={1.5}`,
  color inherits `currentColor`, size from `--lemmo-size-icon-*`.
  Icon ladder RESOLVED (2026-09-12 reference audit): `12 | 16 | 20 | 24 | 28` — `xl=28`, no 32.
- Fonts: registered only in `src/design-system/fonts/fonts.css` (Satoshi /
  Oddval / Morabba / IRANSansX). Type scale = reference-confirmed values
  (h3 1.75rem/2.25rem, h4 1.5rem/1.875rem; h2/h3 tracking -2%, h4 tracking -1%; caption tracking 0).
- Typography classes use `var(--lemmo-font-*)` / `var(--lemmo-type-*)`.
- Breakpoints (reference-confirmed 2026-09-12): 7-tier ladder
  `20/40/48/64/80/120/158rem`; semantic aliases = mobile/base `20rem`,
  tablet `48rem`, desktop `80rem`, wide `120rem` (breakpoints.ts + tokens.css).
  No other breakpoint values may be introduced without an ADR.
- Preference for semantic aliases over raw palette: `--lemmo-text-primary`,
  `--lemmo-surface-elevated`, `--lemmo-border-default`, `--lemmo-interactive-primary`
  etc. (see `tokens.css` "Semantic roles").
- `danger` / `warning` / `success` / `info` status colors EXIST (resolved
  2026-09-12, reference audit): `--lemmo-status-*` in `tokens.css`, palette in
  `colors.ts`. Do not add further status tones without the same evidence.

## 4. State and data

- **Server state**: `@tanstack/react-query` only. Never copy server data into a client store.
- **AI Job state**: Central Job Manager store (`job-store.ts` via Zustand) subscribed via WebSocket/SSE; all surfaces (`chat`, `canvas`, `assets`) consume `jobId`.
- **Global UI state**: Zustand, split by concern (`useUiStore`, ...).
- **Local state**: `useState`/`useReducer`.
- **All backend communication**: Exclusively via `@/sdk` (`sdk.tools.*`, `sdk.chat.*`, `sdk.assets.*`). NO raw `fetch` or `axios` in components or hooks.
- **Routing**: Next.js App Router (`src/app/(workspace)/...`).

## 5. Quality gates (run before pushing/committing)

```
pnpm run lint        # --max-warnings=0, boundaries enforced
pnpm run typecheck
pnpm run build
```

- Conventional Commits enforced by commitlint (header ≤ 72 chars, body lines
  ≤ 100 chars).
- Bundle budget is reviewed via `pnpm run build:analyze` (`dist/report.html`)
  when a dependency is added.
- Authoritative architecture reference: `docs/frontend/workspace-architecture.md`.

## 6. Component API conventions (decision 2026-09-12 — ADR-001)

Canonical example lives in `design-system/primitives/README.md`.

- Props inherit from the native element: `React.ComponentPropsWithoutRef<'button'>`.
- Prop names: `variant`, `size`, `disabled`, `loading`, `invalid`, `readonly`,
  `selected`, `className`, `children`.
- **No public `state` prop.** Visual states (hover/focus/active) live in CSS +
  `data-*` attributes, never in props.
- Semantic booleans are attributes on the component (`disabled`, `loading`);
  internal state uses `is/has/can` prefixes.
- `forwardRef` is mandatory on every primitive.
- `asChild` (Radix pattern) for polymorphism — `<Button asChild><Link/></Button>`.
- `className` always last (override); raw `style` is banned except a documented
  escape hatch.
- Variants are discriminated unions, never boolean combinations
  (`variant: 'primary' | 'ghost'`, not `isPrimary isGhost`).

## 7. Naming conventions (decision 2026-09-12 — ADR-001)

| Kind                 | Rule                         | Example                                          |
| -------------------- | ---------------------------- | ------------------------------------------------ |
| Component            | `PascalCase.tsx`             | `ChatMessage.tsx`                                |
| Hook                 | `camelCase.ts` + `use`       | `useChat.ts`                                     |
| Role file            | `dot-notation`               | `chat.api.ts`, `chat.types.ts`, `chat.schema.ts` |
| Folder               | `kebab-case`                 | `chat-sidebar/`                                  |
| Type/Interface       | `PascalCase`, no `I`         | `ButtonProps`, `Message`                         |
| Enum / member        | `PascalCase` / `UPPER_SNAKE` | `MessageRole.SYSTEM`                             |
| True constant        | `UPPER_SNAKE_CASE`           | `MAX_RETRY_COUNT`                                |
| Boolean variable     | `is/has/should/can`          | `isLoading`, `hasError`                          |
| Event prop / handler | `onX` / `handleX`            | `onSend` / `handleSend`                          |
| Test                 | colocated                    | `ChatMessage.test.tsx`                           |
| Barrel               | feature/shared root only     | `features/chat/index.ts`                         |

- **No nested barrels** — `index.ts` only at the root of a feature/shared module.
- **No `I` prefix** on interfaces.

### In-Code Language & Comment Standards (Strict Policy)
- **All code comments, function docstrings, JSDoc/TSDoc annotations, component captions, and commit messages MUST be written strictly in clear, professional English.**
- Non-English comments (e.g., Persian comments) inside `.ts`, `.tsx`, `.js`, `.css`, or code blocks are **strictly forbidden**.
- While user-facing text displayed to end-users supports Persian via i18n, the codebase implementation, variable names, logic explanation, and engineering notes must remain 100% English.

## 8. Shared component admission (decision 2026-09-12 — ADR-001)

Home: `src/shared/README.md` section "Admission to shared".

A component is promoted only when ALL of the following hold:

1. ≥ 3 independent usages across ≥ 2 features (or a firm roadmap slot).
2. Stable API — no signature change for ≥ 2 sprints.
3. No `features/*` domain vocabulary in props/types.
4. Passes the a11y baseline.
5. Has at least one test.
6. Documented in `src/shared/README.md`.

Destination: composites → `shared/ui/patterns`; a component that becomes a pure
primitive (no domain language) → `design-system/primitives/`.

- Approver: **tech lead only** — no voting/consensus.
- Demotion is allowed when shared keeps drifting toward one feature.
- "We might need it later" is NOT a valid reason. Enforced at review.

## 9. Page / layout ownership (decision 2026-09-12 — ADR-001)

Home: `src/app/README.md`.

| Area              | Owner                      | Examples                                                    |
| ----------------- | -------------------------- | ----------------------------------------------------------- |
| Shell & chrome    | `app/`                     | AppShell, Sidebar, Topbar, Router, ErrorBoundary, Providers |
| Layout primitives | `shared/ui/layout/`        | Stack, Grid, Container, Divider                             |
| Feature pages     | `features/<x>/pages/`      | ChatPage, SettingsPage                                      |
| Domain components | `features/<x>/components/` | ChatSidebar, ConversationHeader                             |

- A feature NEVER imports from another feature — cross-feature goes through
  `shared/` or `app/`.
- Pages are thin: compose + layout only — no business logic, fetch, or complex state.
- AppShell owns theme, RTL/LTR, and a11y landmarks (`<header>`, `<nav>`, `<main>`).
- **Shell responsive rule (recorded 2026-09-12, Phase 3 Wireframe):** the sidebar
  collapses to an icon-only rail below `48rem` (`breakpointsSemantic.tablet`);
  full rail width is 16rem (mirrors `app/layout/layout.css`). No additional shell
  breakpoint may be introduced without an ADR. Reference build:
  `src/features/showcase/pages/WireframePage.tsx`.

## 10. Feature folder growth (decision 2026-09-12 — ADR-001)

- Start flat: `components/` + `hooks/` + `api/` + `types.ts` + `index.ts`.
- Split only when a trigger fires (whichever first): > 5 components in
  `components/`, or ≥ 2 clearly distinct concerns (e.g. composer / conversation / message).
- Split subfolders are domain-named (`composer/`, `conversation/`, `message/`,
  `shared/`), never `part1` / `common`.
- Never create empty folders upfront; a complex subfolder gets a one-paragraph
  README (responsibility + public API + dependencies).
- Barrels only at the feature root.

## 11. Form & test stack (decision 2026-09-12 — ADR-002)

Home: `docs/decisions/ADR-002-form-test-stack.md`.

- Forms: **React Hook Form + Zod**, schema shared with the backend contract;
  plain `useState` for 1–2 field forms (no library added).
- Tests: `vitest` + `@testing-library/react` + `user-event`. Minimum per
  primitive: render, keyboard interaction (Enter/Space/Tab), role + accessible
  name, key states (disabled/loading/invalid).
- No numeric coverage target; focus on critical paths and primitives.
- Tests colocate (`Button.test.tsx` next to `Button.tsx`).
- CI gates: `typecheck` + `lint` + `test` + `build`. E2E (Playwright) deferred.

## 12. Open decisions being brushed (do NOT resolve unilaterally)

- ~~Icon scale `xl`: 28 vs 32~~ → **RESOLVED 2026-09-12**: `28` (reference audit, §11.2).
- ~~Status colors danger/warning/success~~ → **RESOLVED 2026-09-12**: shipped from the
  higgsfield.ai reference audit (danger/warning/success/info in `colors.ts`, §11.6). Do **not**
  add further status tones without the same reference/documentation.
- ~~Phase-3 code architecture (hierarchy, API, naming, admission, ownership,
  growth, form/test)~~ → **RESOLVED 2026-09-12**: `docs/decisions/` (ADR-001 grouped,
  ADR-002 form/test). Any change to any of the 7 needs a NEW ADR — never reopened in chat.
- i18n bootstrap — placeholder exists, timing decided later.
- Auth/Workspace architecture decision — **deferred to Phase 8** (core features);
  only its critical E2E path is pinned now (ADR-002: login → session restore →
  workspace switch → logout). Resolved as "deferred" in `phase-3-step-0-review.md` (B2).
- AGENTS.md is meant to be concise and obeyed; add a rule only when it prevents a
  real mistake.
