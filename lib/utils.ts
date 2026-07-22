import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips <style> blocks from an HTML string before markdown conversion.
 * node-html-parser (used by node-html-markdown) can mis-parse inline <style>
 * blocks, causing sibling content that follows them to disappear from the tree.
 */
export function stripStyleTags(html: string): string {
  return html.replaceAll(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
}
