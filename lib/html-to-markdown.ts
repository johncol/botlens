import { NodeHtmlMarkdown } from "node-html-markdown";
import { TranslatorContext } from "node-html-markdown/dist/translator";

/**
 * Strips <style> blocks from an HTML string before markdown conversion.
 * node-html-parser (used by node-html-markdown) can mis-parse inline <style>
 * blocks, causing sibling content that follows them to disappear from the tree.
 */
export function stripStyleTags(html: string): string {
  return html.replaceAll(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
}

const videoTagConverter = (ctx: TranslatorContext) => {
    const node = ctx.node as import("node-html-parser").HTMLElement;
    // Try the src attribute on the <video> itself first
    let src = node.getAttribute("src") ?? "";
    // Fall back to the first <source> child
    if (!src) {
        src = node.querySelector("source")?.getAttribute("src") ?? "";
    }
    const poster = node.getAttribute("poster") ?? "";
    if (!src && !poster) {
        return { ignore: true };
    }

    if (!src) {
        // No playable source but has a poster image — render as image
        return {
            content: `[VideoPoster](${poster})`,
            surroundingNewlines: 1,
            preserveIfEmpty: false,
        };
    }

    return {
        content: `[Video](${src})`,
        surroundingNewlines: 1,
        preserveIfEmpty: false,
    };
};

/**
 * Custom NHM instance that preserves <video> elements as markdown links.
 * node-html-markdown has no built-in video handler, so videos are silently
 * dropped without this translator.
 */
const nhmConverter = new NodeHtmlMarkdown(
  {},
  {
    video: videoTagConverter,
    // Suppress bare <source> tags — they're already handled inside <video>
    source: { ignore: true },
  },
);

/** Converts an HTML string to Markdown, stripping style tags first. */
export function htmlToMarkdown(html: string): string {
  return nhmConverter.translate(stripStyleTags(html));
}
