'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const G = require('../public/gear.js');
const absolute = extras => ({ absolute: true, alpha: 0, beta: 0, gamma: 0, ...extras });
const apple = extras => ({ absolute: false, alpha: 143, beta: 0, gamma: 0, webkitCompassHeading: 0, webkitCompassAccuracy: 8, ...extras });

test('UMD installs a pure browser global with no sensor, DOM, storage or network access', () => {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/gear.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context), ['WildGear']);
  assert.equal(context.WildGear.cardinal(0), 'N');
  assert.equal(Object.isFrozen(context.WildGear), true);
});

test('degrees normalize rotations and zero without coercing absent or malformed readings', () => {
  for (const [input, output] of [[0, 0], [-0, 0], [360, 0], [720, 0], [-1, 359], [-721, 359], [359.5, 359.5]]) {
    assert.equal(G.normalizeDegrees(input), output);
  }
  for (const value of [null, undefined, '', '90', false, true, NaN, Infinity, -Infinity, {}, []]) {
    assert.equal(G.normalizeDegrees(value), null);
  }
});

test('eight-point cardinals have correct circular sector boundaries', () => {
  for (const [angle, direction] of [[0, 'N'], [22.49, 'N'], [22.5, 'NE'], [45, 'NE'], [90, 'E'], [135, 'SE'], [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW'], [337.49, 'NW'], [337.5, 'N'], [359, 'N'], [-90, 'W']]) {
    assert.equal(G.cardinal(angle), direction);
  }
  assert.equal(G.cardinal(null), '—');
  assert.equal(G.cardinal(NaN), '—');
});

test('phone level requires valid, screen-up combined tilt within the requested angle', () => {
  for (const angles of [[0, 0], [30, 0], [-30, 0], [0, 30], [0, -30], [20, 20]]) {
    assert.equal(G.isPhoneLevel({ beta: angles[0], gamma: angles[1] }), true);
  }
  for (const angles of [[30.1, 0], [0, 30.1], [25, 25], [90, 0], [180, 0], [-180, 0], [0, 90], [360, 0], [0, 360]]) {
    assert.equal(G.isPhoneLevel({ beta: angles[0], gamma: angles[1] }), false);
  }
  for (const event of [null, {}, { beta: 0 }, { beta: null, gamma: 0 }, { beta: '0', gamma: 0 }, { beta: 0, gamma: NaN }]) {
    assert.equal(G.isPhoneLevel(event), false);
  }
  assert.equal(G.isPhoneLevel(absolute({ beta: 40 }), 45), true);
  assert.equal(G.isPhoneLevel(absolute(), 0), true);
  for (const limit of [null, '30', -1, 90, 180, Infinity]) assert.equal(G.isPhoneLevel(absolute(), limit), false);
});

test('Apple compass accepts north at zero and prefers magnetic heading over relative alpha', () => {
  assert.deepEqual(G.readHeading(apple()), { heading: 0, source: 'webkit', accuracy: 8 });
  assert.deepEqual(G.readHeading(apple({ webkitCompassHeading: 90, webkitCompassAccuracy: 0 })), { heading: 90, source: 'webkit', accuracy: 0 });
  assert.deepEqual(G.readHeading(apple({ webkitCompassHeading: 360 })), { heading: 0, source: 'webkit', accuracy: 8 });
  assert.deepEqual(G.readHeading(apple({ webkitCompassHeading: 225, webkitCompassAccuracy: undefined })), { heading: 225, source: 'webkit' });
  assert.deepEqual(G.readHeading(apple({ webkitCompassAccuracy: null })), { heading: 0, source: 'webkit' });
});

test('Apple invalid direction or accuracy does not fall back to a seemingly usable alpha', () => {
  for (const heading of [-1, 361, NaN, Infinity, '90', false]) {
    assert.equal(G.readHeading(apple({ absolute: true, webkitCompassHeading: heading })), null);
  }
  for (const accuracy of [-1, -0.1, NaN, Infinity, '5', false]) {
    assert.equal(G.readHeading(apple({ absolute: true, webkitCompassAccuracy: accuracy })), null);
    assert.equal(G.readHeading(absolute({ webkitCompassHeading: null, webkitCompassAccuracy: accuracy })), null);
  }
});

test('absolute alpha converts anticlockwise angles to magnetic clockwise bearings', () => {
  for (const [alpha, heading] of [[0, 0], [90, 270], [180, 180], [270, 90], [359, 1]]) {
    assert.deepEqual(G.readHeading(absolute({ alpha })), { heading, source: 'absolute' });
  }
  assert.deepEqual(G.readHeading(absolute({ webkitCompassHeading: null })), { heading: 0, source: 'absolute' });
});

test('relative, missing, coerced or out-of-range alpha never becomes a compass heading', () => {
  for (const flag of [false, undefined, null, 1, 'true']) assert.equal(G.readHeading(absolute({ absolute: flag })), null);
  for (const alpha of [null, undefined, NaN, Infinity, '90', false, -1, 360, 720]) assert.equal(G.readHeading(absolute({ alpha })), null);
  assert.equal(G.readHeading({ type: 'deviceorientationabsolute', alpha: 90, beta: 0, gamma: 0 }), null);
  assert.equal(G.readHeading(null), null);
});

test('both sources reject landscape, inverted, unknown screen angles and steep/missing tilt', () => {
  for (const event of [apple(), absolute()]) {
    for (const angle of [90, -90, 180, 270, 45, null, NaN, Infinity, '0']) assert.equal(G.readHeading(event, angle), null);
    assert.ok(G.readHeading(event, 360));
    for (const extras of [{ beta: 31 }, { gamma: -31 }, { beta: 25, gamma: 25 }, { beta: 180 }, { beta: undefined }, { gamma: null }]) {
      assert.equal(G.readHeading({ ...event, ...extras }), null);
    }
  }
});

test('reading leaves its input unchanged and never returns simulated defaults', () => {
  const event = Object.freeze(apple());
  assert.deepEqual(G.readHeading(event), { heading: 0, source: 'webkit', accuracy: 8 });
  assert.equal(G.readHeading({}), null);
  assert.equal(G.readHeading({ beta: 0, gamma: 0 }), null);
});
