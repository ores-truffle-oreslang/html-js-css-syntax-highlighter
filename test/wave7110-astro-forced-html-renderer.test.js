import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';
import { highlightForAstro, astroCodeProps } from '../src/adapters/astro.js';

test('Astro forces the safe HTML renderer despite caller-supplied plugin ID', () => {
  const language = createRegexLanguage({
    id: 'wave7110-astro',
    tokens: [{ kind: 'word', pattern: /猫/u }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  let unsafeCalls = 0;
  highlighter.use({
    kind: 'renderer',
    id: 'unsafe',
    render() {
      unsafeCalls++;
      return '<script>unsafe</script>';
    },
  });
  const options = Object.freeze({
    renderer: 'unsafe',
    classPrefix: '"><svg onload=alert(1)>',
  });
  const code = '<猫>&';
  const expected = {
    html: '&lt;<span class="&quot;&gt;&lt;svg onload=alert(1)&gt;word">猫</span>&gt;&amp;',
  };
  assert.deepEqual(highlightForAstro(highlighter, code, 'wave7110-astro', options), expected);
  assert.deepEqual(astroCodeProps(highlighter, code, 'wave7110-astro', options), expected);
  assert.equal(unsafeCalls, 0, 'untrusted renderer must not execute');
  assert.equal(options.renderer, 'unsafe', 'the adapter must not mutate caller options');
});

test('ordinary Astro markup escapes raw text without double escaping once', () => {
  const language = createRegexLanguage({
    id: 'wave7110-astro-plain',
    tokens: [{ kind: 'tag', pattern: /cat/u }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const source = '🐈<&cat';
  assert.deepEqual(highlightForAstro(highlighter, source, 'wave7110-astro-plain'), {
    html: '🐈&lt;&amp;<span class="tok-tag">cat</span>',
  });
});
