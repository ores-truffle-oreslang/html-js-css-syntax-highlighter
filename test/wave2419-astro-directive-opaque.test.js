// Source-owned Astro lexer and safe HTML integration; not compiler guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';
import { astro } from '../src/plugins/astro.js';

test('Astro directives are recognized outside comments, quotes and frontmatter', () => {
  const source = [
    '---',
    'const marker = "client:load set:html class:list transition:fade";',
    '---',
    '<!-- client:idle class:list set:text transition:slide -->',
    '<Widget client:load class:list={["a", "b"]} set:html={"<b>"} transition:fade />',
  ].join('\r\n');
  const highlighter = new SyntaxHighlighter({ languages: [astro] });
  for (let replay = 0; replay < 18; replay++) {
    const tokens = highlighter.tokenize(source, 'astro-template');
    assert.equal(tokens.map(item => item.value).join(''), source);
    assert.ok(tokens.every(item => item.value.length > 0));
    assert.deepEqual(tokens.filter(item => item.kind === 'directive').map(item => item.value),
      ['client:load', 'class:list', 'set:html', 'transition:fade']);
    assert.deepEqual(tokens.filter(item => item.kind === 'comment').map(item => item.value),
      ['<!-- client:idle class:list set:text transition:slide -->']);
    assert.ok(tokens.some(item => item.kind === 'string' &&
      item.value === '"client:load set:html class:list transition:fade"'));
    assert.deepEqual(highlighter.tokenize(source, 'astro'), tokens);
    const html = highlighter.highlight(source, 'astro-template');
    assert.ok(html.includes('&lt;Widget'));
    assert.ok(!html.includes('<Widget'));
    assert.ok(!html.includes('<!-- client:idle'));
  }
});

test('Astro untrusted tags, quotes and script-like payload render as escaped text', () => {
  const source = '<button set:html={"<script>alert(1)</script>"} ' +
    'class:list={"\\\" onclick=\\\"bad"}>💠&</button>';
  const highlighter = new SyntaxHighlighter({languages: [astro]});
  const tokens = astro.tokenize(source);
  assert.equal(tokens.map(item => item.value).join(''), source);
  const output = highlighter.highlight(source, 'astro');
  assert.ok(output.includes('&lt;button'));
  assert.ok(output.includes('&lt;script&gt;'));
  assert.ok(output.includes('&amp;'));
  assert.ok(!output.includes('<script>'));
  assert.ok(!output.includes('onclick="bad'));
});
