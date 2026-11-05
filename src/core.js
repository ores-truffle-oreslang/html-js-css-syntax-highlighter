export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sourceOf(pattern) {
  return pattern instanceof RegExp ? pattern.source : pattern;
}

export function createRegexLanguage({ id, aliases = [], tokens }) {
  if (typeof id !== "string" || !id || !Array.isArray(aliases) ||
      aliases.some(name => typeof name !== "string" || !name) ||
      !Array.isArray(tokens) || tokens.length === 0 ||
      tokens.some(rule => !rule || typeof rule !== "object" ||
        !(rule.pattern instanceof RegExp || typeof rule.pattern === "string") ||
        (rule.kind !== undefined && (typeof rule.kind !== "string" || !rule.kind)))) {
    throw new TypeError("createRegexLanguage requires valid id, aliases and token rules");
  }

  // Flags such as /i and /s belong to each rule. Combining only .source
  // into one expression discarded them (or would make every rule insensitive).
  const rules = tokens.map((rule) => ({
    rule,
    expression: new RegExp(sourceOf(rule.pattern),
      `gm${rule.pattern instanceof RegExp && rule.pattern.unicodeSets ? 'v' : 'u'}`
      + (rule.pattern instanceof RegExp && rule.pattern.ignoreCase ? 'i' : '')
      + (rule.pattern instanceof RegExp && rule.pattern.dotAll ? 's' : '')),
  }));

  return {
    kind: "language",
    id,
    aliases,
    tokenize(code) {
      const value = String(code);
      const output = [];
      let cursor = 0;

      function nextMatch(entry, at) {
        entry.expression.lastIndex = at;
        let match = entry.expression.exec(value);
        // A token must consume source bytes. Skip zero-width matches while
        // advancing over complete Unicode scalars, never an infinite exec loop.
        while (match && match[0].length === 0) {
          entry.expression.lastIndex = match.index
            + (value.codePointAt(match.index) > 0xffff ? 2 : 1);
          match = entry.expression.exec(value);
        }
        return match;
      }
      const matches = rules.map(entry => nextMatch(entry, 0));
      while (true) {
        let chosen = -1;
        for (let i = 0; i < matches.length; i++) {
          if (matches[i] && (chosen < 0 || matches[i].index < matches[chosen].index)) {
            chosen = i;
          }
        }
        if (chosen < 0) break;
        const match = matches[chosen];
        const index = match.index;
        if (index > cursor) output.push({ kind: 'plain', value: value.slice(cursor, index) });
        output.push({ kind: rules[chosen].rule.kind ?? 'plain', value: match[0] });
        cursor = index + match[0].length;
        for (let i = 0; i < matches.length; i++) {
          if (matches[i] && matches[i].index < cursor) matches[i] = nextMatch(rules[i], cursor);
        }
      }

      if (cursor < value.length) {
        output.push({ kind: "plain", value: value.slice(cursor) });
      }

      return output;
    },
  };
}

export const htmlRenderer = {
  kind: "renderer",
  id: "html",
  render(tokens, options = {}) {
    const classPrefix = options.classPrefix ?? "tok-";

    return tokens
      .map((token) => {
        const escaped = escapeHtml(token.value);
        return token.kind === "plain"
          ? escaped
          : `<span class="${escapeHtml(classPrefix + token.kind)}">${escaped}</span>`;
      })
      .join("");
  },
};

export class SyntaxHighlighter {
  #languages = new Map();
  #renderers = new Map();

  constructor({ languages = [], renderers = [htmlRenderer] } = {}) {
    for (const renderer of renderers) this.use(renderer);
    for (const language of languages) this.use(language);
  }

  use(plugin) {
    if (!plugin || !plugin.kind || !plugin.id) {
      throw new TypeError("plugins require kind and id");
    }

    if (plugin.kind === "language") {
      if (typeof plugin.tokenize !== "function") {
        throw new TypeError(`language plugin "${plugin.id}" must provide tokenize(code)`);
      }

      // Fail closed on conflicting IDs/aliases: a later plugin must not
      // silently replace the grammar already trusted for a language.
      const names = [plugin.id, ...(plugin.aliases ?? [])];
      if (names.some(name => typeof name !== "string" || name.length === 0)) {
        throw new TypeError("language ids and aliases must be non-empty strings");
      }
      for (const name of names) {
        const previous = this.#languages.get(name);
        if (previous && previous !== plugin) {
          throw new Error(`language registration conflict: ${name}`);
        }
      }
      for (const name of names) this.#languages.set(name, plugin);
      return this;
    }

    if (plugin.kind === "renderer") {
      if (typeof plugin.render !== "function") {
        throw new TypeError(`renderer plugin "${plugin.id}" must provide render(tokens)`);
      }

      const previous = this.#renderers.get(plugin.id);
      if (previous && previous !== plugin) {
        throw new Error(`renderer registration conflict: ${plugin.id}`);
      }
      this.#renderers.set(plugin.id, plugin);
      return this;
    }

    throw new TypeError(`unknown plugin kind: ${plugin.kind}`);
  }

  language(id) {
    return this.#languages.get(id);
  }

  tokenize(code, languageId) {
    const language = this.language(languageId);
    if (!language) throw new Error(`unknown language: ${languageId}`);
    return language.tokenize(String(code));
  }

  highlight(code, languageId, options = {}) {
    const rendererId = options.renderer ?? "html";
    const renderer = this.#renderers.get(rendererId);
    if (!renderer) throw new Error(`unknown renderer: ${rendererId}`);

    return renderer.render(this.tokenize(code, languageId), options);
  }
}
