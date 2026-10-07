import { createRegexLanguage } from "../core.js";

export const javascript = createRegexLanguage({
  id: "javascript",
  aliases: ["js", "mjs", "cjs", "typescript", "ts"],
  tokens: [
    { kind: "comment", pattern: /\/\/[^\n]*|\/\*[\s\S]*?\*\// },
    { kind: "string", pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/ },
    { kind: "number", pattern: /\b(?:0[xob][0-9a-f]+|\d+(?:\.\d+)?)n?\b/i },
    { kind: "keyword", pattern: /\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|throw|try|typeof|var|void|while|with|yield)\b/ },
    { kind: "boolean", pattern: /\b(?:true|false|null|undefined)\b/ },
    { kind: "function", pattern: /\b[A-Za-z_$][\w$]*(?=\s*\()/ },
    { kind: "operator", pattern: /===|!==|=>|==|!=|<=|>=|\?\?|\?\.|&&|\|\||\+\+|--|\*\*|[=+\-*\/%<>!?&|^~]/ },
    { kind: "punctuation", pattern: /[{}()[\],;:.]/ },
  ],
});
