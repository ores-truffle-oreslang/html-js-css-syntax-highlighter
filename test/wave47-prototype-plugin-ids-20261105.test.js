// Source-owned regression for plugin registry identity; no guest compiler claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('built-in object property names remain independent language IDs', () => {
  const highlighter = new SyntaxHighlighter();
  for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    const language = createRegexLanguage({
      id: name, tokens: [{ kind: 'keyword', pattern: /task/ }],
    });
    highlighter.use(language);
    assert.equal(highlighter.language(name), language);
    assert.equal(
      highlighter.highlight('task', name),
      '<span class="tok-keyword">task</span>',
    );
  }

  highlighter.use({
    kind: 'renderer', id: '__proto__',
    render(tokens) { return tokens.map(token => token.value).join(''); },
  });
  assert.equal(
    highlighter.highlight('task', 'constructor', { renderer: '__proto__' }),
    'task',
  );
  assert.throws(
    () => highlighter.use(createRegexLanguage({
      id: 'constructor', tokens: [{ kind: 'conflict', pattern: /task/ }],
    })),
    /language registration conflict/,
  );
  assert.equal(
    highlighter.highlight('task', 'constructor'),
    '<span class="tok-keyword">task</span>',
  );
});
