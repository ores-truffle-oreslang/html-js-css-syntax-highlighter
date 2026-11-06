import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultHighlighter} from '../src/index.js';

const cases = [
  ['html', '<!DOCTYPE HTML>\r\n<div data-x="A&B">🙂&</div>'],
  ['css', '/* <🙂& */\r\n.foo { content: "<&"; color: #f00; }'],
  ['javascript', 'const greeting = "<🙂&";\r\n// template: `x`\n'],
  ['astro', '---\r\nconst greeting = "<🙂&";\r\n---\r\n<div>hi</div>'],
  ['oreslang', 'define actor Sample as\r\n  let value = "<🙂&";\r\nend'],
];

test('built-in grammar tokenization conserves Unicode scalars and CRLF on repeat', () => {
  for (const [language, source] of cases) {
    assert.equal(defaultHighlighter.language(language)?.id, language);
    const first = defaultHighlighter.tokenize(source, language);
    const second = defaultHighlighter.tokenize(source, language);
    assert.equal(first.map(item => item.value).join(''), source, language);
    assert.deepEqual(second, first, language + ' must not retain RegExp state');
    assert.ok(first.every(item => typeof item.kind === 'string' &&
      typeof item.value === 'string' && item.value.length), language);
  }
});

test('HTML render output escapes source and hostile caller-controlled class prefixes', () => {
  const hostile = 'safe" onclick="alert(1)&<';
  for (const [language, source] of cases) {
    const first = defaultHighlighter.highlight(source, language, {classPrefix: hostile});
    const second = defaultHighlighter.highlight(source, language, {classPrefix: hostile});
    assert.equal(first, second, language);
    assert.ok(first.includes('&lt;'), language + ' must HTML-escape less-than signs');
    assert.ok(first.includes('&amp;'), language + ' must HTML-escape ampersands');
    assert.ok(!first.includes('onclick="alert(1)'), language + ' must not create event attributes');
  }
});
