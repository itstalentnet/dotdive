| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Documentation Agent Rules & Operational Guide |
| **Title (FA)** | راهنمای عملیاتی و قوانین ایجنت‌های هوش مصنوعی در مخزن مستندات |
| **ID** | DOC-META-003 |
| **Category** | `architecture` |
| **Status** | `Active` |
| **Owner** | Core Architecture & Documentation Team |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Operational guide, zero-contradiction governance, STOP protocol, and repository standards for agents in lemmo-lab/docs. |
| **Summary (FA)** | راهنمای عملیاتی، قوانین عدم تضاد، پروتکل توقف و استانداردهای مخزن مستندات لیمو برای ایجنت‌های هوش مصنوعی. |
| **Tags** | `agents`, `docs`, `governance`, `ssot`, `zero-contradiction`, `stop-protocol`, `llms-txt`, `rules` |

---

# Documentation Agent Guide & Repository Rules

Compact operational instructions for AI agents and OpenCode sessions working in the `lemmo-lab/docs` repository.

> 📜 **Authoritative Rules & Governance:** For the official and binding Persian documentation governance, Zero-Contradiction policy, and STOP protocol, refer to [**`RULE.md`**](./RULE.md).

---

## 1. Repository Scope & Workflow Commands

This repository is purely the **Single Source of Truth (SSOT) documentation hub** for the Lemmo ecosystem. It contains architectural specifications, design system contracts, and roadmap deliverables. It is not an application package (no npm build or unit test suites reside here).

