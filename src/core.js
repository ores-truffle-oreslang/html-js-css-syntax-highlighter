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
  if (!id || !Array.isArray(tokens) || tokens.length === 0) {
    throw new TypeError("createRegexLanguage requires an id and at least one token rule");
  }

  const expression = new RegExp(
    tokens.map(({ pattern }, index) => `(?<t${index}>${sourceOf(pattern)})`).join("|"),
    "gmu",
  );

  return {
    kind: "language",
    id,
    aliases,
    tokenize(code) {
      const value = String(code);
      const output = [];
      let cursor = 0;

      expression.lastIndex = 0;

      for (const match of value.matchAll(expression)) {
        const index = match.index ?? 0;

        if (index > cursor) {
          output.push({ kind: "plain", value: value.slice(cursor, index) });
        }

        const group = Object.entries(match.groups ?? {}).find(([, part]) => part !== undefined);
        const tokenIndex = group ? Number(group[0].slice(1)) : -1;
        const rule = tokens[tokenIndex];

        output.push({
          kind: rule?.kind ?? "plain",
          value: match[0],
        });

        cursor = index + match[0].length;
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

      this.#languages.set(plugin.id, plugin);
      for (const alias of plugin.aliases ?? []) {
        this.#languages.set(alias, plugin);
      }
      return this;
    }

    if (plugin.kind === "renderer") {
      if (typeof plugin.render !== "function") {
        throw new TypeError(`renderer plugin "${plugin.id}" must provide render(tokens)`);
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
