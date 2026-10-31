# html-js-css-syntax-highlighter

A small, dependency-free syntax highlighter with two kinds of plugins:

- **language plugins** tokenize source code;
- **renderer / template adapters** turn tokens into safe output for a rendering environment.

Bundled language plugins currently cover Oreslang, HTML, CSS, JavaScript/TypeScript, and Astro templates.

## Oreslang

```js
import { highlight } from "@ores-truffle-oreslang/html-js-css-syntax-highlighter";

const html = highlight(source, "oreslang");
```

Oreslang aliases `ores` and `ores-lang` are also registered.

The bundled Oreslang grammar explicitly recognizes contextual language words used in current examples, including `match`, `over`, `on`, and `end`.

## Astro

The Astro adapter keeps framework-specific glue out of the core:

```astro
---
import { defaultHighlighter } from "@ores-truffle-oreslang/html-js-css-syntax-highlighter";
import { highlightForAstro } from "@ores-truffle-oreslang/html-js-css-syntax-highlighter/adapters/astro";

const { html } = highlightForAstro(defaultHighlighter, code, "oreslang");
---

<pre><code set:html={html}></code></pre>
```

## Plugin API

A language plugin has this shape:

```js
{
  kind: "language",
  id: "my-language",
  aliases: ["my"],
  tokenize(code) {
    return [
      { kind: "keyword", value: "..." },
      { kind: "plain", value: "..." }
    ];
  }
}
```

Register it on a `SyntaxHighlighter` with `.use(plugin)`.

Regex-based grammars can use `createRegexLanguage()`, while more complicated languages can provide their own tokenizer without changing the renderer.

A renderer plugin has `kind: "renderer"`, an `id`, and `render(tokens, options)`. The included HTML renderer escapes source text before producing token spans.

## CSS contract

The default renderer emits classes such as:

- `tok-keyword`
- `tok-string`
- `tok-number`
- `tok-type`
- `tok-comment`
- `tok-operator`
- `tok-punctuation`

Consumers own the colors and typography.

## Tests

```bash
npm test
npm run check
```

## Language security and parity

The Oreslang grammar treats nested `/* ... */` comments and quoted/template literals as opaque spans before applying keyword rules, preventing comment text from masquerading as executable code. Current actor keywords include `isolated`, `critical`, and `suspends`; removed symbolic `%`, `^`, and `^^` operators are not colored as valid Oreslang operators. Rendering escapes HTML, and duplicate renderer registrations fail closed.

## Compiler-pinned cross-editor corpus

`conformance/oreslang-syntax-v1.json` is byte-identical to the manifest in the
VS Code and Sublime repos. It pins Java lexer and EBNF Git blob hashes and
separately records forward-looking Oreslang syntax decisions. Source-free
`test/conformance.test.js` verifies token conservation, keyword and runtime
color classes, Symbol boundaries and negative examples.

The Java compiler's pinned `main` still accepts tokens including `isoactor`,
`null`, `%` and `^`, which are deliberately excluded by the editor target.
Keep this discrepancy visible until compiler-backed tests establish migration.
The shared editor conformance suite now contains **50 adversarial cases**.
CI checks real HTML token streams, token conservation, and escaping, but
does not establish parser/guest execution or VS Code/Sublime engine behavior.

**Privacy boundary:** The compiler source repository is private. Public
workflows may not fetch or mirror its code or pretend unauthenticated raw
GitHub requests are a reliable drift oracle. The scheduled public watcher
was removed. Private compiler-side lexical/parser evidence is staged
separately in oreslang-source.java PR #2350; it has no executed CI steps.
Merge requires independent review and authentic compiler-backed evidence.

## Browser DOM security gate

`browser/browser-smoke.mjs` is a separate Chromium/Playwright CI job exercising real DOM parsing rather than regex-only markup assertions. It requires `npm install --ignore-scripts`, `npx playwright install --with-deps chromium`, and `node browser/browser-smoke.mjs`. The test checks HTML entity roundtrips, absence of active injected elements, and escaped hostile `classPrefix` attributes. It does not prove a compiler build or all browser engines.

## Separate current and target language profiles

`src/plugins/oreslang.js` is the default compiler-current highlighter; this is the only Oreslang plugin registered by default. `src/plugins/oreslang-target-preview.js` exports an explicitly unregistered `oreslangPreview` for 50-case proposed-language conformance tests. It is **not** proof of current compiler or guest acceptance. Browser HTML safety tests run on the default; preview fixtures run on the preview tokenizer. Promotion requires private compiler evidence and independent review.
