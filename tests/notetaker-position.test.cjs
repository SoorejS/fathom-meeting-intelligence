const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { constrainFloatingPosition: constrain } = load('src/lib/floatingPosition.ts');

test('floating Notetaker stays inside viewport margins after drag, restore, and resize', () => {
  assert.deepEqual(constrain({x:-500,y:-500},360,520,1440,900),{x:12,y:12});
  assert.deepEqual(constrain({x:2000,y:2000},360,520,1440,900),{x:1068,y:368});
  assert.deepEqual(constrain({x:900,y:700},360,520,390,844),{x:18,y:312});
  assert.deepEqual(constrain({x:200,y:650},280,40,390,844),{x:98,y:650});
  assert.deepEqual(constrain({x:98,y:650},360,548,390,844),{x:18,y:284});
  assert.deepEqual(constrain({x:120,y:160},360,520,1440,900),{x:120,y:160});
});
