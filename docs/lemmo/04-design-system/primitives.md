# design-system/primitives/ — pure primitives (decision 2026-09-12 — ADR-001)

Home of the pure primitives: **Button, Input, Text, Icon**. They have zero
product logic and zero domain vocabulary — they are a direct reflection of the
tokens (`design-system` boundary enforced: `design-system → design-system`).
Domain enters via props at the call site.

## Component API — canonical example (decision 2026-09-12 — ADR-001)

> **Implemented (Phase 3, 2026-09-12):** `Button.tsx` + `Button.module.css` +
> `Button.test.tsx` are the canonical reference primitive. Token-only styling,
> `focus-visible` outline, `loading` → `disabled` + `aria-busy` + spinner,
> `asChild` keeps the child unwrapped (Radix Slot requires a single child).

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    asChild = false,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={classList(styles.button, styles[variant], styles[size], className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : disabled || loading}
      {...rest}
    >
      {asChild || !loading ? (
        children
      ) : (
        <>
          <span className={styles.spinner} aria-hidden={true} />
          <span className={styles.label}>{children}</span>
        </>
      )}
    </Comp>
  );
});
```

Rules (apply to every primitive and every composite in `shared/ui/`):

- Props inherit from the native element: `React.ComponentPropsWithoutRef<'button'>`.
- Names: `variant`, `size`, `disabled`, `loading`, `invalid`, `readonly`,
  `selected`, `className`, `children`.
- **No public `state` prop** — visual states (hover/focus/active) via CSS +
  `data-*`, never in props.
- Semantic booleans are attributes on the component (`disabled`, `loading`);
  internal state uses `is/has/can`.
- `forwardRef` is mandatory on every primitive; `asChild` (Radix pattern) for
  polymorphism — `<Button asChild><Link/></Button>`.
- `className` is always last (override); raw `style` is banned without a
  documented escape hatch.
- Variants are discriminated unions (`variant: 'primary' | 'ghost'`), never
  boolean combos (`isPrimary isGhost`).
