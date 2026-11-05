import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, htmlRenderer } from '../src/core.js';
import { oreslang } from '../src/plugins/oreslang.js';
import { highlightForAstro, astroCodeProps } from '../src/adapters/astro.js';

// Host-side Astro integration trust-boundary regression only.
test('Astro adapter cannot select an untrusted renderer through caller options', () => {
  const unsafeRenderer = {
    kind: 'renderer', id: 'unsafe',
    render: () => '<img src=x onerror=1>',
  };
  const highlighter = new SyntaxHighlighter({
    languages: [oreslang],
    renderers: [htmlRenderer, unsafeRenderer],
  });
  const source = 'return #"<img src=x onerror=1>";';
  const options = { renderer: 'unsafe', classPrefix: 'code" onmouseover="x-' };
  const expected = highlighter.highlight(source, 'oreslang', {
    ...options, renderer: 'html',
  });

  const fromHighlight = highlightForAstro(highlighter, source, 'oreslang', options);
  const fromProps = astroCodeProps(highlighter, source, 'oreslang', options);
  assert.deepEqual(fromHighlight, { html: expected });
  assert.deepEqual(fromProps, { html: expected });
  assert.match(expected, /&lt;img src=x onerror=1&gt;/);
  assert.doesNotMatch(expected, /<img|onmouseover="x-/);
  assert.ok(expected.includes('class="code&quot; onmouseover=&quot;x-'));
});
