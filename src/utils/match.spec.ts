import test from 'ava';

import match from './match';

test('match works with include and exclude', t => {
  t.is(match('1', ['1', '2'], ['4']), true);
  t.is(match('2', ['1', '2'], ['4']), true);
  t.is(match('3', ['1', '2'], ['4']), false);
  t.is(match('4', ['1', '2'], ['4']), false);
});

test('match works with only includes', t => {
  t.is(match('1', ['1'], []), true);
  t.is(match('2', ['1'], []), false);
  t.is(match('3', ['1'], []), false);
  t.is(match('4', ['1'], []), false);
});

test('match works with only excludes', t => {
  t.is(match('1', [], ['4']), true);
  t.is(match('2', [], ['4']), true);
  t.is(match('3', [], ['4']), true);
  t.is(match('4', [], ['4']), false);
});
