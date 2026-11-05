import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('a source object is converted once without repeated side effects', () => {
  const grammar = createRegexLanguage({
    id: 'wave610-source-object',
    tokens: [{ kind: 'cat', pattern: /猫/u }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  let conversions = 0;
  const source = {
    toString() {
      conversions++;
      return '<x>&猫';
    },
  };
  const html = highlighter.highlight(source, 'wave610-source-object');
  assert.equal(conversions, 1);
  assert.equal(html, '&lt;x&gt;&amp;<span class="tok-cat">猫</span>');
});

test('a hostile class prefix remains data rather than becoming an HTML attribute', () => {
  const grammar = createRegexLanguage({
    id: 'wave610-attribute',
    tokens: [{ kind: 'word', pattern: /猫/u }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  const html = highlighter.highlight('猫', 'wave610-attribute', {
    classPrefix: '"><script>',
  });
  assert.equal(html, '<span class="&quot;&gt;&lt;script&gt;word">猫</span>');
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('class=""><script>'), false);
});
