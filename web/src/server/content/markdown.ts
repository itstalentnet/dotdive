/**
 * server/content/markdown.ts
 * Unified Markdown → HTML pipeline
 * Features: GFM, callouts, anchor links, sanitization, RTL-aware
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import type { Root as MdastRoot, Blockquote, Paragraph, Text } from "mdast";
import type { Root as HastRoot, Element } from "hast";
import type { Heading } from "./types";

/* ── Sanitize schema ─────────────────────────────────────────── */
const sanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id", "dir", "data*"],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "href", "title", "target", "rel", "aria-label", "aria-hidden",
    ],
    code: ["className"],
    pre: ["className"],
    details: ["open"],
    img: ["src", "alt", "width", "height", "loading"],
    input: ["type", "checked", "disabled", "aria-label"],
    th: ["align", "scope"],
    td: ["align"],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details", "summary", "kbd", "mark", "bdi",
    "figure", "figcaption", "div", "span", "input",
  ],
};

/* ── Main render function ────────────────────────────────────── */
export async function renderMarkdown(
  content: string
): Promise<{ html: string; headings: Heading[] }> {
  const headings: Heading[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkCalloutsPlugin)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeStripFirstH1Plugin)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: {
        className: ["heading-anchor-link"],
        ariaLabel: "لینک مستقیم",
      },
    })
    .use(rehypeCollectHeadingsPlugin(headings))
    .use(rehypeCodeWrapPlugin)
    .use(rehypeSanitize, sanitizeSchema as never)
    .use(rehypeStringify)
    .process(content);

  return { html: String(file), headings };
}

/* ── Callout plugin (remark) ─────────────────────────────────── */
function remarkCalloutsPlugin() {
  return (tree: MdastRoot) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0] as Paragraph | undefined;
      if (first?.type !== "paragraph") return;
      const text = first.children[0] as Text | undefined;
      if (text?.type !== "text") return;
      const match = text.value.match(/^\[!(NOTE|WARNING|TIP|CAUTION|IMPORTANT)\]\s*/i);
      if (!match) return;

      const type = match[1].toLowerCase();
      (node as never as { data: { hProperties: { className: string[] } } }).data = {
        hProperties: { className: [`callout-${type}`, "callout"] },
      };
      text.value = text.value.slice(match[0].length);
    });
  };
}

/* ── Heading collector (rehype) ──────────────────────────────── */
function rehypeCollectHeadingsPlugin(out: Heading[]) {
  return () => (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if (!/^h[234]$/.test(node.tagName)) return;
      const level = parseInt(node.tagName[1]) as 2 | 3 | 4;
      const id = (node.properties?.id as string) ?? "";
      const text = hastToString(node as never);
      if (text) out.push({ id, level, text });
    });
  };
}

/* ── Code block wrapper (rehype) ─────────────────────────────── */
function rehypeCodeWrapPlugin() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;
      const existing = (node.properties?.className as string[]) ?? [];
      node.properties = { ...node.properties, className: [...existing, "code-block"] };
    });
  };
}

/* ── Strip First H1 plugin (rehype) ─────────────────────────── */
function rehypeStripFirstH1Plugin() {
  return (tree: HastRoot) => {
    let stripped = false;
    visit(tree, "element", (node: Element, index, parent) => {
      if (!stripped && node.tagName === "h1" && parent && typeof index === "number") {
        parent.children.splice(index, 1);
        stripped = true;
      }
    });
  };
}

