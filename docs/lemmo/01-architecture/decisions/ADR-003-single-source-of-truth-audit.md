# ADR-003 — Single source of truth: audit & resolution

- **Date:** 2026-09-12
- **Status:** Accepted

## Context

A repository-wide audit found decisions documented in **two places with different
values** in three live design-system docs and in three historical phase
deliverables (`docs/road/phase-*`). Per AGENTS.md §0 the resolution was not decided
unilaterally: the team was asked, and confirmed that **token code is authoritative**
for values; historical phase docs are **superseded**.

## Decision

1. **Tokens are the single truth for values** — `src/design-system/tokens/*.ts` +
   `src/styles/tokens.css` (and `src/design-system/fonts/fonts.css` for `@font-face`).
   Design-system docs were corrected to match the tokens, no token was changed:

   - **H1 letter-spacing** = `-1.2px` (track `5xl`), not `-2%` — fixed in `typography.md` §7.
   - **body / bodyLarge letter-spacing** = `0.00625rem` (track-loose), not `0` — fixed in `typography.md` §7.
   - **caption** letter-spacing = `0`; **small (text-xxs)** = `-0.3px` — stated explicitly in `typography.md` §7.
   - **Icon ladder** = `12 | 16 | 20 | 24 | 28` (all five are valid sizes; `12` is the
     ultra-compact inline size, `32` stays dropped) — fixed in `iconography.md` §3.3 and `STYLEGUIDE.md` §4.
   - **IRANSansX weight range** = `100–1000` (matches `fonts.css`), not `100–900` — fixed in `typography.md` §1.

2. **Historical phase docs are SUPERSEDED, not edited** — `docs/road/phase-0`,
   `phase-1 design-system-documentation`, and `phase-2-frontend-architecture` carry a
   banner at the top pointing at the authoritative sources. Their stale values
   (breakpoints `0/768/1024/1440px`, old type scale incl. `h3 = 1.5rem/600`, icon
   ladder with `32px`, `shared/components/` path) must never be copied.

3. **No token value was changed** during this audit; only documentation was brought
   into alignment.

## Consequences

- Docs and tokens now agree; AGENTS.md §0 (golden rule) governs future contradictions:
  STOP → ask the team in a short document → lock the authoritative source → correct.
- Reviewers may reject PRs that use any value variant recorded here as "alternative".
- Historical phase docs remain as the phase record, clearly labeled, in case the team
  wants provenance.
