| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | UI/UX Design System Guidelines: Direction, Layout, Responsive & Interaction Principles |
| **Title (FA)** | راهنمای جامع تعاملی و چیدمان: اصول جهت‌بندی (RTL/LTR)، طراحی واکنش‌گرا و سلسله‌مراتب اکشن‌ها |
| **ID** | DOC-DS-005 |
| **Category** | `design-system` |
| **Status** | `Active` |
| **Owner** | Design System & UX Team |
| **Last Updated** | 2026-09-17 |
| **Summary (EN)** | Comprehensive framework for logical layout, Start/End directionality, directional vs non-directional icons, action hierarchy, dropdown behaviors, progressive reduction, and decision rules. |
| **Summary (FA)** | چارچوب جامع تصمیم‌گیری چیدمان منطقی Start/End در RTL/LTR، تمایز آیکون‌های جهت‌دار، سلسله‌مراتب اکشن‌ها، رفتار دراپ‌داون‌ها و کاهش تدریجی پیچیدگی. |
| **Tags** | `design-system`, `ux`, `layout`, `directionality`, `rtl`, `ltr`, `responsive`, `interaction`, `dropdowns`, `actions` |

---

# UI/UX Design System Guidelines

## Direction, Layout, Responsive & Interaction Principles

### Document Purpose

This document defines the principles and decision-making framework for implementing the product UI consistently across LTR and RTL interfaces, responsive layouts, navigation, actions, dropdowns, forms, and interactive components.

The purpose is not to provide a fixed position for every component.

Instead, it establishes a shared design language that enables designers and developers to determine the correct behavior of a component even when a specific use case is not explicitly documented.

---

## 1. Core Philosophy

The interface must be understood as a **logical system**, not as a collection of fixed visual positions.

A developer should not ask:

> "Should this icon be on the left or right?"

The correct question is:

> "Is this element logically leading or trailing the content?"

Likewise, the question should not be:

> "Should this dropdown open to the left?"

It should be:

> "Where can the dropdown be displayed while preserving its relationship to its trigger, its content, the reading direction, and the available space?"

This distinction is fundamental.

The UI must adapt its physical representation according to:

* Reading direction
* Content hierarchy
* Interaction hierarchy
* Available space
* Component semantics
* User intent

Therefore, **Start and End are semantic concepts**, while Left and Right are physical coordinates.

---

## 2. Directionality: Start and End

The product supports both LTR and RTL interfaces.

All layout decisions should therefore be based on logical directions whenever the UI represents content flow.

### Logical direction

```text
LTR

Start  →  Content  →  End


RTL

End  ←  Content  ←  Start
```

In LTR, Inline Start normally maps to the physical left side.

In RTL, Inline Start normally maps to the physical right side.

The implementation should therefore prefer concepts such as:

* Inline Start
* Inline End
* Block Start
* Block End

rather than hard-coded:

* Left
* Right

This principle applies to:

* Alignment
* Padding
* Margin
* Positioning
* Component content
* Icons
* Actions
* Navigation
* Menus
* Responsive behavior

The objective is that changing the interface direction should change the physical representation without requiring component-specific redesign.

---

## 3. Reading Flow Comes Before Visual Position

The primary rule for positioning content is **reading and interaction flow**.

An element that introduces or identifies content is generally considered **leading**.

An element that operates on, modifies, or provides additional options for that content is generally considered **trailing**.

For example:

```text
[Icon]  User Name                         [Actions]
```

The icon belongs to the content's leading side.

The actions belong to the content's trailing side.

In RTL, the physical representation changes, but the semantic relationship remains:

```text
[Actions]                         User Name  [Icon]
```

The system has not changed the meaning of the layout.

Only its physical representation has changed.

### Decision principle

When determining placement, ask:

1. What is the primary content?
2. What introduces or identifies that content?
3. What operates on that content?
4. Which elements belong to the leading flow?
5. Which elements belong to the trailing flow?

This reasoning should be applied before considering physical coordinates.

---

## 4. Icons Are Semantic, Not Decorative Coordinates

An icon should never be positioned simply because a particular screen currently has space on the left or right.

Its position should derive from its role.

### Content-related icons

When an icon identifies, represents, or introduces the associated content, it normally belongs to the **leading side**.

Example:

```text
[Search Icon] Search
```

### Action icons

When an icon represents an operation on the associated content, it normally belongs to the **trailing side** when used as an inline action.

Example:

```text
Document Name                         [Edit] [More]
```

The important distinction is:

> **Leading/trailing describes semantic relationship, not physical location.**

---

## 5. Directional vs Non-Directional Icons

