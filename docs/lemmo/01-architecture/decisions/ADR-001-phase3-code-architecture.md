# ADR-001 — Phase-3 code architecture (grouped)

- **Date:** 2026-09-12
- **Status:** `SUPERSEDED` (2026-09-16)

> ⚠️ **این تصمیم معماری منسوخ شده است (SUPERSEDED):**  
> این سند مربوط به معماری قدیمی SPA در فاز ۳ است. مدل ۵ لایه‌ای شامل `features/` و روتینگ React Router v6 به طور کامل منسوخ شده و با معماری نهایی **Next.js Workspace** جایگزین شده است.  
> برای دسترسی به معماری معتبر و قفل‌شده به اسناد زیر مراجعه کنید:  
> - [معماری فرانت‌اند Workspace — Next.js (DOC-FE-001)](../../02-frontend/workspace-architecture.md)  
> - [تصمیمات کلیدی معماری: سیستم پلاگین و SDK (DOC-FE-002)](../../02-frontend/workspace-decisions.md)

## Context

Seven long-open code-architecture questions blocked real feature work. None of
them are answerable from the reference product (higgsfield.ai), so the team
settled them in `AGENTS.md` §§1,6–11 (consolidated in this ADR). The site audit
DID confirm the responsive (mobile-first + container queries) and a11y baseline
details — recorded in `AGENTS.md` §3 + the QA-1 reference audit
(`qa1-phase-1-review-approval.md` §11), which this ADR depends on.

## Decision

Adopt the Phase-3 architecture decisions 1–6 verbatim:

1. **Component hierarchy** — five layers (`app / design-system / shared /
features`). Pure primitives (Button, Input, Text, Icon) live in
   `design-system/primitives/` (Phase-1 reservation, kept); reusable composites
   and layout in `shared/ui/patterns` + `shared/ui/layout` — the old
   `shared/components/` was folded into `patterns` (one path, no parallel
   homes); 250-line component cap; primitives/patterns never import from
   features. (AGENTS.md §1)
2. **Component API conventions** — native-props inheritance, no public `state`
   prop, mandatory `forwardRef`, `asChild`, discriminated-union variants.
   Canonical example in `design-system/primitives/README.md`. (AGENTS.md §6)
3. **Naming conventions** — dot-notation role files, kebab-case folders,
   PascalCase components, no `I` prefix, no nested barrels. (AGENTS.md §7)
4. **Shared admission** — Rule of Three + 6 criteria, tech-lead approver only.
   Destination: composites → `shared/ui/patterns`; pure primitive →
   `design-system/primitives/`. (`shared/README.md` "Admission", AGENTS.md §8)
5. **Page/layout ownership** — shell in `app/`, layout primitives in
   `shared/ui/layout/`, pages in `features/<x>/pages/`. (`app/README.md`,
   AGENTS.md §9)
6. **Feature growth** — flat start → domain-named split on trigger (> 5
   components or ≥ 2 distinct concerns). (AGENTS.md §10)

Reference-confirmed sub-decisions (from the higgsfield.ai audit, recorded in `AGENTS.md` §3):

- **Responsive:** mobile-first only (`min-width`); semantic breakpoints
  `mobile 20 / tablet 48 / desktop 80 / wide 120rem` align with the 7-tier
  ladder `20/40/48/64/80/120/158rem`; container queries allowed. This locks the
  official Phase-1/2 token values: `breakpoints.ts`/`tokens.css` already hold
  them (desktop=`xl`, wide=`2xl`) — the older 1024/1440px reading is deprecated;
  any new breakpoint value requires an ADR. (AGENTS.md §3)
- **Accessibility:** adopt Radix-style headless primitives so focus-trap/ESC/
  tab-order are inherited rather than hand-rolled; `:focus-visible` uses the
  accent (lime) color; site baseline is 26 aria patterns + focus-visible rules.

## Consequences

- `AGENTS.md`, `shared/`, `app/`, and this file now agree; none of these
  decisions may be reopened in chat — only via a new ADR.
- Single canonical home for UI: primitives in `design-system/primitives/`,
  composites/layout in `shared/ui/` — `shared/components/` no longer exists.
- First Phase-3 PR adds the folder skeleton, one canonical primitive (Button),
  and the new dev dependencies (ADR-002).
