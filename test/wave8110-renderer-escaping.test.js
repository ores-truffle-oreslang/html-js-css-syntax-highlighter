import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('hostile token kind, caller class prefix and payload cannot inject markup', () => {
  const language = createRegexLanguage({
    id: 'wave8110-attribute',
    tokens: [{ kind: 'a" onmouseover="x', pattern: /[<&"'>]+/u }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const options = Object.freeze({ classPrefix: 'x"><img src=x onerror=1>' });
  const html = highlighter.highlight('<&"\'>', 'wave8110-attribute', options);
  assert.equal(
    html,
    '<span class="x&quot;&gt;&lt;img src=x onerror=1&gt;a&quot; onmouseover=&quot;x">&lt;&amp;&quot;&#039;&gt;</span>',
  );
  assert.equal(html.includes('<img'), false);
  assert.equal(html.includes('class="x"><'), false);
  assert.deepEqual(options, { classPrefix: 'x"><img src=x onerror=1>' });
});

test('plain HTML special characters are text not a nested tag', () => {
  const language = createRegexLanguage({
    id: 'wave8110-plain',
    tokens: [{ kind: 'word', pattern: /猫/u }],
  });
  const output = new SyntaxHighlighter({ languages: [language] })
    .highlight('<script>&"\'猫</script>', 'wave8110-plain');
  assert.equal(output, '&lt;script&gt;&amp;&quot;&#039;<span class="tok-word">猫</span>&lt;/script&gt;');
});