RTL does not mean that every icon should be mirrored.

Icons should be considered according to whether their visual shape carries directional meaning.

### Directional icons

These communicate movement or direction.

Examples include:

* Back
* Forward
* Previous
* Next
* Expand/collapse indicators
* Directional arrows

Their visual direction may need to change with the interface direction.

Conceptually:

```text
LTR:  →
RTL:  ←
```

### Non-directional icons

These communicate an action or object without expressing direction.

Examples:

* Search
* Delete
* Edit
* Settings
* Calendar
* Notification

These should normally remain visually unchanged.

### Decision rule

Ask:

> "Does the shape of this icon communicate direction, or does it communicate an action/object?"

If the meaning depends on direction, consider mirroring.

If the meaning does not depend on direction, do not mirror merely because the interface is RTL.

---

## 6. Actions and Action Hierarchy

Actions should be positioned according to their relationship to the content and their importance in the interaction hierarchy.

A page should not become a collection of independently positioned buttons.

Actions should follow a predictable hierarchy.

For example, a typical page structure may be:

```text
Navigation
    ↓
Tabs / View Selection
    ↓
Filters / Sorting
    ↓
Search
    ↓
Contextual / Secondary Actions
    ↓
Primary Action
```

This is not an absolute visual sequence for every page.

It is a decision framework.

The developer should understand the **purpose of each control** and place it according to the hierarchy of the task.

Navigation answers:

> "Where am I or which view am I using?"

Filtering answers:

> "Which subset of information do I want?"

Search answers:

> "Which specific information am I looking for?"

Actions answer:

> "What do I want to do with this information?"

Primary actions should therefore not be visually mixed with navigation or filtering controls unless the information architecture requires it.

---

## 7. Dropdowns and Menus

Dropdowns are one of the areas where physical left/right rules frequently cause incorrect RTL implementations.

A dropdown has two independent concepts:

1. **The relationship between the trigger and the menu**
2. **The alignment of the menu content**

These concepts must not be confused.

A menu should generally maintain a meaningful relationship with its trigger.

For example:

```text
Trigger
┌──────────────┐
│ Options   ▼  │
└──────────────┘
       ↓
┌──────────────┐
│ Option A     │
│ Option B     │
│ Option C     │
└──────────────┘
```

In RTL, the content flow changes, but the menu should still be understood as belonging to the same trigger.

The developer should therefore not implement:

> "RTL means dropdown opens to the left."

That is an oversimplification.

Instead, the decision should consider:

* Trigger position
* Menu width
* Available viewport space
* Reading direction
* Alignment relationship
* Whether the menu is contextual or global
* Whether the menu must remain attached to the trigger
* Whether opening in the preferred direction would cause overflow

### Dropdown decision hierarchy

Use this reasoning:

**First:** preserve the relationship with the trigger.

**Second:** preserve the logical alignment expected by the component.

**Third:** use available viewport space to prevent clipping.

**Finally:** reposition or flip the menu when necessary.

In other words:

> **Semantic attachment takes priority; physical direction is adaptive.**

---

## 8. Dropdown Content Alignment

The position of the dropdown itself and the alignment of its contents are separate decisions.

Consider:

```text
┌──────────────────────────┐
│ Edit                 ✎   │
│ Duplicate                │
│ Delete               🗑  │
└──────────────────────────┘
```

The menu may be anchored to the End of its trigger while its internal content follows its own logical alignment.

For standard textual menus:

> Text should normally follow the interface's reading direction.

Icons representing the menu item's content or meaning should follow the same leading/trailing logic used elsewhere.

Action indicators, shortcuts, chevrons, and secondary metadata should be treated according to their semantic role.

Therefore, do not use a single rule such as:

> "All dropdown icons go on the left."

Instead determine the role of each element inside the menu.

---

## 9. Action Dropdowns

An action dropdown such as:

```text
[•••]
```

is different from a selection dropdown such as:

```text
[Status ▼]
```

An action dropdown represents:

> "What operations can I perform?"

A selection dropdown represents:

> "Which value do I want?"

This distinction affects its relationship with the surrounding content.

### Action menus

An action menu generally belongs to the **trailing/contextual action area** of the object it controls.

Example:

```text
Document Name                         [•••]
```

The menu is conceptually attached to the document's actions.

### Selection menus

A selection control is part of the content or form flow and should be treated as a field rather than an object-level action.

Example:

```text
Status                         [Approved ▼]
```

The distinction is important because the same visual component may be used for completely different semantic purposes.

---

## 10. Menu Alignment Is Not the Same as Menu Opening Direction

A menu may be:

