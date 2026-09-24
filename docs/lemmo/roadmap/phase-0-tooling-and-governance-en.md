# Phase 0 — Tooling & Governance

> **⛔ SUPERSEDED — historical phase deliverable.** Folder-structure and timeline claims inside may
> no longer match the live sources (e.g. `primitives/` is now populated starting the Phase-3 PR,
> not "Phase 6"). Single source of truth:
> `src/design-system/tokens/` + `src/styles/tokens.css` (values) ·
> `frontend/AGENTS.md` + `docs/decisions/*.md` (locked decisions) ·
> `src/design-system/docs/` (design-system docs). When in doubt, follow the live sources.

### Developer Implementation Document | Project: Lemmo

> **Prerequisite:** Review the `System_design` folder (path: `/home/behroz/Documents/Git/lemmo/System_design`) before starting this phase. The fonts (Satoshi, Oddval, Morabba/Square, IRANSans) and the design system structure will be documented in detail in Phase 1; this phase only establishes the technical and governance foundations of the project.

> **Assumed stack:** React 18+ / TypeScript / Vite (or Next.js — if different, inform the developer so the relevant bundler sections can be adjusted).

---

## 1. Phase Objective

Before writing even a single line of UI, infrastructure must be built that:

1. Prevents low-quality code from entering the project from day one (not through manual review, but through automated tooling).
2. Creates a common language between developers (and AI tools) for naming, file structure, and commits.
3. Is reproducible and auditable — meaning anyone joining the project (human or AI) can know how to write code without having to ask anyone.

The output of this phase: an empty project (with no features) but with all quality guardrails enabled and tested.

---

## 2. Versions & Package Management (Environment Baseline)

- **Node.js:** Lock the active LTS version (e.g. `20.x`). Create a `.nvmrc` file in the project root.
- **Package Manager:** Choose one and enforce it across the entire team — recommendation: `pnpm` (faster, disk-efficient, prevents phantom dependencies). Using two different package managers in one project is prohibited.
- Set the `"engines"` field in `package.json` so an incorrect Node version automatically fails:

```json
"engines": {
  "node": ">=20.0.0",
  "pnpm": ">=9.0.0"
}
```

- Also lock the `packageManager` field in `package.json` (e.g. `"packageManager": "pnpm@9.x.x"`) so the exact version is used through Corepack.

---

## 3. TypeScript — Strict Configuration

File: `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

**Non-negotiable rule:** `strict: true` must never be disabled. Using `any` without written justification in a comment above the line will result in the PR being rejected. Use `unknown` + type narrowing instead of `any`.

---

## 4. ESLint — Code Quality Rules

Installation:

```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y \
  eslint-plugin-import eslint-plugin-unicorn eslint-config-prettier
```

File `.eslintrc.json` — key rules that must be enabled:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  "rules": {
    "max-lines": ["error", { "max": 300, "skipBlankLines": true, "skipComments": true }],
    "max-lines-per-function": ["warn", { "max": 80, "skipBlankLines": true }],
    "complexity": ["warn", 12],
    "no-magic-numbers": ["warn", { "ignore": [0, 1, -1], "ignoreArrayIndexes": true }],
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
        "message": "Hardcoded colors are prohibited. Use design tokens."
      }
    ],
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "alphabetize": { "order": "asc" }
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### Why These Rules?

| Rule                         | Industry Rationale                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `max-lines: 300`             | A large file means too many responsibilities in one place (violation of Single Responsibility). This enforces splitting code into smaller files. |
| `max-lines-per-function: 80` | A long function usually means complex logic that is difficult to test and maintain.                                                              |
| `no-magic-numbers`           | Every number should either come from design tokens or be named (`const MAX_RETRIES = 3`).                                                        |
| Custom hardcoded-color rule  | This is exactly what is needed in Phase 1 (Design System) — do not write any hex values in components; use only CSS variables/tokens.            |
| `no-console`                 | Only warn/error are allowed; forgotten `console.log` calls must not make it into production.                                                     |

---

## 5. Prettier — Automatic Formatting

File `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**Rule:** Prettier is responsible for formatting, while ESLint is responsible for logical code quality. The two must not conflict (which is why `eslint-config-prettier` is placed at the end of `extends` to disable ESLint formatting rules).

---

## 6. Git Hooks — Automatic Execution Before Commit

Installation:

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

File `.husky/pre-commit`:

```bash
pnpm exec lint-staged
```

`package.json` `lint-staged` section:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

