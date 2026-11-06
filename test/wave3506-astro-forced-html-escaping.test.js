// Security contract for Astro adapter renderer routing and escaped attributes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';
import { highlightForAstro, astroCodeProps } from '../src/adapters/astro.js';

test('Astro forces trusted HTML renderer and escapes hostile class/text metadata', () => {
  let unsafeCalls = 0;
  const highlighter = new SyntaxHighlighter({
    languages: [createRegexLanguage({
      id: 'wave3506-astro',
      tokens: [{ kind: 'code', pattern: /<&/ }],
    })],
  });
  highlighter.use({
    kind: 'renderer', id: 'unsafe',
    render() { unsafeCalls++; return '<script>unsafe</script>'; },
  });
  const options = Object.freeze({
    renderer: 'unsafe',
    classPrefix: 'p" onclick="evil',
  });
  const source = '<&A\'"🐈';
  const expected = '<span class="p&quot; onclick=&quot;evilcode">&lt;&amp;</span>A&#039;&quot;🐈';

  for (let i = 0; i < 3; i++) {
    assert.deepEqual(highlightForAstro(highlighter, source, 'wave3506-astro', options), { html: expected });
    assert.deepEqual(astroCodeProps(highlighter, source, 'wave3506-astro', options), { html: expected });
    assert.equal(unsafeCalls, 0, 'untrusted renderer cannot be invoked by the adapter');
    assert.equal(options.renderer, 'unsafe', 'caller options remain unchanged');
  }
});
