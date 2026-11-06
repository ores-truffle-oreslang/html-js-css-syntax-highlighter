import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, htmlRenderer } from '../src/core.js';
import { css } from '../src/plugins/css.js';
import { highlightForAstro, astroCodeProps } from '../src/adapters/astro.js';

test('Astro never invokes attacker-selected renderer; frozen hostile options stay intact', () => {
  let unsafeCalls = 0;
  const unsafe = {kind: 'renderer', id: 'unsafe',
    render: () => { unsafeCalls++; return '<script>alert(1)</script>'; }};
  const highlighter = new SyntaxHighlighter({
    languages: [css], renderers: [htmlRenderer, unsafe]
  });
  const source = '.x{content:"<&";color:#abc;}';
  const options = Object.freeze({
    renderer: 'unsafe',
    classPrefix: 'x" onmouseover="evil&<-',
  });
  const original = {...options};
  const safe = highlighter.highlight(source, 'css', {...options, renderer: 'html'});
  assert.match(safe, /&lt;&amp;/);
  assert.match(safe, /class="x&quot; onmouseover=&quot;evil&amp;&lt;-/);
  assert.doesNotMatch(safe, /<script|onmouseover="evil&/);
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(highlightForAstro(highlighter, source, 'css', options), {html: safe});
    assert.deepEqual(astroCodeProps(highlighter, source, 'css', options), {html: safe});
    assert.deepEqual(options, original);
  }
  assert.equal(unsafeCalls, 0);
  assert.equal(Object.isFrozen(options), true);
});
