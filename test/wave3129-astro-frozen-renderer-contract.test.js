import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, htmlRenderer} from '../src/core.js';
import {oreslang} from '../src/plugins/oreslang.js';
import {html} from '../src/plugins/html.js';
import {highlightForAstro, astroCodeProps} from '../src/adapters/astro.js';

// The Astro adapter is the last trust boundary before injecting HTML.
test('frozen caller options cannot select an unsafe renderer or mutate grammar state', () => {
  let unsafeCalls = 0;
  const unsafe = {kind: 'renderer', id: 'wave3129-unsafe', render() {
    unsafeCalls++;
    return '<img src=x onerror=alert(1)>';
  }};
  const highlighter = new SyntaxHighlighter({
    languages: [oreslang, html], renderers: [htmlRenderer, unsafe],
  });
  const options = Object.freeze({
    renderer: 'wave3129-unsafe',
    classPrefix: 'x" onmouseover="evil<&',
  });
  const source = '💠 <script> #ready "quoted" &\r\n <img onerror="evil">';
  const expectedAttrs = 'class="x&quot; onmouseover=&quot;evil&lt;&amp;';
  for (const lang of ['oreslang', 'ores', 'html', 'htm']) {
    const direct = highlighter.highlight(source, lang, {...options, renderer: 'html'});
    for (let run = 0; run < 5; run++) {
      assert.deepEqual(highlightForAstro(highlighter, source, lang, options), {html: direct});
      assert.deepEqual(astroCodeProps(highlighter, source, lang, options), {html: direct});
      assert.ok(direct.includes(expectedAttrs));
      assert.ok(direct.includes('💠'));
      assert.ok(direct.includes('\r\n'));
      assert.doesNotMatch(direct, /<script|<img/i);
      assert.doesNotMatch(direct, /onmouseover="evil/);
    }
  }
  assert.equal(unsafeCalls, 0, 'untrusted custom renderer may never be called');
  assert.equal(options.renderer, 'wave3129-unsafe');
  assert.equal(options.classPrefix, 'x" onmouseover="evil<&');
});
