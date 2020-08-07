import test from 'ava';

import chunk from './chunk';

test('chunk works', t => {
  const arr = [1, 2, 3, 4];
  t.deepEqual(chunk(arr, 2), [
    [1, 2],
    [3, 4],
  ]);
});
