import { createRegexLanguage } from "../core.js";

export const css = createRegexLanguage({
  id: "css",
  tokens: [
    { kind: "comment", pattern: /\/\*[\s\S]*?\*\// },
    { kind: "string", pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
    { kind: "atrule", pattern: /@[A-Za-z-]+/ },
    { kind: "hex", pattern: /#[0-9a-fA-F]{3,8}\b/ },
    { kind: "number", pattern: /\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|s|ms|deg)?\b/ },
    { kind: "property", pattern: /--?[A-Za-z][A-Za-z0-9-]*(?=\s*:)|\b[A-Za-z][A-Za-z0-9-]*(?=\s*:)/ },
    { kind: "selector", pattern: /[#.][A-Za-z_-][A-Za-z0-9_-]*/ },
    { kind: "punctuation", pattern: /[{}():;,]/ },
  ],
});
