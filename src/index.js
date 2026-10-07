import { SyntaxHighlighter, createRegexLanguage, escapeHtml, htmlRenderer } from "./core.js";
import { oreslang } from "./plugins/oreslang.js";
import { html } from "./plugins/html.js";
import { css } from "./plugins/css.js";
import { javascript } from "./plugins/javascript.js";
import { astro } from "./plugins/astro.js";

export { SyntaxHighlighter, createRegexLanguage, escapeHtml, htmlRenderer };
export { oreslang, html, css, javascript, astro };

export const defaultHighlighter = new SyntaxHighlighter({
  languages: [oreslang, html, css, javascript, astro],
});

export function highlight(code, language, options) {
  return defaultHighlighter.highlight(code, language, options);
}
