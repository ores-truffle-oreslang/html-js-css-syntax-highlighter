// Source-owned Astro adapter trust-boundary tests (not compiled guest evidence).
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, htmlRenderer, createRegexLanguage } from '../src/core.js';
import { astroCodeProps, highlightForAstro } from '../src/adapters/astro.js';

test('Astro forces trusted HTML renderer without mutating frozen hostile options', () => {
  const grammar = createRegexLanguage({
    id: 'wave2032x-astro',
    tokens: [{ kind: 'tag', pattern: /return/ }],
  });
  const calls = [];
  const untrusted = {
    kind: 'renderer',
    id: 'raw',
    render(tokens) {
      calls.push(tokens);
      return '<img src=x onerror=alert(1)>';
    },
  };
  const highlighter = new SyntaxHighlighter({
    languages: [grammar],
    renderers: [htmlRenderer, untrusted],
  });
  const options = Object.freeze({
    renderer: 'raw',
    classPrefix: 'x" autofocus onfocus="bad-',
  });
  const source = '💠 <img src=x> return & " \u2028\r\n';
  const expected = highlighter.highlight(source, grammar.id, {
    renderer: 'html',
    classPrefix: options.classPrefix,
  });
  for (let repeat = 0; repeat < 12; repeat++) {
    assert.deepEqual(highlightForAstro(highlighter, source, grammar.id, options),
      { html: expected });
    assert.deepEqual(astroCodeProps(highlighter, source, grammar.id, options),
      { html: expected });
    assert.equal(options.renderer, 'raw');
    assert.equal(options.classPrefix, 'x" autofocus onfocus="bad-');
    assert.equal(highlighter.tokenize(source, grammar.id)
      .map(token => token.value).join(''), source);
  }
  assert.equal(calls.length, 0, 'caller-supplied raw renderer must never run');
  assert.ok(expected.includes('class="x&quot; autofocus onfocus=&quot;bad-tag"'));
  assert.ok(expected.includes('&lt;img src=x&gt;'));
  assert.ok(!expected.includes('<img src=x'));
  assert.ok(!expected.includes('onfocus="bad'));
});

test('adapter returns an own HTML value for empty, plain and marked source', () => {
  const grammar = createRegexLanguage({
    id: 'wave2032x-plain',
    tokens: [{ kind: 'word', pattern: /word/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  const options = Object.freeze({ renderer: 'none' });
  for (const source of ['', '💠<&', 'word', '💠word<&']) {
    const actual = astroCodeProps(highlighter, source, grammar.id, options);
    assert.deepEqual(Object.keys(actual), ['html']);
    assert.equal(actual.html, highlighter.highlight(source, grammar.id));
  }
});
