/**
 * Not Found page — same 404 for all cases (anti-leak)
 * Private pages that don't exist or user lacks access = same 404
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "۴۰۴ — صفحه پیدا نشد",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="nf-code">۴۰۴</div>
      <h1 className="nf-title">صفحه پیدا نشد</h1>
      <p className="nf-desc">
        این صفحه وجود ندارد یا دسترسی به آن ممکن نیست.
      </p>
      <Link href="/" className="nf-btn">
        برگشت به خانه
      </Link>
      <style>{`
        .not-found {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          background: var(--dd-surface-0);
          gap: 1rem;
        }
        .nf-code {
          font-family: var(--font-heading);
          font-size: 6rem;
          font-weight: 700;
          color: var(--dd-border);
          line-height: 1;
        }
        .nf-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          color: var(--dd-text-primary);
        }
        .nf-desc {
          color: var(--dd-text-muted);
          font-size: 0.9rem;
          max-width: 300px;
        }
        .nf-btn {
          padding: 0.65rem 1.5rem;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          border-radius: 8px;
          color: var(--dd-text-primary);
          font-family: var(--font-heading);
          text-decoration: none;
          font-size: 0.9rem;
          margin-top: 0.5rem;
          transition: all 0.15s;
        }
        .nf-btn:hover {
          background: var(--dd-surface-3);
          color: var(--dd-text-primary);
        }
      `}</style>
    </div>
  );
}
