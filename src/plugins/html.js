import { createRegexLanguage } from "../core.js";

export const html = createRegexLanguage({
  id: "html",
  aliases: ["htm"],
  tokens: [
    { kind: "comment", pattern: /<!--[\s\S]*?-->/ },
    { kind: "doctype", pattern: /<!doctype\s+html[^>]*>/i },
    { kind: "tag", pattern: /<\/?[A-Za-z][A-Za-z0-9:-]*/ },
    { kind: "string", pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
    { kind: "attribute", pattern: /\b[A-Za-z_:][A-Za-z0-9:._-]*(?=\s*=)/ },
    { kind: "operator", pattern: /=|\/>|>/ },
    { kind: "entity", pattern: /&(?:#\d+|#x[0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]+);/ },
  ],
});
