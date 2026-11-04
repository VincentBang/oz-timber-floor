const key = 'oz-floorplan-handoff-v1';
const ttl = 15 * 60 * 1000;
const fields = ['v', 'createdAt', 'totalAreaM2', 'includedRoomCount', 'method'];

function valid(record, now) {
  return record && typeof record === 'object' && Object.keys(record).length === fields.length &&
    fields.every(field => Object.hasOwn(record, field)) && record.v === 1 && ['manual_trace','reviewed_suggestion'].includes(record.method) &&
    Number.isSafeInteger(record.createdAt) && record.createdAt <= now && record.createdAt > now - ttl &&
    Number.isFinite(record.totalAreaM2) && record.totalAreaM2 > 0 && record.totalAreaM2 <= 100000 &&
    record.totalAreaM2 === Number(record.totalAreaM2.toFixed(2)) &&
    Number.isInteger(record.includedRoomCount) && record.includedRoomCount > 0 && record.includedRoomCount <= 250;
}

export function saveAreaSummary(areaM2, roomCount, storage, now = Date.now(), method = 'manual_trace') {
  try {
    const tab = storage ?? window.sessionStorage;
    tab.removeItem(key);
    if (!Number.isFinite(areaM2) || areaM2 > 100000) return false;
    const record = {v: 1, createdAt: now, totalAreaM2: Number(areaM2.toFixed(2)), includedRoomCount: roomCount, method};
    if (!valid(record, now)) return false;
    tab.setItem(key, JSON.stringify(record));
    return true;
  } catch { return false; }
}

export function takeAreaSummary(storage, now = Date.now()) {
  try {
    const tab = storage ?? window.sessionStorage;
    const raw = tab.getItem(key);
    if (raw === null) return null;
    tab.removeItem(key);
    if (raw.length > 240) return null;
    const record = JSON.parse(raw);
    return valid(record, now) ? record : null;
  } catch { return null; }
}

export {contactDestination} from './context.mjs';
