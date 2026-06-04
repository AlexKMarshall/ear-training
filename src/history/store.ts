import { normalizeAttemptRecord } from "./normalize.ts";
import type { AttemptInput, AttemptRecord } from "./types.ts";

const DB_NAME = "ear-training";
const DB_VERSION = 1;
const STORE_NAME = "attempts";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => resolve(null);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by_timestamp", "timestamp", { unique: false });
        store.createIndex("by_exercise", "practiceModeId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

function getDb(): Promise<IDBDatabase | null> {
  if (!dbPromise) dbPromise = openDatabase();
  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return getDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }

        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        tx.onerror = () => resolve(null);
      }),
  );
}

/** Append one attempt; no-op when IndexedDB is unavailable. */
export function saveAttempt(record: AttemptInput): Promise<void> {
  return runTransaction("readwrite", (store) => store.add(record)).then(() => {});
}

/** All attempts, oldest first (legacy IndexedDB rows are normalized on read). */
export function getAllAttempts(): Promise<AttemptRecord[]> {
  return runTransaction<AttemptRecord[]>("readonly", (store) => store.getAll()).then(
    (rows) =>
      (rows ?? [])
        .map((row) => normalizeAttemptRecord(row))
        .filter((row): row is AttemptRecord => row !== null),
  );
}

/** Reset store (for tests). */
export async function clearAttempts(): Promise<void> {
  await runTransaction("readwrite", (store) => store.clear());
  dbPromise = null;
}
