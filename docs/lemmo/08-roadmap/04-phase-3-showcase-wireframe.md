# Phase 3 Task — Showcase + Layout Wireframe

### Execution Document for the Developer

> **Rule of this document:** No value, number, color, size, sample filename, or hypothetical example has been written in this task and none should be used during execution either. The only source of truth for the project is the existing documents (Phase 0, Phase 1, Phase 2, Auth/Workspace Decision Document, and Component Architecture Decision Document). Any value that is required must be read directly from those documents — not from this task, memory, or the developer’s assumptions.

---

## Step 0 — Document Consistency Review (Mandatory, Before Any Coding)

Before starting any work in this phase, the developer must review all of the following documents together:

- Phase 0 document (Tooling & Governance)
- Phase 1 document (Design System Documentation) + QA-1 Report
- Phase 2 document (Frontend Architecture) + QA-2 Checklist
- Auth and Workspace Architecture Decision Document
- Component Architecture Decision Document (the seven items covering component hierarchy, API, naming, shared admission, page ownership, folder growth, form/test) together with the Check/Review Findings sections at the end of that document

### Exact Task in This Step

For every value that is going to be used in the Showcase or Wireframe (color, font, type scale, spacing, radius, breakpoint, folder structure, naming, component placement), the developer must ensure that there is **exactly one specific and unambiguous value** in the documents, with neither two different values across two documents nor a value that is merely an “example/proposal” that has not yet been finalized.

In particular, the following items, which were previously flagged as contradictory or unresolved during earlier reviews, must have their status confirmed in this step:

- The physical location and responsibility of the primitives folder (conflict between the Phase 1 document and the Component Architecture document — item R1)
- Breakpoint values (inconsistency between the Phase 2 document and the Component Architecture document)
- Any item that was previously marked with ⚠️ (“needs clarification”) or “open point for meeting” in previous checklists and still has no final decision
- Any ADR or reference file (such as `AGENTS.md`, `docs/decisions/ADR-*`) that is mentioned in the documents but has not yet been created or completed

### Stop Rule

If **even one** contradiction, ambiguity, or non-finalized value is found during this review:

1. The developer **stops** and writes no code or file for Phase 3.
2. The exact list of contradictory/incomplete items — with precise references to the document name and relevant section on each side of the contradiction — is reported to the team/project owner.
3. The developer does **not** decide which value is correct; the decision must be made by the team and the original documents must be updated uniformly and finalized.
4. Only after receiving written confirmation that all documents are integrated and free of contradictions is permission granted to start Step 1.

**This step cannot be skipped or compressed, even if the contradictions appear minor.**

---

## Step 1 — Build Showcase (Visual Proof of the Design System)

### Goal

Build a page/section in the project that live-renders every documented visual element of the design system, so that its implementation can be visually verified against the documentation.

### Showcase Scope

The Showcase must cover all of the following categories — as defined in the Phase 1 documents — without exception:

- All colors (including light and dark modes, if present)
- Typography, including both languages (Persian and English) and automatic font-switching behavior
- Number display within Persian text (to verify the documented behavior)
- The entire Type Scale
- Spacing scale
- Radius and Shadow
- All icons used, or at minimum an example that demonstrates the selected set and permitted sizes
- Logo (all documented versions)
- Standard status components (Loading/Error/Empty) in different states
- If initial implementation of primitives exists according to the Component Architecture document: every primitive in all documented variants and states (default, disabled, loading, etc.)

### Execution Rule

- No value is hardcoded directly in the Showcase code. Every Showcase element must read its value directly from the central token/configuration files, rather than from a number entered by the developer while building the Showcase.
- If a value required to render a section of the Showcase cannot be found in the token files (because it has not yet been documented), this itself is an incomplete item and, according to the Step 0 rule, execution must stop and it must be reported — no temporary/hypothetical value may be used as a replacement.

---

## Step 2 — Layout Wireframe (Mobile and Desktop)

### Goal

Build the overall structure of the project’s main pages (main app shell + each product section) using simple shapes (neutral blocks, without real content, without final colors/typography), so that layout and breakpoints can be approved before entering the visual-detail stage.

### Wireframe Scope

- Main app shell (structural sidebar/navigation area + content area) according to the layered ownership documented in the Component Architecture document
- Overall structure of each product section (chat, canvas, home page, settings) — only the general arrangement of page areas, not final components
- Layout behavior at **all** breakpoints documented in the documents — no breakpoint may be added or ignored

### Execution Rule

- At this stage, no final color, final font, real icon, or real content is used — only neutral blocks to demonstrate spatial proportion and layout.
- All breakpoints used must be exactly the values recorded in the relevant document (after integration in Step 0).
- Any new structural decision made while building the Wireframe (for example, how the sidebar collapses on mobile) must not remain only in the code; it must be recorded in the relevant architecture/AGENTS document (according to Step 3).

---

## Step 3 — Documentation Updates

Any new decision or point discovered or made while performing Step 1 or Step 2 (whether a new value, a layout behavior, or an exception) must be written immediately in the relevant reference document, rather than remaining only in the code or in the developer’s mind. The project has no source of truth other than the documents; code that implements a decision that is not documented anywhere is considered an undocumented and invalid decision from the perspective of this project.

---

## Phase 3 Completion Checklist (QA-3)

- [ ] Step 0 (document consistency review) has been fully completed and its result (confirmation of consistency, or report of contradictions and their resolution) has been documented
- [ ] All items previously marked with ⚠️ or “open point” now have a definitive decision in the documents (or have been explicitly deferred to a later phase, rather than being ignored)
- [ ] The Showcase covers all categories listed in Step 1, without exception
- [ ] There are no hardcoded/hypothetical values in the Showcase code; all values are read directly from token files
- [ ] The Showcase has been visually reviewed by the project owner/designer and approved against the Phase 1 documents
- [ ] The Wireframe covers the main shell and all four product sections
- [ ] The Wireframe has been tested and reviewed at all documented breakpoints
- [ ] The Wireframe contains only neutral blocks — without real content or final styling
- [ ] Any new structural decision from Step 2 has been recorded in the relevant reference document (not only in the code)
- [ ] The final commit for this phase has been created according to the documented naming convention

> After fully completing this checklist, QA-3 will be performed by the project owner. Only after QA-3 approval is entry into the next phase (i18n) permitted.
