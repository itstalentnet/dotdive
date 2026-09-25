---
layout: doc
title: ADR-0001 Impact List — React to Vue 3 Migration
description: Complete catalog of files, components, and package dependencies affected by standardizing @nons-dev/renderer on Vue 3 per ADR-0001.
version: 1.0.0
status: ACCEPTED
author: Platform Team
created_at: 2026-07-26
updated_at: 2026-07-26
tags:
  - Architecture
  - ImpactList
  - Renderer
  - Migration
---

# ADR-0001 Impact List: React to Vue 3 Migration

This document catalogs all files, packages, and configurations across the workspace affected by the decision to standardize `@nons-dev/renderer` on Vue 3 per [ADR-Platform-006 / ADR-0001](https://dotdive.ir/docs/team/platform/ADR/ADR-Platform-006-renderer-framework-vue).

> **Rule:** No code is modified or removed in Phase 0. This list serves as the authoritative checklist for execution in upcoming roadmap phases.

---

## 1. `@nons-dev/renderer` (`renderer/`)

| File / Component                               | Reason Affected                                                                                       |        Target Roadmap Phase        |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :--------------------------------: |
| `renderer/package.json`                        | Peer dependency on `react`, `react-dom` and devDependencies on `@types/react`, `@vitejs/plugin-react` | **Phase 3** (Renderer Vue Rebuild) |
| `renderer/vitest.config.ts`                    | Vitest plugin `@vitejs/plugin-react` and `jsdom` setup                                                | **Phase 3** (Renderer Vue Rebuild) |
| `renderer/src/registry/index.ts`               | Uses `React.ComponentType<any>` for component registry types                                          | **Phase 3** (Renderer Vue Rebuild) |
| `renderer/src/components/ErrorBoundary.tsx`    | Implemented as a React Class Component                                                                | **Phase 3** (Renderer Vue Rebuild) |
| `renderer/src/components/UnknownComponent.tsx` | Implemented as a React Functional Component (`React.FC`)                                              | **Phase 3** (Renderer Vue Rebuild) |
| `renderer/src/components/NodeRenderer.tsx`     | Implemented as a React Functional Component (`React.FC`) rendering React JSX                          | **Phase 3** (Renderer Vue Rebuild) |
| `renderer/src/components/Renderer.tsx`         | Top-level entry component built with React (`React.FC`, `useMemo`)                                    | **Phase 3** (Renderer Vue Rebuild) |
| `renderer/tests/renderer.test.tsx`             | Test suite using `@testing-library/react` and React JSX                                               | **Phase 3** (Renderer Vue Rebuild) |
| `renderer/src/schema/types.ts`                 | Duplicates `PageSchema` / `RenderNode` types internally instead of importing `@nons-dev/ui-schema`    | **Phase 3** (Renderer Vue Rebuild) |

---

## 2. Framework-Agnostic Core Verification (`renderer/src/resolver/resolve.ts`)

| File                               | Status & Verification                                                                                                                                                    | Target Action                                                            |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| `renderer/src/resolver/resolve.ts` | **✅ Verified 100% Pure TypeScript**. Zero React/DOM imports. Resolves data bindings (`$data.x.y`), visibility conditions (`visibleIf`), and array repeaters (`repeat`). | **Keep As-Is (100% Reusable)** in Phase 3 under new Vue component layer. |

---

## 3. `@nons-dev/uikit` (`uikit/`)

| File / Component                         | Reason Affected                                                             |    Target Roadmap Phase     |
| :--------------------------------------- | :-------------------------------------------------------------------------- | :-------------------------: |
| `uikit/core/renderer/SchemaRenderer.vue` | Deprecated legacy Vue renderer using non-standard `SchemaNode` types        | **Phase 1** (UIKit Cleanup) |
| `uikit/core/types/schema.ts`             | Deprecated legacy `SchemaNode` types conflicting with `@nons-dev/ui-schema` | **Phase 1** (UIKit Cleanup) |
| `uikit/src/index.ts`                     | Re-exports `SchemaRenderer.vue`                                             | **Phase 1** (UIKit Cleanup) |

---

## 4. Consumer App (`admin-panel/`)

| File / Component                         | Reason Affected                                                  |        Target Roadmap Phase        |
| :--------------------------------------- | :--------------------------------------------------------------- | :--------------------------------: |
| `admin-panel/package.json`               | Uses relative file protocol `"@nons-dev/uikit": "file:../uikit"` |    **Phase 1** (Immediate Fix)     |
| `admin-panel/src/views/` / `src/engine/` | Imports legacy `SchemaRenderer` from `@nons-dev/uikit`           | **Phase 4** (Consumer Integration) |

---

## 5. UI Builder (`ui-builder/`)

| File / Component               | Reason Affected                                                                                                 |       Target Roadmap Phase        |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------- | :-------------------------------: |
| `ui-builder/` CLI & Generators | Needs E2E integration test validating generated schemas against `validatePageSchema` from `@nons-dev/ui-schema` | **Phase 4** (Builder Integration) |