* Start-aligned
* End-aligned
* Center-aligned
* Anchored to a specific edge
* Flipped due to viewport constraints

These are different concepts.

For example, an action menu near the End of a card may visually align with the card's End edge:

```text
Card
┌───────────────────────────────────────┐
│ Content                         [•••] │
└───────────────────────────────────────┘
                                  │
                                  ▼
                           ┌────────────┐
                           │ Edit       │
                           │ Delete     │
                           └────────────┘
```

If there is insufficient space, the menu may need to reposition itself.

This is not an RTL exception.

It is **responsive positioning behavior**.

---

## 11. Responsive Design Is About Available Space

Responsive behavior must not be defined only by device names.

The question is not:

> "Is this a mobile device?"

The better question is:

> "How much space is available for this interaction?"

The same component may therefore behave differently depending on:

* Viewport width
* Container width
* Content length
* Number of actions
* Localization
* User settings
* Zoom level
* Accessibility text scaling

Responsive design is therefore a **behavioral adaptation system**.

---

## 12. Progressive Reduction

When available space decreases, the interface should reduce complexity progressively.

A typical progression is:

```text
Full representation
        ↓
Condensed representation
        ↓
Wrapped representation
        ↓
Overflow representation
        ↓
Alternative interaction
```

For example, a desktop action group may contain:

```text
[Export] [Share] [Edit] [Delete] [More]
```

On a narrower layout, some actions may move into:

```text
[Export] [Edit] [More]
```

and eventually:

```text
[•••]
```

The goal is not to preserve the exact desktop layout.

The goal is to preserve the **user's ability to understand and perform the task**.

---

## 13. Tabs, Filters and Search

Controls at the page level should be organized according to their conceptual role.

Tabs generally define the current view or information context.

Filters modify the visible dataset.

Search locates specific content within that context.

Therefore, when these controls coexist, their relationship should communicate this hierarchy.

A common conceptual model is:

```text
Context
  ↓
Tabs
  ↓
Filtering
  ↓
Search
  ↓
Actions
```

However, this is not a rigid coordinate system.

If the product context requires a different arrangement, the developer should be able to explain the decision through the interaction hierarchy.

The rule is:

> **Information architecture should determine layout; layout should not determine information architecture.**

---

## 14. Forms and Input Controls

Forms should follow the same logical principles.

Labels, inputs, helper text, validation messages, icons, and actions should respect the reading direction.

Text alignment should normally follow the content direction.

The implementation should avoid using physical positioning merely because it visually works in one language.

For example:

```css
/* Bad */
padding-left: 1rem;

/* Good */
padding-inline-start: 1rem;
```

when the intention is to create spacing before the content.

The same principle applies to:

* Margin (`margin-inline-start`, `margin-inline-end`)
* Padding (`padding-inline-start`, `padding-inline-end`)
* Borders (`border-inline-start`, `border-inline-end`)
* Positioning (`inset-inline-start`, `inset-inline-end`)
* Floating elements
* Text alignment (`text-align: start`, `text-align: end`)

---

## 15. Numbers, Dates, Codes and Mixed-Direction Content

Not all content follows the same directional rules.

Natural language generally follows the interface direction.

However, some content has an inherent representation that should remain LTR or otherwise directionally isolated.

Examples include:

* URLs
* Email addresses
* Product codes
* Technical identifiers
* Some numeric representations
* Programming code

The developer should distinguish between:

> **Interface direction**

and:

> **Content direction**

An RTL interface does not mean every piece of content inside it must visually behave as RTL.

Direction should follow the semantics of the content.

---

## 16. Global Rules vs Component Exceptions

Global behavior must be implemented through shared design principles and tokens wherever possible.

Avoid creating component-specific exceptions such as:

```text
Card A → 16px left
Card B → 20px right
Card C → icon manually moved in RTL
Card D → dropdown manually flipped
```

Instead establish global concepts:

* Start
* End
* Leading
* Trailing
* Inline
* Block
* Spacing
* Action hierarchy
* Responsive behavior

Components should consume these concepts.

### The principle

> **A component should inherit the design system's logic rather than invent its own directional logic.**

Exceptions should exist only when the component has a semantic reason that cannot be represented by the global rule.

---

## 17. Avoid Hard-Coded Directional Logic

Avoid implementation patterns where RTL behavior is manually patched for individual components.

Conceptually, avoid:

```text
if RTL:
    move icon to right
else:
    move icon to left
```

when the actual requirement is simply:

```text
place icon at Inline Start
```

Likewise, avoid defining separate RTL and LTR layouts when the component can naturally derive its behavior from direction.

