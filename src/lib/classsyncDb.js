import { isSupabaseConfigured, supabase } from './supabaseClient';

const DB_NAME = 'classsync-db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const LEGACY_CLOUD_TABLE = 'app_state';
const CLOUD_READ_TIMEOUT_MS = 4500;
const CLOUD_WRITE_TIMEOUT_MS = 4500;
const CLOUD_CACHE_TTL_MS = 5 * 60 * 1000;
export const ATTACHMENT_BUCKET = 'luminote-attachments';
export const ATTACHMENT_FILE_SIZE_LIMIT_BYTES = 10 * 1024 * 1024;

const CLOUD_TABLES = {
  forum: 'luminote_forum_posts',
  gameScores: 'luminote_game_scores',
  messages: 'luminote_messages',
  notes: 'luminote_notes',
  notifications: 'luminote_notifications',
  reports: 'luminote_reports',
  rooms: 'luminote_rooms',
  users: 'luminote_users'
};

let dbPromise = null;

const getCloudCacheKey = (key) => `luminote-cloud-read-at:${key}`;

const getLastCloudReadAt = (key) => {
  try {
    return Number(window.localStorage.getItem(getCloudCacheKey(key))) || 0;
  } catch {
    return 0;
  }
};

const setLastCloudReadAt = (key) => {
  try {
    window.localStorage.setItem(getCloudCacheKey(key), String(Date.now()));
  } catch {
    // Local cache timestamps are best effort only.
  }
};

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

export const getDbTableName = (key) => getCloudTable(key);

export const getAttachmentUrl = (attachment = {}) => attachment.url || attachment.dataUrl || '';

export const formatFileSize = (bytes = 0) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  const megabytes = bytes / (1024 * 1024);
  const displayValue = Number.isInteger(megabytes) ? String(megabytes) : megabytes.toFixed(megabytes >= 100 ? 0 : 1);

  return `${displayValue} MB`;
};

export const getAttachmentUploadErrorMessage = (error, label = 'attachments') => {
  const detail = error?.message || '';

  if (/bucket|storage|row-level security|policy|permission|unauthorized|forbidden/i.test(detail)) {
    return `The ${label} could not be uploaded because Supabase Storage is not ready. Run the updated Supabase setup SQL, then try again.`;
  }

  if (/too large|size|limit|payload/i.test(detail)) {
    return detail;
  }

  if (/failed to fetch|network|timed out|timeout/i.test(detail)) {
    return `The ${label} upload was interrupted. Check your internet connection, then try again.`;
  }

  return detail || `The ${label} could not be uploaded. Please try again.`;
};

const isDataUrl = (value = '') => typeof value === 'string' && value.startsWith('data:');

const sanitizeStorageSegment = (value = 'file') =>
  String(value)
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'file';

