# ADR-002 — Form & test stack

- **Date:** 2026-09-12
- **Status:** Accepted

## Context

Feature work (auth, settings, chat composer) needs one default form and testing
strategy; mixed stacks create drift. The team agreed on a single stack.

## Decision

- **Forms:** React Hook Form + Zod, schema shared with the backend contract
  (single source of truth). Plain `useState` is fine for 1–2 field forms — the
  libraries are NOT added for those.
- **Tests:** `vitest` + `@testing-library/react` + `@testing-library/user-event`.
  Minimum per primitive: render without error, keyboard interaction
  (Enter/Space/Tab), role + accessible name, key states (disabled/loading/invalid).
- **No numeric coverage target** — focus on critical paths and primitives.
- Tests are colocated: `Button.test.tsx` next to `Button.tsx`.
- CI gates are mandatory: `typecheck` + `lint` + `test` + `build`.
- **E2E (Playwright) deferred** until the UI stabilizes or the first real
  regression appears — **with one early exception**: a single minimal spec for
  the critical Auth/Workspace path (login → session restore → workspace switch →
  logout). This path is both security-sensitive and multi-step async, so its
  regression cost is highest; everything else waits.
- **Auth/Workspace architecture — deferred (Phase 8).** The full Auth + Workspace
  architecture (pages, routing, state, guard model) is deliberately NOT decided
  now; only the critical E2E path above is pinned here. See Step-0 resolution B2
  in `docs/road/phase-3-step-0-review.md`.

## Consequences

- Adds dev dependencies with the first Phase-3 PR: `vitest`, `jsdom`,
  `@testing-library/react`, `@testing-library/user-event`, `react-hook-form`,
  `zod`.
- New primitives must ship with a colocated test to enter `shared/` (ADR-001 §4,
  criterion 5).
