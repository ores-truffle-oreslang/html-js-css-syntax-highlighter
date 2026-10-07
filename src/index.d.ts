export interface Token {
  kind: string;
  value: string;
}

export interface HighlightOptions {
  renderer?: string;
  classPrefix?: string;
  [key: string]: unknown;
}

export interface LanguagePlugin {
  kind: "language";
  id: string;
  aliases?: string[];
  tokenize(code: string): Token[];
}

export interface RendererPlugin {
  kind: "renderer";
  id: string;
  render(tokens: Token[], options?: HighlightOptions): string;
}

export type HighlighterPlugin = LanguagePlugin | RendererPlugin;

export declare function escapeHtml(value: unknown): string;
export declare function createRegexLanguage(config: {
  id: string;
  aliases?: string[];
  tokens: Array<{ kind: string; pattern: RegExp | string }>;
}): LanguagePlugin;

export declare const htmlRenderer: RendererPlugin;

export declare class SyntaxHighlighter {
  constructor(options?: { languages?: LanguagePlugin[]; renderers?: RendererPlugin[] });
  use(plugin: HighlighterPlugin): this;
  language(id: string): LanguagePlugin | undefined;
  tokenize(code: string, languageId: string): Token[];
  highlight(code: string, languageId: string, options?: HighlightOptions): string;
}

export declare const oreslang: LanguagePlugin;
export declare const html: LanguagePlugin;
export declare const css: LanguagePlugin;
export declare const javascript: LanguagePlugin;
export declare const astro: LanguagePlugin;
export declare const defaultHighlighter: SyntaxHighlighter;
export declare function highlight(code: string, language: string, options?: HighlightOptions): string;