const normalizeAttachmentMetadata = (attachment = {}) => {
  const fallbackUrl = getAttachmentUrl(attachment);
  const normalized = {
    id: attachment.id || `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: attachment.name || 'Attachment',
    type: attachment.type || 'application/octet-stream',
    size: attachment.size || 0,
    attachedAt: attachment.attachedAt || new Date().toISOString(),
    isImage: Boolean(attachment.isImage),
    url: attachment.url || fallbackUrl,
    storagePath: attachment.storagePath || '',
    bucket: attachment.bucket || ''
  };

  if (attachment.dataUrl && !attachment.url) {
    normalized.dataUrl = attachment.dataUrl;
  }

  return normalized;
};

const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const uploadAttachmentsToStorage = async (attachments = [], options = {}) => {
  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  if (safeAttachments.length === 0) {
    return [];
  }

  const uploadedAttachments = [];

  for (const [index, attachment] of safeAttachments.entries()) {
    const normalized = normalizeAttachmentMetadata(attachment);
    const sourceUrl = getAttachmentUrl(attachment);

    if (!isSupabaseConfigured || !isDataUrl(sourceUrl)) {
      uploadedAttachments.push(normalized);
      continue;
    }

    if (normalized.size > ATTACHMENT_FILE_SIZE_LIMIT_BYTES) {
      throw new Error(
        `"${normalized.name}" is ${formatFileSize(normalized.size)}. The upload limit is ${formatFileSize(
          ATTACHMENT_FILE_SIZE_LIMIT_BYTES
        )} per file.`
      );
    }

    const blob = await dataUrlToBlob(sourceUrl);
    const collection = sanitizeStorageSegment(options.collection || 'attachments');
    const ownerId = sanitizeStorageSegment(options.ownerId || 'anonymous');
    const itemId = sanitizeStorageSegment(options.itemId || `item-${Date.now()}`);
    const fileName = sanitizeStorageSegment(normalized.name);
    const storagePath = `${collection}/${ownerId}/${itemId}/${Date.now()}-${index}-${fileName}`;
    const { error } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(storagePath, blob, {
        cacheControl: '31536000',
        contentType: normalized.type
      });

    if (error) {
      throw new Error(`"${normalized.name}" could not be uploaded: ${error.message || 'Supabase rejected the file.'}`);
    }

    const { data } = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(storagePath);

    uploadedAttachments.push({
      id: normalized.id,
      name: normalized.name,
      type: normalized.type,
      size: normalized.size || blob.size,
      attachedAt: normalized.attachedAt,
      isImage: normalized.isImage,
      url: data.publicUrl,
      storagePath,
      bucket: ATTACHMENT_BUCKET
    });
  }

  return uploadedAttachments;
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

const readCloudCollection = async (key, options = {}) => {
  const tableName = getCloudTable(key);

  if (!tableName) {
    throw new Error(`Unsupported collection key: ${key}`);
  }

  let query = supabase
    .from(tableName)
    .select('payload')
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (Number.isFinite(options.limit) && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return dedupeCollection((data || []).map((row) => row.payload).filter(Boolean));
};

const upsertLocalDbItem = async (key, item) => {
  const currentValue = await readLocalDbValue(key, []);
  const currentItems = isArray(currentValue) ? currentValue : [];
  const itemId = String(item?.id);
  const itemExists = currentItems.some((currentItem) => String(currentItem?.id) === itemId);
  const nextValue = itemExists
    ? currentItems.map((currentItem) => (String(currentItem?.id) === itemId ? item : currentItem))
    : [item, ...currentItems];

  await writeLocalDbValue(key, nextValue);
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

const upsertCloudCollectionItem = async (key, item) => {
  const tableName = getCloudTable(key);

  if (!tableName) {
    throw new Error(`Unsupported collection key: ${key}`);
  }

  const row = {
    created_at: item.createdAt || new Date().toISOString(),
    id: String(item.id),
    payload: item,
    updated_at: getCollectionTimestamp(item)
  };

  const { error } = await supabase.from(tableName).upsert(row, { onConflict: 'id' });

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

const readCloudDbValue = async (key, fallback, options = {}) => {
  const tableName = getCloudTable(key);

  if (!tableName) {
    return readLegacyCloudDbValue(key, fallback);
  }

  const cloudCollection = await readCloudCollection(key, options);

  if (cloudCollection.length > 0) {
    return cloudCollection;
  }

  const migratedValue = await migrateLegacyCloudCollection(key);

  if (migratedValue !== undefined) {
    return migratedValue;
  }

  return [];
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
      setLastCloudReadAt(key);
      await writeLocalDbValue(key, cloudValue);
      return cloudValue;
    } catch {
      return readLocalDbValue(key, fallback);
    }
  }

  return readLocalDbValue(key, fallback);
};

export const writeDbItem = async (key, item) => {
  if (isSupabaseConfigured && getCloudTable(key)) {
    await withTimeout(
      upsertCloudCollectionItem(key, item),
      CLOUD_WRITE_TIMEOUT_MS,
      `Cloud item write timed out for ${key}.`
    );
  }

  await upsertLocalDbItem(key, item);
};

export const writeDbValue = async (key, value) => {
  if (isSupabaseConfigured) {
    await withTimeout(
      writeCloudDbValue(key, value),
      CLOUD_WRITE_TIMEOUT_MS,
      `Cloud write timed out for ${key}.`
    );
  }

  await writeLocalDbValue(key, value);
};

export const deleteDbItem = async (key, itemId) => {
  if (isSupabaseConfigured && getCloudTable(key)) {
    await withTimeout(
      deleteCloudCollectionItem(key, itemId),
      CLOUD_WRITE_TIMEOUT_MS,
      `Cloud delete timed out for ${key}.`
    );
  }

  await deleteLocalDbItem(key, itemId);
};

export const readManyDbValues = async (entries) => {
  const results = await Promise.all(entries.map(({ key, fallback }) => readDbValue(key, fallback)));

  return entries.reduce((accumulator, entry, index) => {
    accumulator[entry.key] = results[index];
    return accumulator;
  }, {});
};

export const readDbSnapshot = async (key, options = {}) => {
  const localValue = await withTimeout(
    readLocalDbValue(key, undefined),
    CLOUD_READ_TIMEOUT_MS,
    `Local read timed out for ${key}.`
  ).catch(() => undefined);

  if (options.skipCloud || !isSupabaseConfigured) {
    return {
      cloudError: null,
      cloudValue: undefined,
      hasCloudAccess: false,
      localValue
    };
  }

  const hasFreshLocalValue =
    options.preferLocal &&
    isArray(localValue) &&
    Date.now() - getLastCloudReadAt(key) < (options.cacheTtlMs || CLOUD_CACHE_TTL_MS);

  if (hasFreshLocalValue) {
    return {
      cloudError: null,
      cloudValue: undefined,
      hasCloudAccess: true,
      localValue
    };
  }

  try {
    const cloudValue = await withTimeout(
      readCloudDbValue(key, undefined, options),
      CLOUD_READ_TIMEOUT_MS,
      `Cloud read timed out for ${key}.`
    );

    setLastCloudReadAt(key);

    if (cloudValue !== undefined) {
      await writeLocalDbValue(key, cloudValue);
    } else if (getCloudTable(key)) {
      await writeLocalDbValue(key, []);
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
  const snapshots = await Promise.all(entries.map(({ key, ...options }) => readDbSnapshot(key, options)));

  return entries.reduce((accumulator, entry, index) => {
    accumulator[entry.key] = snapshots[index];
    return accumulator;
  }, {});
};

export const subscribeToDbCollection = (key, onChange) => {
  const tableName = getCloudTable(key);

  if (!isSupabaseConfigured || !tableName) {
    return () => undefined;
  }

  const channel = supabase
    .channel(`luminote:${tableName}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const isCloudSyncEnabled = isSupabaseConfigured;
