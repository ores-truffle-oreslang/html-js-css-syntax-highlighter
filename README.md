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
The weekly `grammar-drift` job checks only public upstream source hashes,
fails when they change, and **does not auto-apply compiler edits**.
