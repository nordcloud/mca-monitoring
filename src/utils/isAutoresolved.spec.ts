import test from 'ava';

import isAutoresolved from './isAutoresolved';

test('isAutoresolved', t => {
  t.is(isAutoresolved({ autoResolve: true }), true);
  t.is(isAutoresolved({ autoResolve: false }), false);
  t.is(isAutoresolved({ autoResolve: true }, { autoResolve: true }), true);
  t.is(isAutoresolved({ autoResolve: true }, { autoResolve: false }), false);
  t.is(isAutoresolved({ autoResolve: false }, { autoResolve: true }), true);
});
