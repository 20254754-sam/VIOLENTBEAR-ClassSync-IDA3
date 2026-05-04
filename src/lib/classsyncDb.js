import { isSupabaseConfigured, supabase } from './supabaseClient';

const DB_NAME = 'classsync-db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const LEGACY_CLOUD_TABLE = 'app_state';
const CLOUD_READ_TIMEOUT_MS = 4500;
const CLOUD_WRITE_TIMEOUT_MS = 4500;

const CLOUD_TABLES = {
  forum: 'classsync_forum_posts',
  messages: 'classsync_messages',
  notes: 'classsync_notes',
  notifications: 'classsync_notifications',
  reports: 'classsync_reports',
  rooms: 'classsync_rooms',
  users: 'classsync_users'
};

let dbPromise = null;

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);

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

const isArray = (value) => Array.isArray(value);

const dedupeCollection = (items) => {
  if (!isArray(items)) {
    return [];
  }

  const mergedItems = new Map();

  items.forEach((item) => {
    if (!item || typeof item !== 'object' || item.id === undefined || item.id === null) {
      return;
    }

    mergedItems.set(String(item.id), item);
  });

  return Array.from(mergedItems.values());
};

const getCollectionTimestamp = (item) => item?.updatedAt || item?.createdAt || new Date().toISOString();

const getCloudTable = (key) => CLOUD_TABLES[key] || null;

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

const deleteLocalDbItem = async (key, itemId) => {
  const currentValue = await readLocalDbValue(key, []);

  if (!isArray(currentValue)) {
    return;
  }

  const nextValue = currentValue.filter((item) => String(item?.id) !== String(itemId));
  await writeLocalDbValue(key, nextValue);
};

const readLegacyCloudDbValue = async (key, fallback) => {
  const { data, error } = await supabase.from(LEGACY_CLOUD_TABLE).select('value').eq('key', key).maybeSingle();

  if (error) {
    throw error;
  }

  return data?.value ?? fallback;
};

const readCloudCollection = async (key) => {
  const tableName = getCloudTable(key);

  if (!tableName) {
    throw new Error(`Unsupported collection key: ${key}`);
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('payload')
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return dedupeCollection((data || []).map((row) => row.payload).filter(Boolean));
};

const upsertCloudCollection = async (key, value) => {
  const tableName = getCloudTable(key);

  if (!tableName) {
    throw new Error(`Unsupported collection key: ${key}`);
  }

  const items = dedupeCollection(value);

  if (items.length === 0) {
    return;
  }

  const rows = items.map((item) => ({
    created_at: item.createdAt || new Date().toISOString(),
    id: String(item.id),
    payload: item,
    updated_at: getCollectionTimestamp(item)
  }));

  const { error } = await supabase.from(tableName).upsert(rows, { onConflict: 'id' });

  if (error) {
    throw error;
  }
};

const deleteCloudCollectionItem = async (key, itemId) => {
  const tableName = getCloudTable(key);

  if (!tableName) {
    throw new Error(`Unsupported collection key: ${key}`);
  }

  const { error } = await supabase.from(tableName).delete().eq('id', String(itemId));

  if (error) {
    throw error;
  }
};

const migrateLegacyCloudCollection = async (key) => {
  const legacyValue = await readLegacyCloudDbValue(key, undefined);

  if (!isArray(legacyValue) || legacyValue.length === 0) {
    return undefined;
  }

  await upsertCloudCollection(key, legacyValue);
  return legacyValue;
};

const readCloudDbValue = async (key, fallback) => {
  const tableName = getCloudTable(key);

  if (!tableName) {
    return readLegacyCloudDbValue(key, fallback);
  }

  const cloudCollection = await readCloudCollection(key);

  if (cloudCollection.length > 0) {
    return cloudCollection;
  }

  const migratedValue = await migrateLegacyCloudCollection(key);

  if (migratedValue !== undefined) {
    return migratedValue;
  }

  return fallback;
};

const writeCloudDbValue = async (key, value) => {
  const tableName = getCloudTable(key);

  if (!tableName) {
    const { error } = await supabase.from(LEGACY_CLOUD_TABLE).upsert(
      {
        key,
        updated_at: new Date().toISOString(),
        value
      },
      { onConflict: 'key' }
    );

    if (error) {
      throw error;
    }

    return;
  }

  await upsertCloudCollection(key, value);
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
    await withTimeout(
      writeCloudDbValue(key, value),
      CLOUD_WRITE_TIMEOUT_MS,
      `Cloud write timed out for ${key}.`
    );
  }
};

export const deleteDbItem = async (key, itemId) => {
  await deleteLocalDbItem(key, itemId);

  if (isSupabaseConfigured && getCloudTable(key)) {
    await withTimeout(
      deleteCloudCollectionItem(key, itemId),
      CLOUD_WRITE_TIMEOUT_MS,
      `Cloud delete timed out for ${key}.`
    );
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
  const localValue = await withTimeout(
    readLocalDbValue(key, undefined),
    CLOUD_READ_TIMEOUT_MS,
    `Local read timed out for ${key}.`
  ).catch(() => undefined);

  if (!isSupabaseConfigured) {
    return {
      cloudError: null,
      cloudValue: undefined,
      hasCloudAccess: false,
      localValue
    };
  }

  try {
    const cloudValue = await withTimeout(
      readCloudDbValue(key, undefined),
      CLOUD_READ_TIMEOUT_MS,
      `Cloud read timed out for ${key}.`
    );

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