### Required Post-Edit Command
After adding, modifying, moving, or deleting any markdown document:
```bash
python3 scripts/generate-llms.py
```
- **What it does**: Scans all documentation directories, extracts the metadata header table, and regenerates root `llms.txt` per the [llmstxt.org](https://llmstxt.org/) standard.
- **Verification**: Ensure the command exits with code 0 and `llms.txt` reflects your changes without warnings.

---

## 2. Zero-Contradiction Policy & STOP Protocol

> **Golden Rule**: For every architectural rule, design token, or technical contract, there is **strictly ONE authoritative source of truth**. Recording competing or contradictory active decisions is strictly forbidden (enforced by [**`RULE.md`**](./RULE.md)).

### When Contradictions Appear: The STOP Protocol
If a user prompt, draft proposal, or existing file conflicts with approved architecture docs or live tokens:
1. **Never invent a third compromise.**
2. **Never commit conflicting decisions simultaneously.**
3. **STOP immediately** and emit an architecture conflict report:

```markdown
### ⚠️ STOP & Architecture Conflict Report

- **Authoritative Baseline:** [File path + exact quote/decision]
- **Conflicting Proposal / Input:** [File path or user prompt creating conflict]
- **Conflict Description:** [Why they clash and what divergence would occur]
- **Resolution Options:**
  1. Option 1: Supersede the baseline decision with explicit user approval (mark old as `SUPERSEDED`).
  2. Option 2: Preserve the baseline decision and reject/modify the new proposal.
- **Required Action:** Await user confirmation before proceeding with edits.
```

### Superseding Stale Decisions
When architecture evolves, never delete or silently rewrite historical ADRs without an explicit banner:
- Mark the superseded document status as `SUPERSEDED`.
- Add a top banner pointing directly to the replacement document (e.g., see [`architecture/decisions/ADR-001-phase3-code-architecture.md`](./architecture/decisions/ADR-001-phase3-code-architecture.md)).

---

## 3. Hierarchy of Truth (Precedence Order)

When evaluating facts across documents, higher levels strictly override lower levels:

1. **Live Code & Tokens**: CSS variables and token objects (`src/design-system/tokens/`, `src/styles/tokens.css`, `--lemmo-*`).
2. **Locked Core Architecture**:
   - [`frontend/workspace-architecture.md`](./frontend/workspace-architecture.md) (`DOC-FE-001` — Next.js workspace structure & boundaries).
   - [`frontend/workspace-decisions.md`](./frontend/workspace-decisions.md) (`DOC-FE-002` — Plugin system, SDK gateway, Zero-Leakage mock architecture).
   - [`architecture/AGENTS.md`](./architecture/AGENTS.md) (`DOC-ARCH-001` — Frontend engineering constraints & import boundaries).
3. **Domain & Module Specs**: `modules/`, `design-system/`, `branding/`, `backend/`, `devops/`.
4. **Historical Roadmap Deliverables**: `roadmap/` (past phase reviews and step deliverables are historical records).

---

## 4. Architectural Anchors (Agent Pitfalls to Avoid)

Agents working on documentation or cross-referencing code must know these non-obvious facts:

- **App Framework**: The frontend is a Next.js App Router Workspace (`src/app/(workspace)`), **NOT** the legacy SPA / React Router v6 (the old 5-layer architecture in ADR-001 is obsolete).
- **Strict Dependency Direction**:
  `app` → `modules` → `tool-engine` → `sdk` → `backend`
  - `shared/` is purely reusable UI/utilities with **zero domain knowledge** (no chat/canvas/tool awareness).
  - Cross-feature imports between modules are banned; cross-cutting flows route through `shared/` or `app/`.
- **Tool Engine as SSOT**: `modules/tool-engine` owns tool schemas and registry. Chat and Canvas are presentation surfaces consuming Tool Manifests (JSON schema), not owners of tool logic.
- **SDK Gateway**: `@/sdk` is the **only** permitted contact point with backend. Direct `fetch` or `axios` in pages, components, or hooks is strictly prohibited.
- **Zero-Leakage Mock Architecture**:
  - Components and modules never import mocks directly.
  - `@/sdk` exposes the identical `SdkClient` interface for both mock and live backends.
  - Toggled solely via `NEXT_PUBLIC_API_MODE="mock"|"live"` inside `@/sdk`.
- **Global Job Manager**: Central Zustand store (`job-store.ts`) subscribed via WebSocket/SSE. Surfaces (`chat`, `canvas`, `assets`) communicate asynchronously by subscribing to `jobId`.
- **Design System Tokens**:
  - Always prefixed with `--lemmo-*`.
  - Dark-only theme (no light mode).
  - **Icon ladder**: `12 | 16 | 20 | 24 | 28` (XL is 28px; 32px was intentionally dropped per ADR-003).
  - **Status colors**: `--lemmo-status-*` (`danger`, `warning`, `success`, `info`) exist in tokens.

---

## 5. Document Authoring Standards

### Mandatory Bilingual Metadata Header
Every `.md` file must start at line 1 with the metadata table (copy from [`templates/DOCUMENT_TEMPLATE.md`](./templates/DOCUMENT_TEMPLATE.md)):
```markdown
| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | [English Title] |
| **Title (FA)** | [عنوان فارسی] |
| **ID** | DOC-[CATEGORY]-[NUM] (e.g. DOC-FE-003, DOC-ARCH-004) |
| **Category** | `architecture` | `frontend` | `backend` | `design-system` | `branding` | `devops` | `roadmap` | `modules` |
| **Status** | `Draft` | `Active` | `Approved` | `SUPERSEDED` | `Deprecated` |
| **Owner** | [Team / @username] |
| **Last Updated** | YYYY-MM-DD |
| **Summary (EN)** | [1-2 English sentences for llms.txt index] |
| **Summary (FA)** | [1-2 Persian sentences] |
| **Tags** | `tag1`, `tag2`, `tag3` |
```
*Note*: `Title (EN)`, `Category`, and `Summary (EN)` are parsed by `scripts/generate-llms.py`.

### Folder Governance & Naming
- Place files **only** in one of the 8 canonical directories:
  `architecture/`, `design-system/`, `branding/`, `frontend/`, `backend/`, `devops/`, `modules/`, `roadmap/`.
- File names must strictly follow `kebab-case.md`.
- Never create arbitrary top-level directories.

### Language & Formatting
- **Narrative Body**: Fluent professional technical Persian (فارسی سلیس و حرفه‌ای مهندسی) for core documentation, with English technical terms.
- **In-Code Comments & Captions**: All code snippets, in-code comments, JSDoc/TSDoc annotations, variable names, and captions inside code MUST strictly be written in clear, professional English. Non-English (Persian) comments in `.ts`, `.tsx`, `.js`, or `.css` files are strictly banned.
- **Metadata & Technical Terms**: English metadata, code tokens, and system identifiers.
- **Links**: Always use relative markdown links (`[Title](../folder/file.md)`), never local filesystem paths.
- **Code Blocks**: Always designate the language tag (`typescript`, `bash`, `json`, `mermaid`).

---

## 6. Pre-Edit & Post-Edit Checklists

### Before Creating or Modifying Documents:
1. Search existing docs using `grep_search` or `find_by_name` to prevent duplicate files.
2. Confirm the proposed change complies with the [Hierarchy of Truth](#3-hierarchy-of-truth-precedence-order).
3. Select the appropriate canonical directory and format the filename in `kebab-case.md`.

### After Creating or Modifying Documents:
1. Run `python3 scripts/generate-llms.py` to rebuild `llms.txt`.
2. Verify all relative links are intact.
3. Update category index in the relevant directory's `README.md` and root [`README.md`](./README.md) if a new document was created.
