/**
 * server/search/persian.ts
 * Persian text normalizer for search
 * Handles: NFKC, Yeh/Kaf, Kashida, Diacritics,
 *          Persian digits, half-space, Arabic punctuation
 */

/** Normalize Persian text for indexing and querying */
export function normalizePersian(text: string): string {
  if (!text) return "";

  let s = text;

  // 1. NFKC normalization
  s = s.normalize("NFKC");

  // 2. Arabic/Persian letter normalization
  s = s
    .replace(/ي/g, "ی")   // Arabic Yeh → Persian Yeh
    .replace(/ك/g, "ک")   // Arabic Kaf → Persian Kaf
    .replace(/ة/g, "ه")   // Tah Marbuta → Heh
    .replace(/[أإٱآ]/g, "ا"); // Hamza forms → Alef

  // 3. Remove Kashida (tatweel) and diacritics
  s = s.replace(/ـ/g, ""); // Tatweel U+0640
  s = s.replace(/[\u064B-\u065F\u0670]/g, ""); // Harakat

  // 4. Persian/Arabic digits → Latin
  s = s
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660));

  // 5. Half-space (ZWNJ): index both joined and separated forms
  // We'll keep as space for tokenization
  s = s.replace(/\u200C/g, " ");

  // 6. Arabic punctuation → separators
  s = s.replace(/[،؛؟]/g, " ");

  // 7. Lowercase Latin
  s = s.toLowerCase();

  // 8. Break camelCase and snake_case
  s = s.replace(/([a-z])([A-Z])/g, "$1 $2");
  s = s.replace(/_/g, " ");

  // 9. Collapse multiple spaces
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/** Tokenize Persian text for search indexing */
export function tokenize(text: string): string[] {
  const normalized = normalizePersian(text);
  return normalized
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** Simple snippet extractor */
export function extractSnippet(
  text: string,
  query: string,
  maxLength = 160
): string {
  const normalizedText = normalizePersian(text);
  const normalizedQuery = normalizePersian(query);
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  // Find the best match position
  let bestIdx = 0;
  for (const term of queryTerms) {
    const idx = normalizedText.indexOf(term);
    if (idx !== -1) {
      bestIdx = Math.max(0, idx - 40);
      break;
    }
  }

  let snippet = text.slice(bestIdx, bestIdx + maxLength);
  if (bestIdx > 0) snippet = "..." + snippet;
  if (bestIdx + maxLength < text.length) snippet += "...";

  return snippet;
}
