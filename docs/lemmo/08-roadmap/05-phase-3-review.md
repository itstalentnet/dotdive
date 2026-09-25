# Phase 3 — Step 0 Review: Document Consistency (STOP REPORT)

- **Date:** 2026-09-12
- **Reviewer:** opencode / big-pickle
- **Task:** `docs/road/phase-3-showcase+layout-wireframe.md` — Step 0 (Mandatory, Before Any Coding)
- **Outcome:** ⛔ **STOP** was raised (items B1–B4 below), then **RESOLVED by the team**:
  the decisions below were recorded in the documents on 2026-09-12 → **Step 1/2 permitted.**

---

## 1. What was verified and is CONSISTENT ✓

| Area                                          | Sources cross-checked                                                                                | Result                                                                                                                                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breakpoints ladder + semantic aliases         | `tokens/breakpoints.ts` · `tokens.css` (§bp, §bp-semantic) · AGENTS §3 · ADR-001                     | 7-tier `20/40/48/64/80/120/158rem`; semantic `mobile=20 / tablet=48 / desktop=80 / wide=120rem` — identical everywhere                                                                      |
| Colors (dark-only theme)                      | `tokens/colors.ts` · `semantic-colors.ts` · `tokens.css` · `docs/color.md` §Theme §1–4 · `AGENTS` §3 | Dark-only is the locked decision (`:root` ARE the dark tokens; no light theme exists — nothing to render “if present”). Status colors (danger/warning/success/info) AA-verified, consistent |
| Spacing / gap ladder                          | `tokens/spacing.ts` · `tokens.css` §space §gap                                                       | 4px ladder, values match exactly                                                                                                                                                            |
| Radius (raw + 7 semantic aliases)             | `tokens/radius.ts` · `tokens.css` §radius + §semantic radius                                         | `{2,4,6,8,10,12,16,20,24}+full`; aliases `control/card/badge/featured-card/media/media-lg/pill` ported                                                                                      |
| Shadows & elevation                           | `tokens/shadow.ts` · `tokens.css` §elevation                                                         | card-base/featured, button-brand, gloss-inset, glow-breathe present                                                                                                                         |
| Stroke widths (raw + 4 semantic)              | `tokens.css` §stroke + §semantic strokes                                                             | `0/.5/1/1.5/2px`; `rim/border/border-gradient/divider` ported                                                                                                                               |
| Gradient set + 4 pill gradients               | `tokens.css` §gradients                                                                              | All document shapes present (incl. pill lime/blue/ultraviolet/pink)                                                                                                                         |
| Type scale (display → small sizes + tracking) | `tokens/typography.ts` · `tokens.css` §type · `docs/typography.md`                                   | h1 `-1.2px`, h2/h3 `-2%`, h4 `-1%`, body loose `0.00625rem`, caption `0`, small `-0.3px` — after ADR-003 alignment, docs now equal tokens                                                   |
| Icons                                         | AGENTS §3 · `docs/iconography.md` · qa1 §11.2 · `package.json`                                       | `synthline` only; ladder `12                                                                                                                                                                | 16  | 20  | 24  | 28`(no 32); stroke`1.5` |
| Logo (single-version)                         | `docs/logo.md` §3 (B5) · `public/logo.svg` exists                                                    | Icon-only lime confirmed; no wordmark to fabricate                                                                                                                                          |
| Fonts & language switching                    | `fonts/fonts.css` · `typography-base.css` · `docs/typography.md` §1–4                                | Satoshi/Oddval/Morabba/IRANSansX (100–1000 after ADR-003); `[lang]`-driven, `data-numeric` rule                                                                                             |
| CSS token completeness                        | qa1 §11.4 vs actual `tokens.css`                                                                     | QA-1’s “missing in CSS” list (11 gap / 7 radius-sem / 3 bp-sem / 4 stroke-sem / 4 pill / 7 layout-size) is now **fully ported** — resolved                                                  |
| Auth/Workspace E2E plan                       | ADR-002 §                                                                                            | Recorded (login → session → workspace switch → logout)                                                                                                                                      |

## 2. What is INCONSISTENT / INCOMPLETE — blockers (Stop Rule condition met)

Per Step 0: _“Any ADR or reference file … mentioned in the documents but has not yet been created.”_
Both the Phase-3 task and the project docs reference files that **do not exist** (verified on disk +
`git log --all` — never committed):

### B1. `frontend/todo.md` — the “Component Architecture Decision Document”

- **Cited by:** AGENTS §1 (`todo.md §1`), §6–§11 (`todo.md §2..§7`), ADR-001, ADR-003
  (`frontend/todo.md` as locked-decisions source), and this task’s Step 0
  (“Component Architecture Decision Document … the seven items … Check/Review Findings”).
- **State:** file absent; last git content regarding decisions lives in AGENTS + ADR-001/002.
- **Impact:** the primary decisions document is missing → cannot satisfy “exactly one unambiguous value
  in the documents”.

### B2. “Auth and Workspace Architecture Decision Document”

- **Cited by:** Phase-3 task Step 0 (mandatory reading list).
- **State:** no such file/ADR exists; only ADR-002 mentions the Auth/Workspace E2E path.
- **Impact:** a required source of truth for layout/wireframe decisions does not exist.

### B3. `Frontend-Architecture-Review.md`

- **Cited by:** AGENTS §5 (Phase-1/2 artifact list) and `tokens.css` header comment
  (“frontend review decision, Frontend-Architecture-Review.md item 3”).
- **State:** file absent.
- **Impact:** cited artifact missing; the QA-2 checklist itself exists (phase-2 doc §11).

### B4. QA-1 sign-off on B1–B7 + status colors

- **Cited by:** `qa1-phase-1-review-approval.md` line 216: items B1–B7 + status colors are
  “resolved **pending final human designer sign-off**”.
- **State:** no written sign-off exists in any document (chat approval for tokens-as-truth was given
  verbally in ADR-003 decision; it is not recorded as a designer sign-off in QA-1).
- **Impact:** ⚠️ items are “resolved pending sign-off”, not “resolved+approved”. Step 0 requires them
  to be final.

### B5. Minor path staleness (non-blocking) — **resolved 2026-09-12, Phase 3 build step**

- ADR-003 names the phase docs under `doc/road/`; they now live at `docs/road/` — ADR-003 updated
  (2026-09-12).
- QA-1 §8 (line 46) still says `tokens.css` misses families that were already ported (§11.4) — the
  checklist row is now annotated as resolved (UPDATE note added, 2026-09-12).

## 3. Team resolution (2026-09-12) — recorded in the documents

1. **B1** — the `todo.md` references were migrated to `docs/decisions/ADR-001` (AGENTS §0/§1/§6–12,
   ADR-001, READMEs, phase banners updated). `todo.md` is dropped as a source.
2. **B2** — Auth/Workspace architecture is **deferred to Phase 8**, pinned here only via its E2E
   path: ADR-002 (login → session restore → workspace switch → logout) + AGENTS §12. The Phase-3
   reading-list item is satisfied by ADR-002.
3. **B3** — citations of `Frontend-Architecture-Review.md` were rewritten to `ARCHITECTURE.md`
   (AGENTS §5, `tokens.css` header).
4. **B4** — the B1–B7 + status-colors designer sign-off is recorded in `qa1-phase-1-review-approval.md`
   §12 (2026-09-12).

Per the Stop Rule, permission is granted to proceed to Step 1 (Showcase), Step 2 (Wireframe), Step 3,
plus the ADR-001 commitment (first Phase-3 PR adds `design-system/primitives` structure + one
canonical primitive `Button` with tests).
