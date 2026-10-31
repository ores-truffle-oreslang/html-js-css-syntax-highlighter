import { createRegexLanguage } from "../core.js";

const baseGrammar = createRegexLanguage({
  id: "oreslang",
  aliases: ["ores", "ores-lang"],
  tokens: [
    { kind: "comment", pattern: /\/\/[^\n]*|\/\*[\s\S]*?\*\// },
    { kind: "string", pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/ },
    { kind: "number", pattern: /\b\d+(?:\.\d+)?(?:ns|us|ms|s|m|h)?\b/ },
    {
      kind: "keyword",
      pattern: /\b(?:define|actor|isolated|shared|private|untrusted|critical|suspends|gen|namespace|module|class|trait|struct|interface|contract|requires|pub|static|fnc|routine|async|await|return|const|mut|val|let|infer|match|over|structural|on|switch|case|select|when|do|done|end|nb|readch|writech|spawn|is|eq|neq|and|or|as|with|if|fi|else|import|from|type|stop|recover|defer|pure|trap|nlex|gpu|quantum|cancelled|timeout)\b/,
    },
    { kind: "boolean", pattern: /\b(?:true|false)\b/ },
    { kind: "type", pattern: /\b(?:String|string|Int|int|Bool|bool|Float|float|Future|ActorRef|Option|Result|Tuple|Map|List|Set|Symbol|void)\b/ },
    { kind: "symbol", pattern: /@[A-Za-z_]\w*|\b[A-Z][A-Za-z0-9_]*\b/ },
    { kind: "operator", pattern: /\b(?:and|or)\b|\.\.\.|->|=>|::|:=|==|!=|<=|>=|\|\||&&|<>|[=+\-*\/<>!?&|]/ },
    { kind: "punctuation", pattern: /[{}()[\],;:.]/ },
  ],
});

// Mask comments and literal bodies before running context-free keyword rules.
// Oreslang block comments nest; a single lazy regex stops at the inner "*/"
// and otherwise highlights code-like text in the outer comment.
export const oreslang = {
  ...baseGrammar,
  tokenize(input) {
    const source = String(input);
    const output = [];
    let cursor = 0;
    let codeStart = 0;
    const emitCode = end => {
      if (end > codeStart) output.push(...baseGrammar.tokenize(source.slice(codeStart, end)));
    };
    while (cursor < source.length) {
      const start = cursor;
      let kind;
      if (source.startsWith('//', cursor)) {
        kind = 'comment';
        cursor += 2;
        while (cursor < source.length && source[cursor] !== '\n') cursor++;
      } else if (source.startsWith('/*', cursor)) {
        kind = 'comment';
        cursor += 2;
        let depth = 1;
        while (cursor < source.length && depth > 0) {
          if (source.startsWith('/*', cursor)) { depth++; cursor += 2; }
          else if (source.startsWith('*/', cursor)) { depth--; cursor += 2; }
          else cursor++;
        }
      } else if (source[cursor] === '"' || source[cursor] === "'" || source[cursor] === '`') {
        kind = 'string';
        const quote = source[cursor++];
        while (cursor < source.length) {
          if (source[cursor] === '\\') { cursor += Math.min(2, source.length - cursor); continue; }
          if (source[cursor++] === quote) break;
        }
      } else {
        cursor++;
        continue;
      }
      emitCode(start);
      output.push({kind, value: source.slice(start, cursor)});
      codeStart = cursor;
    }
    emitCode(source.length);
    return output;
  }
};
