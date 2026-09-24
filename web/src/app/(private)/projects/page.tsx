/**
 * Projects page — /projects
 * Shows accessible roots for the logged-in user
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "پروژه‌ها",
};

// Placeholder — will use session + listRoots() in M3
export default function ProjectsPage() {
  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1 className="projects-title">پروژه‌هایت</h1>
        <p className="projects-subtitle">
          ریشه‌هایی که دسترسی داری
        </p>
      </div>

      <div className="projects-grid">
        {/* Placeholder cards — replaced by real data after auth */}
        <div className="project-card">
          <div className="project-card-icon">📘</div>
          <h3 className="project-card-title">nons</h3>
          <p className="project-card-desc">مستندات داخلی تیم nons</p>
          <Link href="/p/nons" className="project-card-link">
            شیرجه بزن ←
          </Link>
        </div>
      </div>

      <style>{`
        .projects-page {
          max-width: 900px;
          margin: auto;
          padding: 3rem 1.5rem;
        }
        .projects-header { margin-bottom: 2.5rem; }
        .projects-title {
          font-family: var(--font-heading);
          font-size: clamp(1.5rem, 3vw, 2rem);
          color: var(--dd-text-primary);
          margin-bottom: 0.5rem;
        }
        .projects-subtitle {
          color: var(--dd-text-muted);
          font-size: 0.9rem;
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        .project-card {
          padding: 1.5rem;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          border-radius: 12px;
          transition: all 0.2s;
        }
        .project-card:hover {
          border-color: var(--dd-text-muted);
          transform: translateY(-2px);
        }
        .project-card-icon { font-size: 2rem; margin-bottom: 1rem; }
        .project-card-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--dd-text-primary);
          margin-bottom: 0.5rem;
        }
        .project-card-desc {
          font-size: 0.85rem;
          color: var(--dd-text-secondary);
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        .project-card-link {
          font-size: 0.82rem;
          color: var(--dd-accent);
          text-decoration: none;
          font-family: var(--font-heading);
        }
        .project-card-link:hover { color: var(--dd-accent-hover); }
      `}</style>
    </div>
  );
}
