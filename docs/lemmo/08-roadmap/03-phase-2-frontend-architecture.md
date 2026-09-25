# Phase 2 — Frontend Architecture

> **⛔ SUPERSEDED — historical phase deliverable.** Architecture references inside use the old
> `shared/components/` path; loading/error/empty composites now live in `shared/ui/patterns/` and
> layout primitives in `shared/ui/layout/`. Single source of truth:
> `src/design-system/tokens/` + `src/styles/tokens.css` (values) ·
> `frontend/AGENTS.md` + `docs/decisions/*.md` (locked decisions) ·
> `src/design-system/docs/` (design-system docs). When in doubt, follow the live sources.

### Execution Document for the Developer | Project: Lemmo

> **Prerequisite:** Phase 0 (Tooling & Governance) and Phase 1 (Design System Documentation) must be complete and QA-approved (QA-0, QA-1) before starting this phase.
>
> **Stack assumption:** React 18+ / TypeScript / Vite. If the project uses Next.js instead, flag it — routing and data-fetching sections below need adjustment (Next.js provides file-based routing and server components that replace parts of Section 3 and 5).

---

## 1. Goal of This Phase

This phase produces no visible UI. Its output is a set of **binding architectural decisions** that every feature built afterward (chat, canvas, home, settings) must follow without re-litigating them. The goal is that when a new screen or feature is added — by a human or an AI agent — there is exactly one correct place to put each piece of code, one correct way to fetch data, one correct way to manage state, and one correct way to handle loading/error states.

By the end of this phase, the project skeleton must build, run, and route between empty placeholder pages, with all architectural seams wired but no real feature logic yet.

---

## 2. Module Boundaries & Folder Structure (Finalized)

Building on the baseline from Phase 0, this phase finalizes and **enforces** the boundary rules.

```
src/
├── app/
│   ├── App.tsx                # Root component: providers + router
│   ├── providers/              # ThemeProvider, QueryClientProvider, i18n provider, etc.
│   ├── router/                 # Route definitions, route guards
│   └── layout/                 # AppShell, Sidebar, TopBar (structural layout only)
├── design-system/              # From Phase 1 — untouched by feature code except via imports
├── features/
│   ├── chat/
│   │   ├── api/                # Feature-specific API calls (uses shared http client)
│   │   ├── components/         # UI local to this feature only
│   │   ├── hooks/
│   │   ├── store/               # Feature-local state (if not global)
│   │   ├── types/
│   │   └── index.ts             # Public surface of the feature — the ONLY import path others may use
│   ├── canvas/                  # Same internal structure
│   ├── home/
│   └── settings/
├── shared/
│   ├── components/              # Cross-feature UI (e.g. EmptyState, ErrorBoundary, Modal)
│   ├── hooks/
│   ├── utils/
│   └── types/
├── lib/
│   ├── http/                    # API client setup (Section 5)
│   ├── i18n/                    # i18n bootstrap (full implementation in a later phase)
│   └── config/                  # env variable access, feature flags
└── styles/
```

### Boundary rule (enforced by tooling, not convention)

- A file inside `features/chat` may **never** import directly from `features/canvas/components/...` or any other feature's internals.
- Cross-feature sharing must go through `shared/`, or through the importing feature only reading the other feature's `index.ts` public surface if a legitimate composition need exists (rare — flag it for review if it happens).
- Install and configure `eslint-plugin-boundaries` to make this a build-breaking violation, not a code-review suggestion:

```bash
pnpm add -D eslint-plugin-boundaries
```

```json
// .eslintrc.json (addition)
{
  "plugins": ["boundaries"],
  "settings": {
    "boundaries/elements": [
      { "type": "feature", "pattern": "src/features/*" },
      { "type": "shared", "pattern": "src/shared/*" },
      { "type": "design-system", "pattern": "src/design-system/*" },
      { "type": "app", "pattern": "src/app/*" }
    ]
  },
  "rules": {
    "boundaries/element-types": [
      "error",
      {
        "default": "disallow",
        "rules": [
          { "from": "feature", "allow": ["shared", "design-system"] },
          { "from": "shared", "allow": ["design-system"] },
          { "from": "app", "allow": ["feature", "shared", "design-system"] }
        ]
      }
    ]
  }
}
```

This makes cross-feature leakage a CI failure, not a matter of discipline.

---

## 3. Routing

