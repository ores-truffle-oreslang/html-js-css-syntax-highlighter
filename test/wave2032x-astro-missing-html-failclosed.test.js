// Fail-closed Astro HTML renderer admission; source-owned host-only test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, htmlRenderer, SyntaxHighlighter } from '../src/core.js';
import { highlightForAstro, astroCodeProps } from '../src/adapters/astro.js';

test('Astro never silently falls back to an untrusted renderer when HTML is absent', () => {
  const grammar = createRegexLanguage({
    id: 'wave2032x-no-html',
    tokens: [{ kind: 'keyword', pattern: /return/ }],
  });
  let rawInvocations = 0;
  const untrusted = {
    kind: 'renderer', id: 'raw',
    render() {
      rawInvocations += 1;
      return '<img src=x onerror=alert(1)>';
    },
  };
  const untrustedOnly = new SyntaxHighlighter({
    languages: [grammar],
    renderers: [untrusted],
  });
  const source = '<img src=x> return & <script>';
  const options = Object.freeze({
    renderer: 'raw',
    classPrefix: 'x" onmouseover="bad-',
  });
  for (let i = 0; i < 8; i++) {
    assert.throws(
      () => highlightForAstro(untrustedOnly, source, grammar.id, options),
      /unknown renderer: html/,
    );
    assert.throws(
      () => astroCodeProps(untrustedOnly, source, grammar.id, options),
      /unknown renderer: html/,
    );
    assert.equal(rawInvocations, 0, 'missing trusted renderer must deny');
  }

  const restored = new SyntaxHighlighter({
    languages: [grammar],
    renderers: [untrusted, htmlRenderer],
  });
  const restoredOutput = highlightForAstro(restored, source, grammar.id, options);
  assert.deepEqual(astroCodeProps(restored, source, grammar.id, options), restoredOutput);
  assert.equal(rawInvocations, 0, 'restoration must not invoke raw renderer');
  assert.ok(restoredOutput.html.includes('&lt;img src=x&gt;'));
  assert.ok(restoredOutput.html.includes('&lt;script&gt;'));
  assert.ok(restoredOutput.html.includes('<span class="x&quot; onmouseover=&quot;bad-keyword">return</span>'));
  assert.ok(!restoredOutput.html.includes('<script>'));
  assert.ok(!restoredOutput.html.includes('onmouseover="bad'));
  assert.equal(restored.tokenize(source, grammar.id).map(token => token.value).join(''), source);
});
