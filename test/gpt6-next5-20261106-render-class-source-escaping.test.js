import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('hostile token class and prefix cannot escape an HTML attribute', () => {
  const grammar = createRegexLanguage({
    id: 'next5-escape',
    tokens: [{ kind: 'k"&<>', pattern: /TOKEN/ }]
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  const options = { classPrefix: 'p"&<>' };
  const source = 'TOKEN<>&"\'';
  const expected = '<span class="p&quot;&amp;&lt;&gt;k&quot;&amp;&lt;&gt;">TOKEN</span>' +
    '&lt;&gt;&amp;&quot;&#039;';
  assert.equal(highlighter.highlight(source, grammar.id, options), expected);
  assert.equal(highlighter.highlight(source, grammar.id, options), expected);
  assert.deepEqual(options, { classPrefix: 'p"&<>' }, 'renderer options are caller-owned');
});

test('plain tokens also escape dangerous input without emitting markup', () => {
  const grammar = createRegexLanguage({
    id: 'next5-plain-escape',
    tokens: [{ kind: 'match', pattern: /TOKEN/ }]
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  const source = '<script>x&"\'</script>';
  assert.equal(highlighter.highlight(source, grammar.id),
    '&lt;script&gt;x&amp;&quot;&#039;&lt;/script&gt;');
});
