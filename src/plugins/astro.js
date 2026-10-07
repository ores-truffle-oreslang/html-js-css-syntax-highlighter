import { createRegexLanguage } from "../core.js";

export const astro = createRegexLanguage({
  id: "astro",
  aliases: ["astro-template"],
  tokens: [
    { kind: "frontmatter", pattern: /^---\s*$|^---\s*(?=\n)/ },
    { kind: "comment", pattern: /<!--[\s\S]*?-->|\/\/[^\n]*|\/\*[\s\S]*?\*\// },
    { kind: "string", pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/ },
    { kind: "tag", pattern: /<\/?[A-Za-z][A-Za-z0-9:._-]*/ },
    { kind: "directive", pattern: /\b(?:set:html|set:text|class:list|client:[A-Za-z-]+|transition:[A-Za-z-]+)\b/ },
    { kind: "keyword", pattern: /\b(?:import|export|from|const|let|var|if|else|for|await|async|return|new|true|false|null|undefined)\b/ },
    { kind: "attribute", pattern: /\b[A-Za-z_:][A-Za-z0-9:._-]*(?=\s*=)/ },
    { kind: "expression", pattern: /\{|\}/ },
    { kind: "operator", pattern: /=>|===|!==|==|!=|<=|>=|&&|\|\||[=+\-*\/%<>!?]/ },
    { kind: "punctuation", pattern: /[()[\],;:.]/ },
  ],
});