File `.husky/commit-msg` to enforce Conventional Commits:

```bash
pnpm exec commitlint --edit "$1"
```

Install commitlint:

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

File `commitlint.config.js`:

```js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

**Why?** No unformatted or lint-error code enters the repository — this control is repeated on the CI server as well (Section 10), but local prevention speeds up feedback.

---

## 7. Commit Naming Convention (Conventional Commits)

Required format:

```
<type>(<scope>): <description>

Examples:
feat(chat): add message streaming support
fix(canvas): resolve zoom reset bug on resize
docs(design-system): document typography scale
refactor(sidebar): extract nav item into component
chore(deps): bump react to 18.3
```

Allowed `type` values: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`

---

## 8. Branch Naming Convention

```
feature/<scope>-<short-description>   → feature/chat-streaming
fix/<scope>-<short-description>       → fix/canvas-zoom-bug
chore/<short-description>             → chore/update-deps
```

- Merging into `main` is allowed only through a Pull Request — direct pushes to `main` must be blocked in the repository settings (Branch Protection Rule).
- Every PR requires at least one review, even if the team consists of one person (self-review after a time gap, or the PR checklist provided below).

---

## 9. Baseline Folder Structure (Without Features)

```
src/
├── app/                  # Main app entry, Providers, Router
├── design-system/        # Phase 1 output — tokens, base primitives
│   ├── tokens/           # colors.ts, typography.ts, spacing.ts
│   └── primitives/       # (empty for now — populated in Phase 6)
├── features/             # Each project section has a subfolder (Phase 8)
│   ├── chat/
│   ├── canvas/
│   ├── home/
│   └── settings/
├── shared/
│   ├── components/       # Components shared between features
│   ├── hooks/
│   ├── utils/
│   └── types/
├── lib/                  # Third-party tool configuration (api client, i18n config, ...)
└── styles/               # Base CSS files (reset, global)
```

**Boundary rule:** A file inside `features/chat` must never directly import internals from `features/canvas`. If something needs to be shared, move that piece to `shared/`. (This rule can be automatically enforced with `eslint-plugin-boundaries` — add it in Phase 2 if desired.)

**File naming convention:**

- Components: `PascalCase.tsx` (e.g. `MessageBubble.tsx`)
- Hooks: `useCamelCase.ts` (e.g. `useChatScroll.ts`)
- Utils: `camelCase.ts`
- Every complex component gets its own folder with an `index.ts` for export

---

## 10. Initial CI Pipeline (Mandatory Before Any PR)

File `.github/workflows/ci.yml` (or the GitLab CI equivalent):

```yaml
name: CI
on: [pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm run build
```

The following scripts must exist in `package.json`:

```json
"scripts": {
  "lint": "eslint . --max-warnings=0",
  "typecheck": "tsc --noEmit",
  "build": "vite build",
  "format": "prettier --write ."
}
```

**Rule:** If any of these three stages fails, the PR cannot be merged — no exceptions, even for "just a small change".

---

## 11. Editor Config (Consistency Across Editors)

File `.editorconfig`:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

Also create a `.vscode/extensions.json` file to recommend the team's required extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig"
  ]
}
```

---

## 12. Phase 0 Completion Checklist (QA-0)

Before declaring this phase complete, the developer must confirm the following items with a ✅:

- [ ] `.nvmrc` and the `engines` field in `package.json` are configured
- [ ] `pnpm` is locked as the only package manager (`packageManager` field exists)
- [ ] `tsconfig.json` has `strict: true` and all flags from Section 3 enabled
- [ ] ESLint is installed and configured; `pnpm run lint` runs on the empty project with no errors/warnings
- [ ] Prettier is installed and works without conflicts with ESLint
- [ ] Husky + lint-staged are active — a test commit with unformatted code is blocked
- [ ] Commitlint is active — a commit with a non-Conventional message is rejected
- [ ] Branch protection is enabled on `main` (direct pushes blocked)
- [ ] The folder structure from Section 9 is created (even if empty, with `.gitkeep`)
- [ ] The CI pipeline is written and passes on a test PR
- [ ] `.editorconfig` and `.vscode/extensions.json` exist
- [ ] This document and the configuration files are committed to the project root (message: `chore: setup phase 0 tooling and governance`)

> After this checklist is fully checked, Phase 0 is closed and we move to **QA-0** (final review by the project owner). Once approved, authorization is given to proceed to Phase 1 (Design System Documentation).
