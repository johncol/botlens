import { NextRequest, NextResponse } from "next/server";
import TurndownService from "turndown";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { jsonError, readJsonBody, validateFetchableUrl } from "@/lib/api-validation";
import { stripStyleTags } from "@/lib/html-to-markdown";
import { toErrorMessage } from "@/lib/errors";
import { MAX_HTML_BYTES } from "@/lib/config";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export async function POST(request: NextRequest) {
  const { body, errorResponse } = await readJsonBody<{
    url?: string;
    html?: string;
  }>(request);
  if (errorResponse) {
    return errorResponse;
  }

  const { url, html: rawHtml } = body;
  let html: string;

  if (url) {
    const invalidUrl = await validateFetchableUrl(url);
    if (invalidUrl) {
      return jsonError(invalidUrl);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": "botlens/1.0" },
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      return jsonError(
        `Failed to fetch URL: ${toErrorMessage(err, "Unknown fetch error")}`,
        502,
      );
    }

    if (!response.ok) {
      return jsonError(
        `Remote server returned ${response.status} ${response.statusText}`,
        502,
      );
    }

    html = await response.text();
  } else if (rawHtml && typeof rawHtml === "string") {
    if (Buffer.byteLength(rawHtml, "utf8") > MAX_HTML_BYTES) {
      return jsonError(
        `HTML payload too large (max ${MAX_HTML_BYTES} bytes)`,
        413,
      );
    }
    html = rawHtml;
  } else {
    return jsonError('Provide either "url" or "html" in the request body');
  }

  const tdResult = turndown.turndown(html);
  const nhmResult = NodeHtmlMarkdown.translate(stripStyleTags(html));

  return NextResponse.json({ turndown: tdResult, nodeHtmlMarkdown: nhmResult });
}
