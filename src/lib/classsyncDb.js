import { isSupabaseConfigured, supabase } from './supabaseClient';

const DB_NAME = 'classsync-db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const CLOUD_TABLE = 'app_state';

let dbPromise = null;

const openDatabase = () => {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not supported in this browser.'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
    });
  }

  return dbPromise;
};

const withStore = async (mode, operation) => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
};

const readLocalDbValue = async (key, fallback) => {
  try {
    const result = await withStore('readonly', (store) => store.get(key));
    return result ?? fallback;
  } catch {
    return fallback;
  }
};

const writeLocalDbValue = async (key, value) => {
  await withStore('readwrite', (store) => store.put(value, key));
};

const readCloudDbValue = async (key, fallback) => {
  const { data, error } = await supabase.from(CLOUD_TABLE).select('value').eq('key', key).maybeSingle();

  if (error) {
    throw error;
  }

  return data?.value ?? fallback;
};

const writeCloudDbValue = async (key, value) => {
  const { error } = await supabase.from(CLOUD_TABLE).upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'key' }
  );

  if (error) {
    throw error;
  }
};

export const readDbValue = async (key, fallback) => {
  if (isSupabaseConfigured) {
    try {
      const cloudValue = await readCloudDbValue(key, fallback);
      await writeLocalDbValue(key, cloudValue);
      return cloudValue;
    } catch {
      return readLocalDbValue(key, fallback);
    }
  }

  return readLocalDbValue(key, fallback);
};

export const writeDbValue = async (key, value) => {
  await writeLocalDbValue(key, value);

  if (isSupabaseConfigured) {
    await writeCloudDbValue(key, value);
  }
};

export const readManyDbValues = async (entries) => {
  const results = await Promise.all(entries.map(({ key, fallback }) => readDbValue(key, fallback)));

  return entries.reduce((accumulator, entry, index) => {
    accumulator[entry.key] = results[index];
    return accumulator;
  }, {});
};

export const readDbSnapshot = async (key) => {
  const localValue = await readLocalDbValue(key, undefined);

  if (!isSupabaseConfigured) {
    return {
      cloudError: null,
      cloudValue: undefined,
      hasCloudAccess: false,
      localValue
    };
  }

  try {
    const cloudValue = await readCloudDbValue(key, undefined);

    if (cloudValue !== undefined) {
      await writeLocalDbValue(key, cloudValue);
    }

    return {
      cloudError: null,
      cloudValue,
      hasCloudAccess: true,
      localValue
    };
  } catch (cloudError) {
    return {
      cloudError,
      cloudValue: undefined,
      hasCloudAccess: false,
      localValue
    };
  }
};

export const readManyDbSnapshots = async (entries) => {
  const snapshots = await Promise.all(entries.map(({ key }) => readDbSnapshot(key)));

  return entries.reduce((accumulator, entry, index) => {
    accumulator[entry.key] = snapshots[index];
    return accumulator;
  }, {});
};

export const isCloudSyncEnabled = isSupabaseConfigured;
