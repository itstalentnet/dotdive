"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Hash, X, ArrowLeft, Loader2, Compass, Globe } from "lucide-react";
import type { SearchHit } from "@/server/content/types";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoot?: string;
  initialQuery?: string;
}

export function SearchDialog({ isOpen, onClose, currentRoot, initialQuery }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery(initialQuery ?? "");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen, initialQuery]);

  // Global keyboard listener for Esc and Arrow navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        navigateTo(results[selectedIndex].urlPath);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Debounced search fetch
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rootQuery = currentRoot ? `&root=${encodeURIComponent(currentRoot)}` : "";
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}${rootQuery}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.hits ?? []);
          setSelectedIndex(0);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, currentRoot]);

  function navigateTo(url: string) {
    onClose();
    router.push(url);
  }

  if (!isOpen) return null;

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="search-modal-input-bar">
          <Search size={16} strokeWidth={2} className="text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در تمام مستندات و سرفصل‌ها..."
            dir="rtl"
          />
          {loading ? (
            <Loader2 size={15} className="animate-spin text-neutral-400" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="search-clear-btn"
              aria-label="پاک کردن"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="search-modal-esc">ESC</kbd>
          )}
        </div>

        {/* Results List */}
        <div className="search-modal-body" dir="rtl">
          {query.trim() && !loading && results.length === 0 && (
            <div className="search-empty-state">
              موردی مطابق با جستجوی شما یافت نشد.
            </div>
          )}

          {!query.trim() && (
            <div className="search-hint-state">
              عبارتی را برای جستجو در عنوان‌ها، سرفصل‌ها و متن‌ها تایپ کنید.
            </div>
          )}

          {results.length > 0 && (
            <div className="search-results-list" role="listbox">
              {results.map((hit, index) => {
                const isSelected = index === selectedIndex;
                const isHeading = !!hit.anchor;

                return (
                  <div
                    key={`${hit.urlPath}-${index}`}
                    className={`search-result-item ${isSelected ? "selected" : ""}`}
                    onClick={() => navigateTo(hit.urlPath)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="search-item-icon">
                      {isHeading ? (
                        <Hash size={14} strokeWidth={2} className="text-neutral-400" />
                      ) : (
                        <FileText size={14} strokeWidth={2} className="text-neutral-400" />
                      )}
                    </div>

                    <div className="search-item-content">
                      <div className="search-item-title-row">
                        <span className="search-item-title">
                          {isHeading ? hit.heading : hit.title}
                        </span>
                        {isHeading && (
                          <span className="search-item-parent">
                            در {hit.title}
                          </span>
                        )}
                        <span className="search-item-root">
                          {hit.root === "public" ? "عمومی" : hit.root}
                        </span>
                      </div>

                      {hit.snippet && (
                        <p className="search-item-snippet">{hit.snippet}</p>
                      )}
                    </div>

                    <ArrowLeft size={12} className="search-item-arrow" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="search-modal-footer">
          <div className="search-shortcuts-guide">
            <span><kbd>↑</kbd> <kbd>↓</kbd> پیمایش</span>
            <span><kbd>↵</kbd> انتخاب</span>
            <span><kbd>ESC</kbd> بستن</span>
          </div>
        </div>
      </div>

      <style>{`
        .search-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background-color: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 12vh;
          padding-inline: 1rem;
          animation: fadeIn 0.12s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .search-modal-card {
          width: 100%;
          max-width: 560px;
          background-color: #0f1013;
          border: 1px solid #23262d;
          border-radius: 8px;
          box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          animation: slideDown 0.12s ease-out;
        }
        @keyframes slideDown {
          from { transform: translateY(-8px); opacity: 0.9; }
          to { transform: translateY(0); opacity: 1; }
        }
        .search-modal-input-bar {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #1c1e24;
        }
        .search-modal-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #ededef;
          font-family: var(--font-body);
          font-size: 0.875rem;
        }
        .search-modal-input::placeholder {
          color: #555b66;
        }
        .search-clear-btn {
          background: none;
          border: none;
          color: #6a7180;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .search-clear-btn:hover { color: #ededef; }
        .search-modal-esc {
          font-size: 0.65rem;
          padding: 0.1rem 0.35rem;
          background: #191b20;
          border: 1px solid #282c35;
          border-radius: 4px;
          color: #6a7180;
          font-family: var(--font-mono);
        }
        .search-modal-body {
          max-height: 380px;
          overflow-y: auto;
          padding: 0.5rem;
        }
        .search-empty-state, .search-hint-state {
          padding: 2.5rem 1rem;
          text-align: center;
          font-size: 0.8rem;
          color: #6a7180;
        }
        .search-results-list {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .search-result-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.55rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.1s;
        }
        .search-result-item.selected {
          background-color: #171920;
        }
        .search-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 5px;
          background: #14161b;
          border: 1px solid #20232a;
          flex-shrink: 0;
        }
        .search-item-content {
          flex: 1;
          min-width: 0;
        }
        .search-item-title-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.15rem;
        }
        .search-item-title {
          font-size: 0.825rem;
          font-weight: 500;
          color: #ededef;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-item-parent {
          font-size: 0.72rem;
          color: #6a7180;
        }
        .search-item-root {
          font-size: 0.65rem;
          padding: 0.05rem 0.35rem;
          border-radius: 3px;
          background: #191b22;
          color: #7d8492;
          border: 1px solid #232731;
          margin-right: auto;
        }
        .search-item-snippet {
          font-size: 0.74rem;
          color: #8c93a0;
          line-height: 1.5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-item-arrow {
          color: #4a505c;
          opacity: 0;
          transition: opacity 0.1s;
        }
        .search-result-item.selected .search-item-arrow {
          opacity: 1;
          color: #ededef;
        }
        .search-modal-footer {
          padding: 0.45rem 1rem;
          background: #0b0c0e;
          border-top: 1px solid #1a1c22;
          font-size: 0.7rem;
          color: #555b66;
        }
        .search-shortcuts-guide {
          display: flex;
          gap: 1rem;
        }
        .search-shortcuts-guide kbd {
          padding: 0.05rem 0.25rem;
          background: #14161b;
          border: 1px solid #232731;
          border-radius: 3px;
          font-size: 0.65rem;
          font-family: var(--font-mono);
          color: #7d8492;
        }
      `}</style>
    </div>
  );
}
