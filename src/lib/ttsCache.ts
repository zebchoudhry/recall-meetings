// Tiny IndexedDB-backed cache for TTS audio (base64 MP3 strings).
// Keyed by `${lang}::${text}`. Used to skip re-synthesizing common phrases
// (greetings, acknowledgements, etc.) — instant playback + fewer API calls.

const DB_NAME = "recall-tts-cache";
const STORE = "phrases";
const VERSION = 1;
const MAX_TEXT_LEN = 400; // don't bother caching very long, unique replies

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function makeKey(text: string, lang: string): string {
  return `${lang}::${text.trim()}`;
}

export async function getCachedTts(text: string, lang: string): Promise<string | null> {
  if (text.length > MAX_TEXT_LEN) return null;
  try {
    const db = await openDb();
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(makeKey(text, lang));
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedTts(text: string, lang: string, base64: string): Promise<void> {
  if (text.length > MAX_TEXT_LEN) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(base64, makeKey(text, lang));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // ignore — cache is best-effort
  }
}