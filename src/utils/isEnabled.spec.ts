import test from 'ava';

import isEnabled from './isEnabled';

test('isEnabled', t => {
  t.is(isEnabled({ enabled: true }), true);
  t.is(isEnabled({ enabled: false }), false);
  t.is(isEnabled({ enabled: true }, { enabled: true }), true);
  t.is(isEnabled({ enabled: true }, { enabled: false }), false);
  t.is(isEnabled({ enabled: false }, { enabled: true }), true);
});
