// Host HTML renderer trust-boundary regression, not AttoLang guest parity.
import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml, htmlRenderer, createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('untrusted token kind and class prefix never become HTML attributes', () => {
  const hostileKind = 'token" onmouseover="alert(1)<tag>';
  const hostilePrefix = 'prefix" data-evasion="<svg>&';
  const hostileValue = '<svg onload="alert(2)">&"\'';
  const rendered = htmlRenderer.render([
    {kind: hostileKind, value: hostileValue},
    {kind: 'plain', value: '</span><script>alert(3)</script>'},
  ], {classPrefix: hostilePrefix});
  assert.equal(rendered,
    '<span class="' + escapeHtml(hostilePrefix + hostileKind) + '">' +
    escapeHtml(hostileValue) + '</span>' +
    escapeHtml('</span><script>alert(3)</script>'));
  assert.equal(rendered.includes('<script>'), false);
  assert.equal(rendered.includes('<svg'), false);
  assert.equal(rendered.includes(' onmouseover="'), false);
  assert.equal(rendered.includes(' onload="'), false);
});

test('hostile lexical source stays escaped on repeated highlighter render', () => {
  const language = createRegexLanguage({id: 'wave40-escaping', tokens: [
    {kind: 'word', pattern: /return/},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [language]});
  const source = '<img src=x onerror=alert(1)>return</img>';
  const expected = '&lt;img src=x onerror=alert(1)&gt;' +
    '<span class="tok-word">return</span>&lt;/img&gt;';
  for (let i = 0; i < 3; i++) {
    assert.equal(highlighter.highlight(source, 'wave40-escaping'), expected);
    assert.equal(language.tokenize(source).map(x => x.value).join(''), source);
  }
});
