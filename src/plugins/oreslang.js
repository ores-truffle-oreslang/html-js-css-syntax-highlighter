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
    { kind: "runtimeGlobal", pattern: /\b(?:recover|defer|throw|raise)\b/ },
    {
      kind: "keyword",
      pattern: /\b(?:define|actor|isoactor|isolated|shared|private|untrusted|critical|suspends|gen|namespace|module|class|trait|struct|interface|contract|requires|pub|static|fnc|routine|async|await|return|const|mut|val|let|infer|match|over|structural|on|switch|case|select|when|do|done|end|nb|readch|writech|spawn|and|or|as|with|if|fi|else|import|from|type|stop|recover|defer|pure|trap|nlex|cpu|gpu|quantum|panic|null|cancelled|timeout|abstract|arr|block|break|catch|cb|conforms|continue|def|default|elif|elseif|extends|finally|for|generator|impl|implements|loop|matches|new|obj|of|rt|self|super|then|try|typeof|types|while|yield)\b/,
    },
    { kind: "boolean", pattern: /\b(?:true|false)\b/ },
    { kind: "type", pattern: /\b(?:String|string|Int|int|Bool|bool|Float|float|Future|ActorRef|Option|Result|Tuple|Map|List|Set|Symbol|void)\b/ },
    // Hash-prefixed Symbol literals are distinct from annotations and strings.
    { kind: "symbol", pattern: /#[A-Za-z_][A-Za-z0-9_]{0,127}(?![A-Za-z0-9_])|@[A-Za-z_]\w*|\b[A-Z][A-Za-z0-9_]*\b/ },
    // The pinned compiler lexer reserves eq/neq/is (not valid binding identifiers).
    { kind: "operator", pattern: /\b(?:eq|neq|is)\b/ },
    { kind: "operator", pattern: /\b(?:and|or)\b|\.\.\.|->|=>|::|:=|==|!=|<=|>=|\|\||&&|<>|[=+\-*\/<>!?&|%^]/ },
    { kind: "punctuation", pattern: /[{}()[\],;:.]/ },
  ],
});

// Mirrors the pinned Java lexer/OresSymbol's strict literal admission for
// highlighting only. Parser/typechecking still require compiler execution.
function validSymbolName(value) {
  if (!value || value.length > 1024) return false;
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      i++;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) return false;
  }
  const canonical = value.normalize("NFC");
  if (new TextEncoder().encode(canonical).length > 256) return false;
  for (const scalar of canonical) {
    const point = scalar.codePointAt(0);
    if (point < 0x20 || (point >= 0x7f && point <= 0x9f) ||
        /[\p{Cf}\p{Zl}\p{Zp}]/u.test(scalar)) return false;
  }
  return true;
}

function readQuotedSymbol(source, start) {
  const quote = source[start + 1];
  let end = start + 2;
  let decoded = "";
  let invalid = false;
  let closed = false;
  while (end < source.length) {
    if (source[end] === "\n" || source[end] === "\r") break;
    const character = source[end++];
    if (character === quote) { closed = true; break; }
    if (character !== "\\") {
      decoded += character;
    } else {
      if (end >= source.length || source[end] === "\n" || source[end] === "\r") {
        invalid = true;
        break;
      }
      const escape = source[end++];
      if (escape === "u") {
        const digits = source.slice(end, end + 4);
        if (/^[0-9A-Fa-f]{4}$/.test(digits)) {
          decoded += String.fromCharCode(parseInt(digits, 16));
          end += 4;
        } else invalid = true;
      } else if (escape === "n") decoded += "\n";
      else if (escape === "r") decoded += "\r";
      else if (escape === "t") decoded += "\t";
      else if (escape === '"' || escape === "'" || escape === "\\") decoded += escape;
      else invalid = true;
    }
    if (decoded.length > 1024) invalid = true;
  }
  return { end, valid: closed && !invalid && validSymbolName(decoded) };
}

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
        const symbol = readQuotedSymbol(source, cursor);
        kind = symbol.valid ? 'symbol' : 'plain';
        cursor = symbol.end;
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