The preferred approach is:

```text
Semantic rule
      ↓
Logical property / token
      ↓
Direction-aware rendering
      ↓
Physical position
```

This creates a system that scales.

---

## 18. Design Tokens and Shared Behavior

Directionality, spacing, sizing, typography and component behavior should be managed centrally wherever possible.

The developer should not be required to remember individual pixel values or positioning rules for every component.

The design system should provide shared tokens and primitives for concepts such as:

* Spacing
* Radius
* Typography
* Component dimensions
* Elevation
* Inline spacing
* Block spacing
* Start/End positioning
* Responsive breakpoints
* Interaction states

The objective is:

> **Change the system, not every component.**

When a global rule changes, components should inherit the change automatically.

---

## 19. How to Make a Decision When a Case Is Not Documented

When encountering a new component or interaction that is not explicitly covered by this document, use the following decision process.

### Step 1 — Identify the semantic role
Ask: *What is this element?*  
(Content, Navigation, Selection, Filter, Search, Action, Status, Metadata, Contextual menu)

### Step 2 — Identify its relationship
Ask: *What does this element belong to?*  
(The page, a section, a card, a list item, a form field, a specific action)

### Step 3 — Determine leading and trailing relationships
Ask: *Which elements introduce the content and which operate on it?*  
This determines Start/End relationships.

### Step 4 — Apply reading direction
Ask: *How should this relationship be represented in the current language direction?*  
Use logical direction rather than physical coordinates.

### Step 5 — Consider available space
Ask: *What happens when there is not enough room?*  
The component should adapt rather than break.

### Step 6 — Preserve task clarity
Ask: *Does the resulting layout still make the user's intended action obvious?*  
If not, the layout needs reconsideration.

### Step 7 — Prefer the system rule over the local preference
If the decision can be solved through an existing global principle, use it. Do not create a new local convention unnecessarily.

---

## 20. Example: Deciding Where a New Dropdown Should Appear

Suppose a developer introduces a new dropdown and no specific rule exists for it.

The developer should not ask:

> "Where do our other dropdowns open?"

Instead:

1. **What is the dropdown?**  
   If it selects a value, it belongs to a form/control flow.  
   If it exposes actions, it belongs to an action area.  
   If it represents contextual options for an object, it belongs to that object's contextual action area.
2. **What is its trigger?**  
   The menu should remain logically attached to its trigger.
3. **What is the current direction?**  
   Use the logical Start/End relationship appropriate to the component.
4. **Is there enough space?**  
   If not, reposition or flip the menu to preserve visibility.

The final physical position is therefore an **output of the rules**, not the rule itself.

---

## 21. Accessibility and Interaction

Consistency must not come at the expense of accessibility.

A component must remain understandable and usable when:

* Text becomes longer
* Font size increases
* The interface is translated
* The direction changes
* Keyboard navigation is used
* Touch interaction is used
* Content overflows
* Actions are collapsed

The visual position of an element must never be the only indication of its meaning.

Interactive elements should maintain:

* Clear focus states
* Appropriate touch targets
* Keyboard accessibility
* Meaningful labels
* Correct semantic roles
* Logical reading order

---

## 22. Quality Assurance

Every new component or significant UI change should be evaluated in at least these dimensions:

- **Direction:** Does it behave correctly in both RTL and LTR?
- **Semantics:** Are leading, trailing, content and action relationships preserved?
- **Responsiveness:** Does it adapt when available space changes?
- **Content:** Does it remain usable with long or localized content?
- **Interaction:** Does the component remain intuitive when accessed by keyboard, mouse or touch?
- **Consistency:** Does it reuse the existing design system logic rather than introducing a new local convention?

---

## 23. The Fundamental Rule

When a developer is uncertain about the correct UI behavior, the decision should follow this hierarchy:

```text
Semantic meaning
       ↓
Content / interaction relationship
       ↓
Reading direction
       ↓
Available space
       ↓
Responsive adaptation
       ↓
Physical position
```

Not:

```text
Physical position
       ↓
RTL patch
       ↓
Component-specific exception
```

---

## 24. Summary

The design system is based on one fundamental principle:

> **Define relationships, not coordinates.**

Use:

* **Start** instead of Left
* **End** instead of Right
* **Leading** instead of "left-side content"
* **Trailing** instead of "right-side action"
* **Logical spacing** instead of directional margins (`padding-inline`, `margin-inline`)
* **Semantic hierarchy** instead of fixed control positions
* **Adaptive behavior** instead of device-specific layouts

RTL and LTR should therefore not be treated as two separate designs. They are two physical representations of the same logical interface.
