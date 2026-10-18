/* Operation Wild Explorer — optional, device-local postcard photos.
   No camera, uploads, remote images or external services. Only explicitly
   selected JPEG/PNG/WebP files are rasterized; only JPEG pixels are retained.
   Progress JSON must contain photo IDs only, never the data returned by loadPhoto.
   Call exportPostcard only from an explicit user export button. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.WildPostcards = factory(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const DATABASE = 'wildExplorerPostcards';
  const STORE = 'photos';
  const MAX_INPUT_BYTES = 15 * 1024 * 1024;
  const MAX_EDGE = 1280;
  const MAX_PIXELS = 64 * 1024 * 1024;
  const MAX_POSTCARD_PHOTOS = 6;
  const ACCEPT = 'image/jpeg,image/png,image/webp';
  const TYPES = new Set(ACCEPT.split(','));
  const JPEG_DATA = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;
  const PHOTO_ID = /^photo-[A-Za-z0-9_-]{1,100}$/;

  function photoError(code, message) {
    const error = new Error(message);
    error.name = 'WildPostcardError';
    error.code = code;
    return error;
  }

  function storageError(error, action) {
    if (error && error.name === 'WildPostcardError') return error;
    if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      return photoError('quota_exceeded', 'This browser is out of photo storage. Remove an older photo or continue without a photo.');
    }
    if (error && ['SecurityError', 'NotAllowedError', 'InvalidStateError'].includes(error.name)) {
      return photoError('storage_unavailable', 'This browser is not allowing local photo storage. Try a regular browser tab, or continue without a photo.');
    }
    return photoError('storage_failed', `The photo could not be ${action} on this device. You can continue without a photo.`);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!root.indexedDB) {
        reject(photoError('storage_unavailable', 'Local photo storage is unavailable in this browser. You can continue without a photo.'));
        return;
      }
      let request;
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        reject(storageError(error, 'opened'));
      };
      try {
        request = root.indexedDB.open(DATABASE, 1);
      } catch (error) {
        fail(error);
        return;
      }
      request.onupgradeneeded = () => {
        try {
          if (!request.result.objectStoreNames.contains(STORE)) {
            request.result.createObjectStore(STORE, { keyPath: 'id' });
          }
        } catch (error) {
          try { request.transaction.abort(); } catch (_) { /* Already aborted. */ }
          fail(error);
        }
      };
      request.onblocked = () => fail(photoError('storage_blocked', 'Photo storage is busy in another tab. Close other copies of the game and try again, or continue without a photo.'));
      request.onerror = () => fail(request.error);
      request.onsuccess = () => {
        const database = request.result;
        if (settled) {
          database.close();
          return;
        }
        settled = true;
        database.onversionchange = () => database.close();
        resolve(database);
      };
    });
  }

  async function transact(mode, operation, action) {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        let transaction;
        let request;
        let result;
        let settled = false;
        const fail = error => {
          if (settled) return;
          settled = true;
          reject(storageError(error, action));
        };
        try {
          transaction = database.transaction(STORE, mode);
          transaction.oncomplete = () => {
            if (settled) return;
            settled = true;
            resolve(result);
          };
          transaction.onabort = () => fail(transaction.error || (request && request.error));
          transaction.onerror = () => fail(transaction.error || (request && request.error));
          request = operation(transaction.objectStore(STORE));
          request.onsuccess = () => { result = request.result; };
          request.onerror = () => fail(request.error);
        } catch (error) {
          if (transaction) {
            try { transaction.abort(); } catch (_) { /* Already finished. */ }
          }
          fail(error);
        }
      });
    } finally {
      database.close();
    }
  }

  function newPhotoId() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return `photo-${root.crypto.randomUUID()}`;
    if (root.crypto && typeof root.crypto.getRandomValues === 'function') {
      const bytes = root.crypto.getRandomValues(new Uint8Array(16));
      return 'photo-' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function validateFile(file) {
    if (!file || !Number.isFinite(file.size) || file.size <= 0) {
      throw photoError('empty_file', 'Choose a JPEG, PNG or WebP image that is not empty, or continue without a photo.');
    }
    if (file.size > MAX_INPUT_BYTES) {
      throw photoError('file_too_large', 'That image is larger than 15 MB. Choose a smaller image, or continue without a photo.');
    }
    const type = typeof file.type === 'string' ? file.type.toLowerCase() : '';
    if (/heic|heif/.test(type) || /\.(heic|heif)$/i.test(file.name || '')) {
      throw photoError('unsupported_heic', 'HEIC/HEIF photos cannot be added here. Choose or convert a copy to JPEG, PNG or WebP, or continue without a photo.');
    }
    if (!TYPES.has(type)) {
      throw photoError('unsupported_type', 'Choose a JPEG, PNG or WebP image. Other file types are not supported; you can continue without a photo.');
    }
  }

  async function validateImageBytes(file) {
    let bytes;
    try {
      const header = file.slice(0, 12);
      const buffer = typeof header.arrayBuffer === 'function' ? await header.arrayBuffer() : await new Promise((resolve, reject) => {
        if (typeof root.FileReader !== 'function') { reject(new Error('File reading unavailable')); return; }
        const reader = new root.FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.onabort = () => reject(new Error('File reading interrupted'));
        reader.readAsArrayBuffer(header);
      });
      bytes = new Uint8Array(buffer);
    } catch (_) {
      throw photoError('image_read', 'That image could not be read. Choose another JPEG, PNG or WebP image, or continue without a photo.');
    }
    const isJPEG = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const isPNG = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
    const isWebP = [82, 73, 70, 70].every((byte, index) => bytes[index] === byte) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
    const type = file.type.toLowerCase();
    if (!((type === 'image/jpeg' && isJPEG) || (type === 'image/png' && isPNG) || (type === 'image/webp' && isWebP))) {
      throw photoError('invalid_image', 'That file is not a readable JPEG, PNG or WebP image. Choose another image, or continue without a photo.');
    }
  }

  function rasterize(file) {
    return new Promise((resolve, reject) => {
      if (!root.document || typeof root.Image !== 'function' || !root.URL || !root.URL.createObjectURL) {
        reject(photoError('image_unavailable', 'This browser cannot prepare photos. You can continue without a photo.'));
        return;
      }
      let url;
      let timer;
      let picture;
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        if (timer) root.clearTimeout(timer);
        if (url) root.URL.revokeObjectURL(url);
        if (picture) {
          picture.onload = null;
          picture.onerror = null;
          if (typeof picture.removeAttribute === 'function') picture.removeAttribute('src');
        }
        if (error) reject(error);
        else resolve(value);
      };
      try {
        url = root.URL.createObjectURL(file);
        picture = new root.Image();
        picture.onload = () => {
          let canvas;
          try {
            const width = picture.naturalWidth;
            const height = picture.naturalHeight;
            if (!width || !height || width * height > MAX_PIXELS || width > 32768 || height > 32768) {
              throw photoError('image_dimensions', 'That image has too many pixels to prepare safely. Choose a smaller image, or continue without a photo.');
            }
            const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
            canvas = root.document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(width * scale));
            canvas.height = Math.max(1, Math.round(height * scale));
            const context = canvas.getContext('2d', { alpha: false });
            if (!context) throw photoError('image_unavailable', 'This browser cannot prepare photos. You can continue without a photo.');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(picture, 0, 0, canvas.width, canvas.height);
            // A fresh canvas JPEG contains only rendered pixels, not the file's
            // EXIF location, capture time, original filename or other metadata.
            const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
            if (!validPhotoData(dataUrl)) throw new Error('JPEG encoding unavailable');
            finish(null, { dataUrl, width: canvas.width, height: canvas.height });
          } catch (error) {
            finish(error.name === 'WildPostcardError' ? error : photoError('image_processing', 'That photo could not be prepared. Try another JPEG, PNG or WebP image, or continue without a photo.'));
          } finally {
            if (canvas) { canvas.width = 1; canvas.height = 1; }
          }
        };
        picture.onerror = () => finish(photoError('image_decode', 'That photo could not be opened. Try another JPEG, PNG or WebP image, or continue without a photo.'));
        timer = root.setTimeout(() => finish(photoError('image_timeout', 'That photo took too long to open. Try a smaller image, or continue without a photo.')), 30000);
        picture.src = url;
      } catch (_) {
        finish(photoError('image_processing', 'That photo could not be prepared. Try another JPEG, PNG or WebP image, or continue without a photo.'));
      }
    });
  }

  function validPhotoData(value) {
    return typeof value === 'string' && value.length <= 5 * 1024 * 1024 && JPEG_DATA.test(value);
  }

  async function storePhoto(file) {
    validateFile(file);
    await validateImageBytes(file);
    const photo = await rasterize(file);
    const id = newPhotoId();
    // Deliberately do not retain the input Blob or any file metadata.
    await transact('readwrite', store => store.add({ id, dataUrl: photo.dataUrl, width: photo.width, height: photo.height }), 'saved');
    return id;
  }

  async function loadPhoto(id) {
    if (!PHOTO_ID.test(typeof id === 'string' ? id : '')) return null;
    const photo = await transact('readonly', store => store.get(id), 'loaded');
    return photo && validPhotoData(photo.dataUrl) ? photo.dataUrl : null;
  }

  async function deletePhoto(id) {
    if (!PHOTO_ID.test(typeof id === 'string' ? id : '')) return;
    await transact('readwrite', store => store.delete(id), 'removed');
  }

  function clean(value, limit) {
    return (typeof value === 'string' ? value : '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, limit);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function strings(value, count, length) {
    return Array.isArray(value) ? value.slice(0, count).map(item => clean(item, length)).filter(Boolean) : [];
  }

  function snapshot(postcard) {
    const source = postcard && typeof postcard === 'object' ? postcard : {};
    return {
      date: clean(source.date, 80),
      park: clean(source.park, 160) || 'Our outdoor adventure',
      favorite: clean(source.favorite, 2000),
      heroes: strings(source.heroes, Array.isArray(source.heroes) ? source.heroes.length : 0, 80),
      badges: strings(source.badges, 48, 160),
      discoveries: (Array.isArray(source.discoveries) ? source.discoveries : []).slice(0, 100).map(item => ({
        title: clean(item && item.title, 160) || 'A nature discovery',
        note: clean(item && item.note, 1000),
        type: clean(item && item.type, 80)
      }))
    };
  }

  /** Returns safe HTML for an in-app preview. Photos can be data-URL strings or
      {dataUrl} objects returned from local storage. Remote URLs are ignored. */
  function renderPreview(postcard, photos) {
    const card = snapshot(postcard);
    const images = (Array.isArray(photos) ? photos : []).map(photo => typeof photo === 'string' ? photo : photo && photo.dataUrl).filter(validPhotoData).slice(0, MAX_POSTCARD_PHOTOS);
    const discoveries = card.discoveries.length ? `<ul class="postcard-discoveries">${card.discoveries.map(discovery => `<li><strong>${escapeHTML(discovery.title)}</strong>${discovery.type ? `<span class="postcard-kind">${escapeHTML(discovery.type)}</span>` : ''}${discovery.note ? `<p>${escapeHTML(discovery.note)}</p>` : ''}</li>`).join('')}</ul>` : '<p>We spent time exploring together.</p>';
    return `<article class="wild-postcard" aria-label="Adventure postcard">
      <header class="postcard-heading"><p class="postcard-eyebrow">Operation Wild Explorer</p><h2>Our adventure postcard</h2><p class="postcard-place">${escapeHTML(card.park)}</p>${card.date ? `<p class="postcard-date">${escapeHTML(card.date)}</p>` : ''}</header>
      ${card.heroes.length ? `<section><h3>Our explorer team</h3><p>${card.heroes.map(escapeHTML).join(' · ')}</p></section>` : ''}
      <section><h3>Things we discovered</h3>${discoveries}</section>
      ${card.favorite ? `<section><h3>Our favorite moment</h3><p class="postcard-favorite">${escapeHTML(card.favorite)}</p></section>` : ''}
      ${card.badges.length ? `<section><h3>Adventure badges</h3><ul class="postcard-badges">${card.badges.map(badge => `<li>${escapeHTML(badge)}</li>`).join('')}</ul></section>` : ''}
      ${images.length ? `<section><h3>Our adventure photos</h3><div class="postcard-photos">${images.map((dataUrl, index) => `<figure><img src="${dataUrl}" alt="Optional adventure photo ${index + 1}" decoding="async"><figcaption>Adventure photo ${index + 1}</figcaption></figure>`).join('')}</div></section>` : ''}
      <footer>Made with imagination, curiosity and time together.</footer>
    </article>`;
  }

  const EXPORT_CSS = `*{box-sizing:border-box}body{margin:0;padding:24px 12px;background:#e7f1e5;color:#213b30;font:17px/1.6 system-ui,-apple-system,sans-serif}.wild-postcard{max-width:760px;margin:0 auto;background:#fffdf3;border:3px solid #4d8b59;border-radius:24px;padding:clamp(20px,5vw,48px);overflow-wrap:anywhere}.postcard-heading{text-align:center;border-bottom:3px dashed #d6b965;padding-bottom:22px}.postcard-eyebrow{font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:800}h2{font-size:clamp(28px,7vw,44px);line-height:1.15;margin:12px 0;color:#27613e}h3{font-size:22px;line-height:1.3;margin:28px 0 10px}.postcard-place{font-size:22px;font-weight:700;margin:10px 0}.postcard-date{margin:0;color:#546b5d}p{white-space:pre-wrap}.postcard-discoveries{padding-left:23px}.postcard-discoveries li{margin:16px 0}.postcard-discoveries p{margin:3px 0}.postcard-kind{display:block;font-size:13px;color:#546b5d}.postcard-favorite{background:#fce5a4;border-radius:14px;padding:18px}.postcard-badges{list-style:none;padding:0;display:flex;gap:8px;flex-wrap:wrap}.postcard-badges li{background:#e3f0dd;border:1px solid #bad2ad;border-radius:20px;padding:5px 13px}.postcard-photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px}figure{margin:0}img{display:block;width:100%;height:auto;border-radius:14px}figcaption{font-size:12px;color:#546b5d;margin-top:5px}footer{border-top:1px solid #dfdfc9;margin-top:30px;padding-top:18px;text-align:center;color:#546b5d;font-size:13px}.file-note{max-width:760px;margin:18px auto 0;font-size:12px;text-align:center}@media print{body{background:white;padding:0}.wild-postcard{border-width:1px;max-width:none;border-radius:0}section,figure{break-inside:avoid}.file-note{display:none}}`;

  /** Requests a local HTML file download; never opens a share sheet or sends it.
      Passing {photoIds: []} explicitly exports text only. Otherwise uses the
      postcard's photoIds. Resolves after requesting download, not after the
      browser has saved it. Missing/unreadable photos reject before download. */
  async function exportPostcard(postcard, options) {
    const source = postcard && typeof postcard === 'object' ? postcard : {};
    const requested = options && Object.prototype.hasOwnProperty.call(options, 'photoIds') ? options.photoIds : source.photoIds;
    if (requested != null && !Array.isArray(requested)) throw photoError('invalid_photos', 'This postcard has an invalid photo list. Try exporting without photos.');
    const ids = [...new Set(requested || [])];
    if (ids.length > MAX_POSTCARD_PHOTOS) throw photoError('too_many_photos', `Choose up to ${MAX_POSTCARD_PHOTOS} photos for one postcard.`);
    const photos = await Promise.all(ids.map(async id => {
      const photo = await loadPhoto(id);
      if (!photo) throw photoError('photo_missing', 'A photo on this postcard is no longer on this device. Remove it from the postcard, or export without photos.');
      return photo;
    }));
    if (!root.document || !root.document.body || !root.URL || !root.URL.createObjectURL || typeof root.Blob !== 'function') {
      throw photoError('export_unavailable', 'This browser cannot download a postcard file. Try opening the game in a regular browser tab.');
    }
    const title = escapeHTML(`${snapshot(source).park} — Adventure postcard`);
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><title>${title}</title><style>${EXPORT_CSS}</style></head><body>${renderPreview(source, photos)}<p class="file-note">This keepsake includes the names, notes and optional photos shown above. It works offline. Share this file only if you choose.</p></body></html>`;
    const date = clean(source.date, 80).match(/^\d{4}-\d{2}-\d{2}/);
    const filename = `wild-explorer-postcard${date ? '-' + date[0] : ''}.html`;
    let url;
    let link;
    try {
      url = root.URL.createObjectURL(new root.Blob([html], { type: 'text/html;charset=utf-8' }));
      link = root.document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      link.hidden = true;
      root.document.body.appendChild(link);
      link.click();
    } catch (_) {
      if (url) root.URL.revokeObjectURL(url);
      throw photoError('export_failed', 'The postcard download could not start. Try opening the game in a regular browser tab.');
    } finally {
      if (link) link.remove();
    }
    // Delay revocation so mobile browsers can finish consuming the file URL.
    root.setTimeout(() => root.URL.revokeObjectURL(url), 60000);
    return { filename, photoCount: photos.length, downloadRequested: true };
  }

  return Object.freeze({ storePhoto, loadPhoto, deletePhoto, renderPreview, exportPostcard, MAX_INPUT_BYTES, MAX_POSTCARD_PHOTOS, MAX_EDGE, ACCEPT });
});
