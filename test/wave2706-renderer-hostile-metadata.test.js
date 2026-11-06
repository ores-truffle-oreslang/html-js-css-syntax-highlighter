import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage, escapeHtml} from '../src/core.js';

test('source-backed lexer and HTML renderer escape hostile category and class prefix', () => {
  const evilKind = 'word" onmouseover="alert(1)" data-x="<svg/onload=1>';
  const evilPrefix = 'tok" onclick="alert(2)"><img src=x onerror=3>';
  const lexer = createRegexLanguage({
    id: 'wave2706-hostile',
    aliases: ['wave2706-alias'],
    tokens: [{kind: evilKind, pattern: /X+/}],
  });
  const highlighter = new SyntaxHighlighter({languages: [lexer]});
  const source = '🚀<& "quoted" X & X\n<tag attr="x"> \'end\'';
  const expected = highlighter.tokenize(source, 'wave2706-alias');
  assert.equal(expected.map(entry => entry.value).join(''), source);
  assert.equal(expected.filter(t => t.kind === evilKind).length, 2);
  assert.equal(expected.filter(t => t.kind === evilKind).map(t => t.value).join(','), 'X,X');

  const markup = highlighter.highlight(source, 'wave2706-alias', {classPrefix: evilPrefix});
  const expectedMarkup = expected.map(entry => entry.kind === 'plain' ?
    escapeHtml(entry.value) :
    '<span class="' + escapeHtml(evilPrefix + entry.kind) + '">' +
      escapeHtml(entry.value) + '</span>').join('');
  assert.equal(markup, expectedMarkup);
  assert.equal(markup.replace(/<span class="[^"]*">|<\/span>/g, ''), escapeHtml(source));
  assert.equal(markup.includes('<img'), false);
  assert.equal(markup.includes('<svg'), false);
  assert.equal(markup.includes(' onclick="'), false);
  assert.equal(markup.includes(' onmouseover="'), false);
  assert.equal(markup.includes('<tag'), false);
});
