import { createRegexLanguage } from "../core.js";

export const oreslang = createRegexLanguage({
  id: "oreslang",
  aliases: ["ores", "ores-lang"],
  tokens: [
    { kind: "comment", pattern: /\/\/[^\n]*|\/\*[\s\S]*?\*\// },
    { kind: "string", pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/ },
    { kind: "number", pattern: /\b\d+(?:\.\d+)?(?:ns|us|ms|s|m|h)?\b/ },
    {
      kind: "keyword",
      pattern: /\b(?:define|actor|shared|private|untrusted|module|class|trait|struct|interface|contract|requires|pub|static|fnc|routine|async|await|return|const|mut|val|let|infer|match|over|structural|on|switch|case|select|when|do|done|end|nb|readch|writech|spawn|is|eq|neq|and|or|as|with|if|fi|else|import|from|type|stop|recover|defer|pure|trap|nlex|gpu|quantum|cancelled|timeout)\b/,
    },
    { kind: "boolean", pattern: /\b(?:true|false)\b/ },
    { kind: "type", pattern: /\b(?:String|string|Int|int|Bool|bool|Float|float|Future|ActorRef|Option|Result|Tuple|Map|List|Set|Symbol|void)\b/ },
    { kind: "symbol", pattern: /@[A-Za-z_]\w*|\b[A-Z][A-Za-z0-9_]*\b/ },
    { kind: "operator", pattern: /\.\.\.|->|=>|::|:=|==|!=|<=|>=|\|\||&&|\^\^|<>|[=+\-*\/%<>!?&|]/ },
    { kind: "punctuation", pattern: /[{}()[\],;:.]/ },
  ],
});
