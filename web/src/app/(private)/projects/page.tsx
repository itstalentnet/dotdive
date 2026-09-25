import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  Lock,
  Globe,
  Shield,
} from "lucide-react";
import { listRoots } from "@/server/content/index";
import { getSessionContext } from "@/server/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "پروژه‌ها | دات دایو",
  robots: { index: false, follow: false },
};

export default async function ProjectsPage() {
  const ctx = await getSessionContext();
  const roots = listRoots(ctx);

  return (
    <div className="projects-container">
      {/* Unified Site Header with responsive search & navigation */}
      <SiteHeader />

      <main className="projects-content">
        <div className="projects-header">
          <div className="projects-header-top">
            <h1 className="projects-title">نقطهٔ شیرجه به پروژه‌ها</h1>
            <span className="user-pill">
              <Shield size={12} strokeWidth={2} />
              <span>{ctx.email ?? "کاربر مهمان"}</span>
            </span>
          </div>
          <p className="projects-subtitle">
            ریشه‌ها و فضاهای محتوایی در دسترس حساب کاربری شما
          </p>
        </div>

        <div className="projects-grid">
          {roots.map((root) => {
            const isPub = root.isPublic || root.name === "public";
            const targetUrl = isPub ? "/docs" : `/p/${root.name}`;

            return (
              <Link key={root.name} href={targetUrl} className="project-card">
                <div className="project-card-header">
                  <div className="project-icon-box">
                    {isPub ? (
                      <Globe size={16} strokeWidth={1.75} />
                    ) : (
                      <Compass size={16} strokeWidth={1.75} />
                    )}
                  </div>
                  <span className="project-badge">
                    {isPub ? (
                      <span>عمومی</span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <Lock size={10} strokeWidth={2} />
                        <span>خصوصی</span>
                      </span>
                    )}
                  </span>
                </div>

                <h3 className="project-card-title">{root.title || root.name}</h3>

                <p className="project-card-desc">
                  {root.description ||
                    (isPub
                      ? "مستندات عمومی، راهنماها و معماری‌های باز"
                      : `مستندات داخلی و فنی تیم ${root.name}`)}
                </p>

                <div className="project-card-footer">
                  <span className="project-action-link">
                    <span>ورود به مستندات</span>
                    <ArrowLeft size={12} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <SiteFooter />

      <style>{`
        .projects-container {
          min-height: 100vh;
          background-color: var(--dd-surface-0);
          color: var(--dd-text-primary);
          display: flex;
          flex-direction: column;
        }
        .projects-content {
          flex: 1;
          width: 100%;
          max-width: 860px;
          margin-inline: auto;
          padding: calc(52px + 2.5rem) 1.25rem 4rem;
        }
        .projects-header {
          margin-bottom: 2rem;
        }
        .projects-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }
        .projects-title {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 600;
          color: var(--dd-text-primary);
        }
        .user-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.6rem;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          border-radius: 4px;
          font-size: 0.75rem;
          color: var(--dd-text-secondary);
          font-family: var(--font-mono);
          direction: ltr;
        }
        .projects-subtitle {
          color: var(--dd-text-secondary);
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }
        .project-card {
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
          background: var(--dd-surface-1);
          border: 1px solid var(--dd-border);
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .project-card:hover {
          background: var(--dd-surface-2);
          border-color: var(--dd-border-focus);
          transform: translateY(-1px);
        }
        .project-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }
        .project-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--dd-text-primary);
        }
        .project-badge {
          font-size: 0.68rem;
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
          background: var(--dd-surface-3);
          border: 1px solid var(--dd-border-subtle);
          color: var(--dd-text-muted);
        }
        .project-card-title {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--dd-text-primary);
          margin-bottom: 0.35rem;
        }
        .project-card-desc {
          font-size: 0.8rem;
          color: var(--dd-text-secondary);
          line-height: 1.6;
          margin-bottom: 1.25rem;
          flex: 1;
        }
        .project-card-footer {
          padding-top: 0.65rem;
          border-top: 1px solid var(--dd-border-subtle);
        }
        .project-action-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--dd-accent);
          font-weight: 500;
        }
        .project-card:hover .project-action-link {
          color: var(--dd-accent-hover);
        }
      `}</style>
    </div>
  );
}
