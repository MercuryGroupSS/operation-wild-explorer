/* Dependency-free unit tests: node --test scripts/postcards.test.cjs.
   Storage/decoding mocks test failure handling, not physical-device behavior. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../public/postcards.js'), 'utf8');
const JPEG = 'data:image/jpeg;base64,/9j/2Q==';
const HEADERS = {
  'image/jpeg': [255, 216, 255, 224, 0, 0, 0, 0, 0, 0, 0, 0],
  'image/png': [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0],
  'image/webp': [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]
};
function file(type = 'image/jpeg', name = 'synthetic-image.jpg', bytes = HEADERS[type] || [0, 0, 0]) {
  return Object.assign(new Blob([new Uint8Array(bytes)], { type }), { name });
}
function namedError(name) { return Object.assign(new Error(name), { name }); }
function harness(mode = {}) {
  const records = new Map();
  const state = { opened: 0, closed: 0, clicks: 0, objects: [], revoked: [], canvases: [], draws: [], timers: new Map(), versionChanges: [], reads: 0 };
  let created = false;
  let timer = 0;
  let id = 0;
  const later = fn => queueMicrotask(fn);
  const database = () => {
    const db = {
      objectStoreNames: { contains: () => created },
      createObjectStore: (name, options) => { assert.equal(name, 'photos'); assert.deepEqual(options.keyPath, 'id'); created = true; },
      close: () => { state.closed++; },
      transaction: (name, access) => {
        assert.equal(name, 'photos');
        if (mode.transactionError) throw namedError(mode.transactionError);
        const tx = { error: null, aborted: false, abort() { tx.aborted = true; later(() => tx.onabort && tx.onabort()); } };
        const request = (operation, input) => {
          const req = { result: undefined, error: null };
          later(() => {
            if (mode.requestError) {
              req.error = namedError(mode.requestError);
              tx.error = req.error;
              req.onerror && req.onerror();
              tx.onerror && tx.onerror();
              tx.onabort && tx.onabort();
              return;
            }
            if (operation === 'get') { state.reads++; req.result = records.get(input); }
            if (operation === 'add') req.result = input.id;
            req.onsuccess && req.onsuccess();
            later(() => {
              if (mode.commitError) { tx.error = namedError(mode.commitError); tx.onabort && tx.onabort(); return; }
              if (tx.aborted) return;
              if (operation === 'add') records.set(input.id, input);
              if (operation === 'delete') records.delete(input);
              tx.oncomplete && tx.oncomplete();
            });
          });
          return req;
        };
        tx.objectStore = () => ({
          get: input => request('get', input),
          add: input => { assert.equal(access, 'readwrite'); return request('add', input); },
          delete: input => { assert.equal(access, 'readwrite'); return request('delete', input); }
        });
        return tx;
      }
    };
    state.versionChanges.push(db);
    return db;
  };
  const environment = {
    Blob,
    crypto: { randomUUID: () => `synthetic-${++id}` },
    setTimeout: (fn, delay) => { const number = ++timer; state.timers.set(number, { fn, delay }); return number; },
    clearTimeout: number => state.timers.delete(number),
    indexedDB: {
      open: (name, version) => {
        assert.equal(name, 'wildExplorerPostcards'); assert.equal(version, 1); state.opened++;
        if (mode.openThrows) throw namedError(mode.openThrows);
        const req = {};
        later(() => {
          if (mode.openError) { req.error = namedError(mode.openError); req.onerror(); return; }
          if (mode.blocked) req.onblocked();
          req.result = database();
          if (!created) req.onupgradeneeded();
          req.onsuccess();
        });
        return req;
      }
    },
    URL: {
      createObjectURL: input => { state.objects.push(input); return `blob:synthetic-${state.objects.length}`; },
      revokeObjectURL: url => state.revoked.push(url)
    },
    Image: class {
      constructor() { this.naturalWidth = mode.width || 4032; this.naturalHeight = mode.height || 3024; }
      set src(value) {
        if (!value || mode.imageTimeout) return;
        later(() => { if (mode.decodeError) this.onerror && this.onerror(); else this.onload && this.onload(); });
      }
    },
    document: {
      body: { appendChild: () => {} },
      createElement: tag => {
        if (tag === 'canvas') {
          const canvas = {
            width: 0, height: 0,
            getContext: () => mode.noContext ? null : {
              fillRect: (...args) => { state.fill = args; },
              drawImage: (...args) => state.draws.push(args.slice(1))
            },
            toDataURL: (type, quality) => { state.encoding = { type, quality, width: canvas.width, height: canvas.height }; return mode.invalidEncoding ? 'data:,' : JPEG; }
          };
          state.canvases.push(canvas);
          return canvas;
        }
        assert.equal(tag, 'a');
        const link = { remove: () => { state.removed = true; }, click: () => { if (mode.clickError) throw new Error('Download blocked'); state.clicks++; } };
        state.link = link;
        return link;
      }
    }
  };
  if (mode.noIndexedDB) delete environment.indexedDB;
  vm.runInNewContext(source, environment, { filename: 'postcards.js' });
  return { api: environment.WildPostcards, state, records, environment, mode };
}
const expectCode = code => error => { assert.equal(error.name, 'WildPostcardError'); assert.equal(error.code, code); assert.ok(error.message.length > 20); return true; };

test('UMD module loads with no side effects and works without browser APIs for text preview', () => {
  const { api, state } = harness();
  assert.equal(state.opened, 0);
  assert.equal(state.objects.length, 0);
  assert.equal(state.timers.size, 0);
  assert.equal(Object.isFrozen(api), true);
  assert.equal(api.MAX_INPUT_BYTES, 15 * 1024 * 1024);
  const nodeAPI = require('../public/postcards.js');
  assert.match(nodeAPI.renderPreview({}), /Our outdoor adventure/);
});

test('stores only compressed JPEG pixels/dimensions and resolves only after transaction commit', async () => {
  const { api, state, records } = harness();
  const id = await api.storePhoto(file());
  assert.match(id, /^photo-/);
  assert.equal(records.size, 1);
  const record = records.get(id);
  assert.deepEqual(Object.keys(record).sort(), ['dataUrl', 'height', 'id', 'width']);
  assert.equal(record.width, 1280);
  assert.equal(record.height, 960);
  assert.equal(record.dataUrl, JPEG);
  assert.equal(state.encoding.type, 'image/jpeg');
  assert.equal(state.encoding.quality, 0.86);
  assert.deepEqual(state.fill, [0, 0, 1280, 960]);
  assert.equal(state.revoked.length, 1);
  assert.equal(state.closed, 1);
  assert.equal(state.timers.size, 0);
  assert.equal(state.canvases[0].width, 1);
});

test('portrait images retain their aspect ratio and small images are not enlarged', async () => {
  for (const [width, height, outputWidth, outputHeight] of [[3000, 4000, 960, 1280], [320, 180, 320, 180], [1, 1280, 1, 1280]]) {
    const { api, state } = harness({ width, height });
    await api.storePhoto(file());
    assert.equal(state.encoding.width, outputWidth);
    assert.equal(state.encoding.height, outputHeight);
  }
});

test('JPEG, PNG and WebP inputs all store JPEG; an original file never reaches the database', async () => {
  for (const type of Object.keys(HEADERS)) {
    const { api, records } = harness();
    const id = await api.storePhoto(file(type, 'synthetic-image'));
    assert.equal(records.get(id).dataUrl, JPEG);
    assert.equal(records.get(id).file, undefined);
    assert.equal(records.get(id).name, undefined);
  }
});

test('load and deletion round-trip, missing/invalid references return null', async () => {
  const { api, records, state } = harness();
  assert.equal(await api.loadPhoto('arbitrary-url'), null);
  assert.equal(await api.loadPhoto({}), null);
  assert.equal(state.opened, 0);
  const id = await api.storePhoto(file());
  assert.equal(await api.loadPhoto(id), JPEG);
  await api.deletePhoto(id);
  assert.equal(records.size, 0);
  assert.equal(await api.loadPhoto(id), null);
  await api.deletePhoto(id);
  await api.deletePhoto(null);
});

test('bad input is rejected before decoding or storage', async () => {
  const { api, state } = harness();
  await assert.rejects(api.storePhoto(null), expectCode('empty_file'));
  await assert.rejects(api.storePhoto({ size: 0 }), expectCode('empty_file'));
  await assert.rejects(api.storePhoto({ size: 15 * 1024 * 1024 + 1, type: 'image/jpeg' }), expectCode('file_too_large'));
  await assert.rejects(api.storePhoto(file('image/heic', 'synthetic.heic')), expectCode('unsupported_heic'));
  await assert.rejects(api.storePhoto(file('image/jpeg', 'synthetic.heif')), expectCode('unsupported_heic'));
  await assert.rejects(api.storePhoto(file('image/svg+xml', 'synthetic.svg')), expectCode('unsupported_type'));
  await assert.rejects(api.storePhoto(file('', 'synthetic')), expectCode('unsupported_type'));
  assert.equal(state.objects.length, 0);
  assert.equal(state.opened, 0);
});

test('file signatures prevent disguised SVG or mismatched image formats from decoding', async () => {
  const { api, state } = harness();
  await assert.rejects(api.storePhoto(file('image/jpeg', 'synthetic.jpg', [...Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')])), expectCode('invalid_image'));
  await assert.rejects(api.storePhoto(file('image/png', 'synthetic.png', HEADERS['image/jpeg'])), expectCode('invalid_image'));
  await assert.rejects(api.storePhoto({ size: 100, type: 'image/jpeg' }), expectCode('image_read'));
  assert.equal(state.objects.length, 0);
  assert.equal(state.opened, 0);
});

test('decode, huge dimensions and unavailable canvas failures release the original object URL', async () => {
  for (const [mode, code] of [[{ decodeError: true }, 'image_decode'], [{ width: 100000 }, 'image_dimensions'], [{ noContext: true }, 'image_unavailable'], [{ invalidEncoding: true }, 'image_processing']]) {
    const { api, state } = harness(mode);
    await assert.rejects(api.storePhoto(file()), expectCode(code));
    assert.equal(state.revoked.length, 1);
    assert.equal(state.timers.size, 0);
    assert.equal(state.opened, 0);
  }
});

test('image timeout reports a recoverable error and releases the file URL', async () => {
  const { api, state } = harness({ imageTimeout: true });
  const pending = api.storePhoto(file());
  const rejected = assert.rejects(pending, expectCode('image_timeout'));
  while (!state.timers.size) await new Promise(resolve => setImmediate(resolve));
  [...state.timers.values()][0].fn();
  await rejected;
  assert.equal(state.revoked.length, 1);
});

test('quota errors are surfaced without reporting a successful photo save', async () => {
  for (const mode of [{ requestError: 'QuotaExceededError' }, { commitError: 'QuotaExceededError' }]) {
    const { api, records, state } = harness(mode);
    await assert.rejects(api.storePhoto(file()), expectCode('quota_exceeded'));
    assert.equal(records.size, 0);
    assert.equal(state.closed, 1);
  }
});

test('blocked, absent and denied IndexedDB give truthful storage errors', async () => {
  for (const [mode, code] of [[{ blocked: true }, 'storage_blocked'], [{ noIndexedDB: true }, 'storage_unavailable'], [{ openThrows: 'SecurityError' }, 'storage_unavailable'], [{ openError: 'InvalidStateError' }, 'storage_unavailable'], [{ transactionError: 'SecurityError' }, 'storage_unavailable'], [{ requestError: 'UnknownError' }, 'storage_failed']]) {
    const { api, records } = harness(mode);
    await assert.rejects(api.storePhoto(file()), expectCode(code));
    assert.equal(records.size, 0);
  }
});

test('storage read/delete errors remain visible and do not delete the stored photo', async () => {
  const { api, records, mode } = harness();
  const id = await api.storePhoto(file());
  mode.requestError = 'UnknownError';
  await assert.rejects(api.loadPhoto(id), expectCode('storage_failed'));
  await assert.rejects(api.deletePhoto(id), expectCode('storage_failed'));
  assert.equal(records.size, 1);
});

test('invalid stored photo data cannot introduce external image URLs', async () => {
  const { api, records } = harness();
  records.set('photo-synthetic', { dataUrl: 'https://example.invalid/private.jpg' });
  assert.equal(await api.loadPhoto('photo-synthetic'), null);
  const preview = api.renderPreview({}, ['https://example.invalid/image.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', null, { dataUrl: JPEG }]);
  assert.equal((preview.match(/<img /g) || []).length, 1);
  assert.ok(!preview.includes('example.invalid'));
  assert.ok(!preview.includes('image/svg'));
});

test('all snapshot text is escaped, controls removed, and null entries handled', () => {
  const { api } = harness();
  const attack = '<script>alert("synthetic")</script> & \'quote\'';
  const html = api.renderPreview({ date: attack, park: attack, heroes: [attack], favorite: attack + '\u0000', badges: [attack], discoveries: [{ title: attack, type: attack, note: attack }, null] }, [JPEG]);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('\u0000'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;synthetic&quot;)&lt;/script&gt; &amp; &#39;quote&#39;'));
  assert.ok(html.includes('A nature discovery'));
  assert.match(html, /src="data:image\/jpeg;base64,/);
});

test('text-only export works when IndexedDB is unavailable and stays completely self-contained', async () => {
  const { api, state } = harness({ noIndexedDB: true });
  const result = await api.exportPostcard({ date: '2026-10-18', park: 'Synthetic <park>', discoveries: [], photoIds: ['photo-missing'] }, { photoIds: [] });
  assert.equal(result.filename, 'wild-explorer-postcard-2026-10-18.html');
  assert.equal(result.photoCount, 0);
  assert.equal(result.downloadRequested, true);
  assert.equal(state.clicks, 1);
  assert.equal(state.removed, true);
  assert.equal(state.link.download, result.filename);
  const html = await state.objects[0].text();
  assert.match(html, /default-src 'none'/);
  assert.match(html, /img-src data:/);
  assert.match(html, /Synthetic &lt;park&gt;/);
  assert.ok(!/<script|https?:\/\/|<iframe|<form|<link\b/.test(html));
  assert.equal([...state.timers.values()][0].delay, 60000);
  [...state.timers.values()][0].fn();
  assert.equal(state.revoked.length, 1);
});

test('photo export loads only the selected IDs and embeds images without original metadata', async () => {
  const { api, state } = harness();
  const first = await api.storePhoto(file());
  const second = await api.storePhoto(file());
  const result = await api.exportPostcard({ photoIds: [second], heroes: ['Synthetic hero'] }, { photoIds: [first, first] });
  assert.equal(result.photoCount, 1);
  assert.equal(state.reads, 1);
  const html = await state.objects.at(-1).text();
  assert.equal((html.match(/<img /g) || []).length, 1);
  assert.ok(html.includes(JPEG));
  assert.ok(!html.includes(first));
  assert.ok(!html.includes('synthetic-image.jpg'));
});

test('missing photos or invalid selection stop export before any download begins', async () => {
  const { api, state } = harness();
  await assert.rejects(api.exportPostcard({ photoIds: ['photo-missing'] }), expectCode('photo_missing'));
  await assert.rejects(api.exportPostcard({ photoIds: [null] }), expectCode('photo_missing'));
  await assert.rejects(api.exportPostcard({ photoIds: 'invalid' }), expectCode('invalid_photos'));
  await assert.rejects(api.exportPostcard({ photoIds: Array.from({ length: 7 }, (_, i) => `photo-${i}`) }), expectCode('too_many_photos'));
  assert.equal(state.clicks, 0);
  assert.equal(state.objects.length, 0);
});

test('download failure is reported and the temporary link and object URL are cleaned up', async () => {
  const { api, state } = harness({ clickError: true });
  await assert.rejects(api.exportPostcard({}), expectCode('export_failed'));
  assert.equal(state.removed, true);
  assert.equal(state.revoked.length, 1);
  assert.equal(state.timers.size, 0);
});
