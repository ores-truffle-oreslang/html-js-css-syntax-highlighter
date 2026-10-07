import type { HighlightOptions, SyntaxHighlighter } from "../index.js";

export declare function highlightForAstro(
  highlighter: SyntaxHighlighter,
  code: string,
  language: string,
  options?: HighlightOptions,
): { html: string };

export declare function astroCodeProps(
  highlighter: SyntaxHighlighter,
  code: string,
  language: string,
  options?: HighlightOptions,
): { html: string };
