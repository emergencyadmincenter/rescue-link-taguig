import fpPromise from '@fingerprintjs/fingerprintjs';

const DEVICE_UUID_KEY = 'rlt_device_uuid';

let cachedDeviceUuid: string | undefined = undefined;
let cachedFingerprintHash: string | undefined = undefined;
let isInitialized = false;

// Simple UUID v4 fallback if crypto.randomUUID is not available
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function initDeviceIdentification() {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  isInitialized = true;

  try {
    // 1. Get or generate persistent UUID
    let uuid = localStorage.getItem(DEVICE_UUID_KEY);
    if (!uuid) {
      uuid = generateUUID();
      localStorage.setItem(DEVICE_UUID_KEY, uuid);
    }
    cachedDeviceUuid = uuid;
  } catch (e) {
    console.warn("Local storage unavailable for device identification", e);
    // If local storage fails (e.g., incognito mode strict block), use a temporary one for this session
    cachedDeviceUuid = generateUUID();
  }

  // 2. Generate fingerprint asynchronously
  // We use setTimeout to defer execution, avoiding blocking the main UI thread during page startup
  setTimeout(() => {
    try {
      fpPromise.load().then(fp => fp.get()).then(result => {
        cachedFingerprintHash = result.visitorId;
      }).catch(e => {
        console.warn("Fingerprint generation failed or was blocked", e);
      });
    } catch (e) {
      console.warn("Fingerprint library initialization failed", e);
    }
  }, 1000);
}

export function getDeviceIdentifiers() {
  // If not initialized yet (e.g., server-side or early render), we safely return what we have
  return {
    device_uuid: cachedDeviceUuid,
    fingerprint_hash: cachedFingerprintHash,
  };
}
