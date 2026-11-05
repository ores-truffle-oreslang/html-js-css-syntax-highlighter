import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer, SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

// Source-only HTML output checks, not a browser security or compiler parity proof.
test('hostile renderer class prefixes and token kinds never create extra attributes', () => {
  const prefix = '\" onclick=\"alert(1)&<\'';
  const kind = 'word\" data-x=\"<unsafe>&\'';
  const value = '<script attr=\"x\">&\'🌐</script>';
  const tokens = Object.freeze([
    Object.freeze({kind: 'plain', value: '<&>'}),
    Object.freeze({kind, value}),
    Object.freeze({kind: 'plain', value: '&\"\''}),
  ]);
  const expected = '&lt;&amp;&gt;'
    + '<span class=\"&quot; onclick=&quot;alert(1)&amp;&lt;&#039;word&quot; data-x=&quot;&lt;unsafe&gt;&amp;&#039;\">'
    + '&lt;script attr=&quot;x&quot;&gt;&amp;&#039;🌐&lt;/script&gt;</span>'
    + '&amp;&quot;&#039;';
  for (let pass = 0; pass < 5; pass++) {
    assert.equal(htmlRenderer.render(tokens, {classPrefix: prefix}), expected);
    assert.equal(tokens[1].kind, kind);
    assert.equal(tokens[1].value, value);
  }
});

test('HTML rendering does not affect later lexical reconstruction', () => {
  const grammar = createRegexLanguage({id: 'wave231211-html-language', tokens: [
    {kind: 'tag', pattern: /return/},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [grammar]});
  const source = '🌐<&\r\nreturn\0\"\'&>';
  const expected = '🌐&lt;&amp;\r\n<span class=\"tok-tag\">return</span>\0&quot;&#039;&amp;&gt;';
  for (let pass = 0; pass < 4; pass++) {
    assert.equal(highlighter.highlight(source, grammar.id), expected);
    assert.equal(highlighter.tokenize(source, grammar.id).map(x => x.value).join(''), source);
  }
});