- Choose a router: **React Router v6+** (if Vite) is the default recommendation unless Next.js is confirmed.
- Route definitions live centrally in `app/router/`, not scattered inside features:

```tsx
// src/app/router/routes.tsx
import { lazy } from 'react';

const ChatPage = lazy(() => import('@/features/chat'));
const CanvasPage = lazy(() => import('@/features/canvas'));
const HomePage = lazy(() => import('@/features/home'));
const SettingsPage = lazy(() => import('@/features/settings'));

export const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/chat', element: <ChatPage /> },
  { path: '/canvas', element: <CanvasPage /> },
  { path: '/settings', element: <SettingsPage /> },
];
```

- **Code-splitting is mandatory per feature** via `React.lazy` + `Suspense`. Each top-level feature must be its own JS chunk — no feature should be bundled into the initial load if the user hasn't navigated to it yet.
- Every route must be wrapped with a `Suspense` boundary with a defined fallback (from `shared/components`), and an `ErrorBoundary` (Section 6) at the router level to catch feature crashes without white-screening the whole app.
- Define a naming convention for route params and query strings now (e.g., `camelCase` for query params) so features don't invent their own.

---

## 4. State Management

Three categories of state must be explicitly separated — mixing them is the most common cause of unmaintainable frontend codebases:

| State type                                                | Examples                                                 | Tool                                                                                     |
| --------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Server state** (data owned by backend/API)              | messages, canvas documents, user settings                | React Query (`@tanstack/react-query`) — never store server data in a global client store |
| **Global client state** (UI state shared across features) | active theme, sidebar collapsed/expanded, current locale | Zustand (lightweight, no boilerplate)                                                    |
| **Local component state**                                 | input value, hover state, open/closed toggle             | `useState` / `useReducer` — never promoted to global unless proven necessary             |

Install:

```bash
pnpm add @tanstack/react-query zustand
```

### Rules

- **Never** duplicate server state into a Zustand/Context store "for convenience." React Query's cache is the single source of truth for server data; components read directly from `useQuery`.
- Global stores (Zustand) must be split by concern (`useUiStore`, `useSettingsStore`) — one giant store with everything in it is forbidden.
- Document this decision in `shared/README.md` so it isn't re-decided per feature.

---

## 5. Data Fetching & API Layer

Even before the mock API (a later phase) exists, the **abstraction layer** must be built now so features never call `fetch`/`axios` directly.

```
src/lib/http/
├── client.ts        # Base fetch wrapper (headers, base URL, auth token injection)
├── endpoints.ts      # Central map of API endpoint paths
└── errors.ts         # Typed error shapes, normalizeError()
```

```ts
// src/lib/http/client.ts
export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw await normalizeError(res);
  }
  return res.json() as Promise<T>;
}
```

- Every feature's `api/` folder contains **thin wrappers** around `apiClient`, typed with the feature's own types — never raw fetch calls inside components or hooks.
- React Query hooks per feature live in `features/<name>/hooks/use<Something>.ts`, wrapping the api call:

```ts
// src/features/chat/hooks/useMessages.ts
export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
  });
}
```

- This indirection means swapping the mock API for a real backend later (a future phase) touches only `lib/http` and each feature's `api/` folder — never components.

---

## 6. Loading, Error, and Empty States (Standardized)

A recurring architectural failure in AI-assisted and rushed frontend projects is that every feature invents its own loading spinner and error message. This must be standardized **now**, in `shared/components/`:

- `<LoadingState />` — a single, design-system-driven skeleton/spinner component. No feature may build a custom one.
- `<ErrorState error={...} retry={...} />` — standardized error display with a retry action.
- `<EmptyState icon={...} title={...} description={...} />` — for empty lists/conversations/canvases.
- `<ErrorBoundary>` — a React error boundary wrapping each route (Section 3), logging the error and rendering `<ErrorState>` instead of crashing the app.

### Rule

Every React Query `useQuery`/`useMutation` consumption in a component must explicitly branch on `isLoading`, `isError`, and empty-data cases using these shared components — a component that silently renders nothing during loading or on error is a review-blocking defect.

---

## 7. Environment Configuration

- All environment variables go through `src/lib/config/env.ts`, validated at startup (fail fast if a required var is missing) — never read `import.meta.env.X` directly inside feature code.

