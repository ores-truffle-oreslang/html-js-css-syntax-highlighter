export function highlightForAstro(highlighter, code, language, options = {}) {
  return {
    html: highlighter.highlight(code, language, {
      ...options,
      renderer: "html",
    }),
  };
}

export function astroCodeProps(highlighter, code, language, options = {}) {
  const { html } = highlightForAstro(highlighter, code, language, options);
  return { html };
}
