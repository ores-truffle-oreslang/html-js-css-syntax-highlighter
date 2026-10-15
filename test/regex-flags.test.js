import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';
import { html } from '../src/plugins/html.js';
import { javascript } from '../src/plugins/javascript.js';

test('built-in HTML doctype and JS numeric rules retain ignoreCase', () => {
  assert.deepEqual(html.tokenize('<!DOCTYPE HTML>'), [{kind:'doctype',value:'<!DOCTYPE HTML>'}]);
  assert.deepEqual(javascript.tokenize('0XAF'), [{kind:'number',value:'0XAF'}]);
});
test('rule-local flags do not affect case-sensitive rules or rule priority', () => {
  const lang = createRegexLanguage({id:'flags',tokens:[
    {kind:'sensitive',pattern:/ABC/}, {kind:'insensitive',pattern:/abc/i},
    {kind:'multiline-string',pattern:/x.y/s},
  ]});
  const source = 'ABC abc x\ny';
  const expected = [
    {kind:'sensitive',value:'ABC'}, {kind:'plain',value:' '},
    {kind:'insensitive',value:'abc'}, {kind:'plain',value:' '},
    {kind:'multiline-string',value:'x\ny'},
  ];
  assert.deepEqual(lang.tokenize(source), expected);
  assert.deepEqual(lang.tokenize(source), expected);
});
test('named captures and zero-width rules preserve complete source', () => {
  const lang=createRegexLanguage({id:'captures',tokens:[
    {kind:'empty',pattern:/(?=.)/}, {kind:'word',pattern:/(?<named>x+)/},
  ]});
  assert.deepEqual(lang.tokenize('🙂xx!'), [
    {kind:'plain',value:'🙂'}, {kind:'word',value:'xx'}, {kind:'plain',value:'!'},
  ]);
});
