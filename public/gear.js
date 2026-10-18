/* Operation Wild Explorer — pure, device-local compass helpers.
   No sensor subscriptions, permissions, storage, network or simulated headings.
   Live use is intentionally limited to portrait, screen-up, near-level phones.
   Sources: https://www.w3.org/TR/orientation-event/
   https://developer.apple.com/documentation/webkitjs/deviceorientationevent
   https://developer.apple.com/documentation/webkitjs/deviceorientationevent/1804769-webkitcompassaccuracy */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WildGear = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DIRECTIONS = Object.freeze(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
  const RADIANS = Math.PI / 180;
  const finite = value => typeof value === 'number' && Number.isFinite(value);

  function normalizeDegrees(value) {
    if (!finite(value)) return null;
    return ((value % 360) + 360) % 360;
  }

  function cardinal(value) {
    const heading = normalizeDegrees(value);
    return heading === null ? '—' : DIRECTIONS[Math.floor((heading + 22.5) / 45) % 8];
  }

  // The screen's outward normal has vertical component cos(beta)*cos(gamma).
  // Testing the combined tilt also rejects face-down and diagonally steep phones.
  function isPhoneLevel(event, maxTilt = 30) {
    if (!event || !finite(event.beta) || !finite(event.gamma) ||
        event.beta < -180 || event.beta > 180 ||
        event.gamma < -90 || event.gamma > 90 ||
        !finite(maxTilt) || maxTilt < 0 || maxTilt >= 90) return false;
    const up = Math.cos(event.beta * RADIANS) * Math.cos(event.gamma * RADIANS);
    return up + 1e-12 >= Math.cos(maxTilt * RADIANS);
  }

  // Returns magnetic heading for the phone's natural top edge, never relative yaw.
  // The caller must also verify portrait screen orientation (some tablets are
  // naturally landscape), permissions, freshness and visible-page lifecycle.
  // Landscape correction is deliberately unsupported until tested on real devices.
  function readHeading(event, screenAngle = 0) {
    if (normalizeDegrees(screenAngle) !== 0 || !isPhoneLevel(event)) return null;

    const accuracy = event.webkitCompassAccuracy;
    // An explicitly invalid compass status must not be rescued by another field.
    if (accuracy !== undefined && accuracy !== null && (!finite(accuracy) || accuracy < 0)) return null;

    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      const heading = event.webkitCompassHeading;
      if (!finite(heading) || heading < 0 || heading > 360) return null;
      // Apple documents -1 as uncalibrated and unusable. Reject all malformed
      // or negative accuracy values, but preserve an absent/unknown accuracy.
      const result = { heading: normalizeDegrees(heading), source: 'webkit' };
      if (finite(accuracy)) result.accuracy = accuracy;
      return result;
    }

    if (event.absolute !== true || !finite(event.alpha) || event.alpha < 0 || event.alpha >= 360) return null;
    return { heading: normalizeDegrees(360 - event.alpha), source: 'absolute' };
  }

  return Object.freeze({ normalizeDegrees, cardinal, isPhoneLevel, readHeading });
});
