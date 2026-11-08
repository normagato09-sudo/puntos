// Almacén clave-valor mínimo sobre IndexedDB (con respaldo en memoria si no está disponible).

const DB = "puntos";
const STORE = "kv";
const memory = new Map<string, unknown>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        if (!db) return reject(new Error("no-idb"));
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result as T);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    return await run<T>("readonly", (s) => s.get(key));
  } catch {
    return memory.get(key) as T | undefined;
  }
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  memory.set(key, value);
  try {
    await run("readwrite", (s) => s.put(value, key));
  } catch {
    /* se queda en memoria */
  }
}
