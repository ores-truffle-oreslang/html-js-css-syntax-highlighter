import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter, htmlRenderer } from '../src/core.js';

test('prototype-like names remain ordinary, separately owned language and renderer keys', () => {
  const language = createRegexLanguage({
    id: '__proto__',
    aliases: ['constructor', 'toString', 'hasOwnProperty'],
    tokens: [{ kind: 'word', pattern: /return/ }],
  });
  let customCalls = 0;
  const custom = {
    kind: 'renderer', id: '__proto__',
    render(tokens) {
      customCalls++;
      return tokens.map(t => t.value).join('');
    },
  };
  const highlighter = new SyntaxHighlighter({
    languages: [language], renderers: [htmlRenderer, custom],
  });
  const source = 'return "<&\u0027";';
  const expectedHtml = '<span class="tok-word">return</span> &quot;&lt;&amp;&#039;&quot;;';

  for (let i = 0; i < 16; i++) {
    for (const alias of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      assert.equal(highlighter.language(alias), language);
      assert.equal(highlighter.highlight(source, alias), expectedHtml);
    }
    assert.equal(highlighter.highlight(source, 'constructor', { renderer: '__proto__' }), source);
  }
  assert.equal(customCalls, 16);
  assert.throws(() => highlighter.highlight(source, 'valueOf'), /unknown language/);
  assert.throws(() => highlighter.highlight(source, 'constructor', {renderer: 'valueOf'}), /unknown renderer/);
  assert.throws(() => highlighter.use({
    kind: 'language', id: 'collision', aliases: ['__proto__'], tokenize: () => [],
  }), /registration conflict/);
  assert.equal(highlighter.highlight(source, 'constructor'), expectedHtml);
});
