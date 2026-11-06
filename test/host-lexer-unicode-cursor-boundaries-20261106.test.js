import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHighlighter, highlight, createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

const reconstruct = tokens => tokens.map(token => token.value).join('');

test('all shipped syntax grammars preserve Unicode, CRLF and hostile markup bytes', () => {
  const cases = [
    ['oreslang', 'pub fnc hello(): int { /* 🦊 */ return 42; }\r\n<svg onload="alert(1)">'],
    ['html', '<a title="&#x27;\r\n🦊">text</a>\r\n<script>alert(1)</script>'],
    ['css', '/* 🦊 */\r\n.x::before { content: "<svg onload=evil>"; }'],
    ['javascript', 'const emoji = "🦊";\r\n/* <img onerror=evil> */\nreturn 0;'],
    ['astro', '---\r\nconst a = "🦊";\r\n---\r\n<div set:html="<script>"></div>'],
  ];
  for (const [language, source] of cases) {
    const tokens = defaultHighlighter.tokenize(source, language);
    assert.equal(reconstruct(tokens), source, language);
    const rendered = highlight(source, language);
    assert.ok(!rendered.includes('<script'), language);
    assert.ok(!rendered.includes('<svg'), language);
    assert.ok(!rendered.includes('<img'), language);
    assert.ok(rendered.includes('&lt;') || !source.includes('<'), language);
  }
});

test('zero-width lookahead cannot drop astral scalars or mutate caller regex cursor', () => {
  const matcher = /TOKEN/gi;
  matcher.lastIndex = 8;
  const language = createRegexLanguage({
    id: 'zero-width-boundary-fixture',
    tokens: [
      { kind: 'zero', pattern: /(?=.)/ },
      { kind: 'token', pattern: matcher },
    ],
  });
  const h = new SyntaxHighlighter({ languages: [language] });
  let seed = 0xa46b90e1;
  for (let i = 0; i < 256; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const source = ('🦊'.repeat(seed % 9)) + 'TOKEN\r\n' +
      ('日'.repeat((seed >>> 5) % 13)) + '<&"\'\u0000>' + ' token';
    const tokens = h.tokenize(source, language.id);
    assert.equal(reconstruct(tokens), source, String(i));
    assert.equal(matcher.lastIndex, 8, 'caller-owned RegExp.lastIndex was mutated');
    const html = h.highlight(source, language.id);
    assert.ok(!html.includes('<&'), String(i));
    assert.ok(!html.includes('<script'), String(i));
  }
});

test('compiled grammar isolates rule kind and alias metadata after caller mutation', () => {
  const aliases = ['stable-alias'];
  const rule = { pattern: /SAFE/g, kind: 'trusted' };
  const grammar = createRegexLanguage({id:'snapshot-fixture', aliases, tokens:[rule]});
  const h = new SyntaxHighlighter({languages:[grammar]});
  aliases[0] = 'evil-alias';
  rule.kind = '" onmouseover="evil';
  rule.pattern = /UNSAFE/;
  assert.equal(h.language('stable-alias'), grammar);
  assert.equal(h.language('evil-alias'), undefined);
  assert.deepEqual(h.tokenize('SAFE', 'stable-alias'),
    [{kind:'trusted', value:'SAFE'}]);
  assert.equal(h.highlight('SAFE', 'stable-alias'),
    '<span class="tok-trusted">SAFE</span>');
});
