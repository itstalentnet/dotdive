---
layout: doc
title: ADR-0001 (Platform-006) — Renderer Framework Standardized on Vue 3
description: Official architecture decision establishing Vue 3 as the single-source-of-truth framework for @nons-dev/renderer.
version: 1.0.0
status: ACCEPTED
author: Architecture & Platform Team
created_at: 2026-07-26
updated_at: 2026-07-26
tags:
  - Architecture
  - ADR
  - Renderer
  - Vue3
  - Frontend
---

# ADR-0001 / ADR-Platform-006: Renderer Framework Standardized on Vue 3

> **Status:** Accepted — 2026-07-26  
> **Scope:** `@nons-dev/renderer`, `@nons-dev/ui-schema`, `@nons-dev/uikit`, `admin-panel`, `ui-builder`

---

## Context

During the full-lifecycle architecture audit conducted on July 26, 2026 (see: [https://dotdive.ir/docs/team/platform/Architecture](https://dotdive.ir/docs/team/platform/Architecture)), a critical architectural mismatch was identified in the platform UI stack:

1. **Initial Implementation Mismatch**: `@nons-dev/renderer` (`renderer/`) was initially created as a React 18/19 component package (`React.FC`, `React.ComponentType`, `react-dom`).
2. **Ecosystem Reality**: Both `@nons-dev/uikit` (`@nons-dev/uikit` v0.5.0) and the primary consumer project (`admin-panel`) are built natively with **Vue 3** (`vue ^3.5.0`).
3. **Parallel Renderer Workaround**: Because `@nons-dev/renderer` was React-only, a parallel, undocumented Vue renderer (`uikit/core/renderer/SchemaRenderer.vue`) was built inside `@nons-dev/uikit` using legacy, non-standard `SchemaNode` types (`uikit/core/types/schema.ts`).
4. **Drift & Fragmentation**: This framework mismatch caused code duplication, broken feature parity (e.g. `SchemaRenderer.vue` missing `visibleIf` condition evaluation and `repeat` array loop support), and prevented `@nons-dev/renderer` from serving as the single source of rendering truth.

---

## Decision

**Vue 3 is officially established as the sole and single-source-of-truth framework for `@nons-dev/renderer` going forward.**

All component-layer development, registry interfaces, error boundaries, and exported entry components in `@nons-dev/renderer` will natively target Vue 3.

---

## Consequences

- **Component Layer Migration**: The component rendering layer of `@nons-dev/renderer` (`<Renderer />`, `NodeRenderer`, `NodeErrorBoundary`, `UnknownComponent`, `registry`) will be rebuilt natively in Vue 3 in **Phase 3** of the roadmap.
- **Pure Logic Preservation**: The core resolution logic (`renderer/src/resolver/resolve.ts`) is 100% pure TypeScript with **zero React/DOM dependencies**. It is confirmed to be fully framework-agnostic and will be reused as-is without breaking changes.
- **UIKit Parallel Code Deprecation**: The internal `SchemaRenderer.vue` and legacy `SchemaNode` types inside `@nons-dev/uikit` are officially **deprecated**. They will be removed in **Phase 1** (uikit cleanup) once the Vue 3 build of `@nons-dev/renderer` is released.
- **Single Source of Truth**: All consumer projects (`admin-panel`, future apps) and the UI Builder preview canvas must consume `@nons-dev/renderer` for schema rendering.
- **Documentation Standard**: All team members and onboarding documentation in `dotdive` must reference the Vue 3 Renderer contract.

---

## Alternatives Considered

1. **Keep React Renderer and add a Vue wrapper/adapter**:
   - _Rejected_: Introduces permanent runtime overhead, double-vnode translation complexity, and extra bundle weight without matching the native Vue ecosystem of `uikit` and `admin-panel`.
2. **Support both React and Vue as dual targets**:
   - _Rejected_: Doubles maintenance cost and test surface with no active React consumer project in the workspace.

---

## References & Related Documentation

- [Full Lifecycle Architecture Audit](https://dotdive.ir/docs/team/platform/Architecture)
- [ADR Impact List](https://dotdive.ir/docs/team/platform/ADR/0001-impact-list)
- [Dotdive Frontend Onboarding Guide](https://dotdive.ir/docs/team/frontend/get-started)