```ts
// src/lib/config/env.ts
function required(key: string): string {
  const value = import.meta.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  environment: import.meta.env.MODE,
} as const;
```

- `.env.example` must be committed with all required keys (empty values) so any new developer/agent knows exactly what to configure.
- `.env` (with real values) must be gitignored — verify this was already set in Phase 0.

---

## 8. Layout Shell Architecture (Sidebar / Chat / Canvas / Home / Settings)

Since the product is structured around a persistent shell (sidebar) with swappable content areas, define this explicitly:

```
app/layout/
├── AppShell.tsx       # Grid: Sidebar + main content outlet
├── Sidebar.tsx         # Navigation only — no feature logic inside
└── TopBar.tsx          # (if applicable)
```

- `AppShell` renders `<Outlet />` (React Router) for the active feature; it must have **zero knowledge** of what's inside chat/canvas/etc. — it only renders layout structure and navigation.
- Sidebar navigation items are data-driven (an array of `{ path, label, icon }`), not hardcoded JSX per item — this keeps it trivial to add a new section later without touching layout logic.
- Responsive behavior of the shell (sidebar collapse on mobile, breakpoints from Phase 1 tokens) is decided here, even though the actual wireframe/visual work happens in Phase 3 (Wireframe).

---

## 9. Performance Baseline Rules

- Lazy-load every feature (Section 3) — non-negotiable.
- No feature may import a heavy third-party library (charting, canvas engine, rich text editor, etc.) into a shared/global bundle — such libraries must be dynamically imported only within the feature that needs them.
- Images/assets go through a defined loading strategy (lazy loading, explicit width/height to avoid layout shift) — document this in `shared/README.md`.
- Bundle analysis tool must be added now so future regressions are caught early:

```bash
pnpm add -D rollup-plugin-visualizer
```

---

## 10. Documentation Deliverable: `ARCHITECTURE.md`

Produce a single `ARCHITECTURE.md` at the project root summarizing all binding decisions from this phase, so any future contributor (human or AI) can read one file instead of re-deriving these rules:

```markdown
# Architecture Decisions

## Routing

- React Router v6, centralized in app/router/, lazy-loaded per feature.

## State Management

- Server state: React Query only.
- Global client state: Zustand, split by concern.
- Local state: useState/useReducer.

## Data Fetching

- All API calls go through lib/http/client.ts — no raw fetch in components.

## Boundaries

- Features never import from other features' internals — shared/ only.
- Enforced via eslint-plugin-boundaries.

## Standard UI States

- LoadingState / ErrorState / EmptyState from shared/components — mandatory for every async view.

## Environment Config

- All env access through lib/config/env.ts, validated at startup.
```

---

## 11. End-of-Phase Checklist (QA-2)

- [ ] Finalized folder structure matches Section 2, committed with placeholder `index.ts` files per feature
- [ ] `eslint-plugin-boundaries` installed and configured; a deliberate cross-feature import test triggers a lint error
- [ ] Router set up with all four top-level routes (`/`, `/chat`, `/canvas`, `/settings`), each lazy-loaded
- [ ] Each route wrapped in `Suspense` + `ErrorBoundary`; verified by temporarily throwing an error inside one feature and confirming the app doesn't white-screen
- [ ] React Query and Zustand installed and configured (`QueryClientProvider` wired in `app/providers`)
- [ ] `lib/http/client.ts` built and used by at least one placeholder call (can hit a dummy endpoint or mock)
- [ ] `LoadingState`, `ErrorState`, `EmptyState` components exist in `shared/components` and use Phase 1 design tokens (no hardcoded styling)
- [ ] `lib/config/env.ts` validates required env vars at startup; app fails fast with a clear message if `.env` is misconfigured
- [ ] `.env.example` committed; `.env` confirmed gitignored
- [ ] `AppShell` + `Sidebar` render with data-driven nav items; sidebar has zero imports from any `features/*` internals
- [ ] Bundle visualizer configured; a baseline bundle report generated and reviewed for any unexpectedly large chunk
- [ ] `ARCHITECTURE.md` written and complete per Section 10
- [ ] Final commit: `docs(architecture): finalize frontend architecture decisions`

> Once this checklist is fully verified, QA-2 (review by project lead) is performed against this same checklist plus a manual test of navigating between all four placeholder routes. Upon approval, proceed to **Phase 3 (Showcase + Layout Wireframe)**.
