import assert from "node:assert/strict";
globalThis.navigator = {
  geolocation: {
    getCurrentPosition(success, error) {
      const reads = [
        { coords: { latitude: 12.1, longitude: 77.1, accuracy: 80 } },
        { coords: { latitude: 12.1002, longitude: 77.1002, accuracy: 24 } },
      ];
      const next = reads.shift();
      if (!next) return error(new Error("timeout"));
      success({ coords: next.coords });
    },
  },
};
const { getBestLocation, LOCATION_SETTINGS } = await import("./src/utils/location.js");
const loc = await getBestLocation({ maxAccuracyMeters: 50, timeoutMs: 100, attempts: 3 });
assert.equal(loc.accuracy, 24);
globalThis.navigator = {
  geolocation: {
    getCurrentPosition(success) {
      success({ coords: { latitude: 12.1, longitude: 77.1, accuracy: 75 } });
    },
  },
};
await assert.rejects(() => getBestLocation({ maxAccuracyMeters: 50, timeoutMs: 100, attempts: 2 }), /GPS accuracy/i);
assert.equal(LOCATION_SETTINGS.enableHighAccuracy, true);
assert.equal(LOCATION_SETTINGS.maximumAge, 0);
assert.equal(LOCATION_SETTINGS.timeout, 12000);
console.log("GPS utility checks passed");
