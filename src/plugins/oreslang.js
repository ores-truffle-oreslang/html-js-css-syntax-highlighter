import { createRegexLanguage } from "../core.js";

const baseGrammar = createRegexLanguage({
  id: "oreslang",
  aliases: ["ores", "ores-lang"],
  tokens: [
    { kind: "comment", pattern: /\/\/[^\n]*|\/\*[\s\S]*?\*\// },
    { kind: "string", pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/ },
    { kind: "number", pattern: /\b\d+(?:\.\d+)?(?:ns|us|ms|s|m|h)?\b/ },
    // Compound keywords are recognized as a unit; none of these spellings
    // should be broken into two unrelated identifiers around the hyphen.
    { kind: "keyword", pattern: /\b(?:critical-read|critical-write|nb-select|transform-pipe)\b/ },
    {
      kind: "keyword",
      pattern: /\b(?:define|actor|isolated|shared|private|untrusted|critical|suspends|gen|namespace|module|class|trait|struct|interface|contract|requires|pub|static|fnc|routine|async|await|return|const|mut|val|let|infer|match|over|structural|on|switch|case|select|when|do|done|end|nb|readch|writech|spawn|and|or|as|with|if|fi|else|import|from|type|stop|recover|defer|pure|trap|nlex|gpu|quantum|cancelled|timeout)\b/,
    },
    { kind: "boolean", pattern: /\b(?:true|false)\b/ },
    { kind: "type", pattern: /\b(?:String|string|Int|int|Bool|bool|Float|float|Future|ActorRef|Option|Result|Tuple|Map|List|Set|Symbol|void)\b/ },
    // Hash-prefixed Symbol literals are distinct from annotations and strings.
    { kind: "symbol", pattern: /#[A-Za-z_][A-Za-z0-9_]*|@[A-Za-z_]\w*|\b[A-Z][A-Za-z0-9_]*\b/ },
    // These comparison words are contextual; a binding named "eq" stays plain.
    { kind: "operator", pattern: /(?<=[A-Za-z0-9_)]\s+)(?:eq|neq|is)\b(?=\s+[A-Za-z0-9_(])/ },
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
      if (end > codeStart) {
        // A large Oreslang file can produce more tokens than the JS argument
        // limit; spreading the entire token array throws RangeError.
        for (const token of baseGrammar.tokenize(source.slice(codeStart, end))) {
          output.push(token);
        }
      }
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
      } else if (source[cursor] === '#' &&
                 (source[cursor + 1] === '"' || source[cursor + 1] === "'")) {
        // Quoted Symbols allow spaces and escapes. Treat the entire literal
        // as a Symbol so the quoted body is never mistaken for a string.
        kind = 'symbol';
        const quote = source[cursor + 1];
        cursor += 2;
        while (cursor < source.length) {
          if (source[cursor] === '\\') { cursor += Math.min(2, source.length - cursor); continue; }
          if (source[cursor++] === quote) break;
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
