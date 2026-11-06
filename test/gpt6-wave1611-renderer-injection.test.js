import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer, escapeHtml} from '../src/index.js';

test('untrusted token kinds and class prefixes cannot inject DOM attributes or markup', () => {
  const kind = '"><img src=x onerror=1>';
  const value = '<script>alert("x")</script>&\'' + '\u0000';
  const prefix = 'prefix" onmouseover="evil"><svg/onload=1>';
  const rendered = htmlRenderer.render([{kind,value}], {classPrefix:prefix});
  assert.equal(rendered,
    '<span class="' + escapeHtml(prefix + kind) + '">' + escapeHtml(value) + '</span>');
  assert.equal((rendered.match(/<span/g) || []).length, 1);
  for (const forbidden of ['<script', '<img', '<svg', ' onmouseover="evil"', ' onerror=1>']) {
    assert.ok(!rendered.includes(forbidden), forbidden);
  }
});

test('plain token is escaped without adding an attacker-controlled element', () => {
  const source = '<img src=x onerror="alert(1)">&\'';
  assert.equal(htmlRenderer.render([{kind:'plain',value:source}]), escapeHtml(source));
  assert.ok(!escapeHtml(source).includes('<img'));
});
