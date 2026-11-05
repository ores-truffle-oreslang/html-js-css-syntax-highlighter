// Host-only HTML renderer source-integrity and injection boundary controls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, htmlRenderer, createRegexLanguage} from '../src/core.js';

test('HTML attribute and token text escape independently across Unicode/CRLF boundaries', () => {
  const tokens = Object.freeze([
    Object.freeze({kind: 'plain', value: 'prefix\r\n💠'}),
    Object.freeze({kind: 'key" onclick="bad', value: '<&"\'>'}),
    Object.freeze({kind: 'plain', value: '\nfollowup'}),
  ]);
  const options = Object.freeze({classPrefix: 'tok-" data-x="p-'});
  const output = htmlRenderer.render(tokens, options);
  assert.equal(output, 'prefix\r\n💠'
    + '<span class="tok-&quot; data-x=&quot;p-key&quot; onclick=&quot;bad">&lt;&amp;&quot;&#039;&gt;</span>'
    + '\nfollowup');
  assert.equal(htmlRenderer.render(tokens, options), output);
  assert.deepEqual(tokens.map(token => token.value), ['prefix\r\n💠', '<&"\'>', '\nfollowup']);
});

test('an end-to-end highlighter leaves all text outside generated HTML tags escaped', () => {
  const grammar = createRegexLanguage({id: 'wave911-tagged', tokens: [
    {kind: 'tag', pattern: /<script>/},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [grammar]});
  const source = '💠<script>\r\n&"\' end';
  const actual = highlighter.highlight(source, 'wave911-tagged');
  assert.equal(actual,
    '💠<span class="tok-tag">&lt;script&gt;</span>\r\n&amp;&quot;&#039; end');
  assert.equal(highlighter.tokenize(source, 'wave911-tagged')
    .map(token => token.value).join(''), source);
});
