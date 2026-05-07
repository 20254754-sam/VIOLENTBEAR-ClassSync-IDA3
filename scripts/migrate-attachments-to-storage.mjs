import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'luminote-attachments';
const DEFAULT_SUPABASE_URL = 'https://doukqtogmakrycfozrjp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdWtxdG9nbWFrcnljZm96cmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzQxNjYsImV4cCI6MjA5MzE1MDE2Nn0.UfBWOTp4Uy84YuG1kb947AGR3AjTJtinaAzvmEUTiS4';

const parseEnvFile = () => {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const contents = readFileSync(envPath, 'utf8');

    contents.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
        return;
      }

      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');

      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch {
    // The script can still use the same fallback credentials as the app.
  }
};

const isDataUrl = (value = '') => typeof value === 'string' && value.startsWith('data:');

const sanitizeSegment = (value = 'file') =>
  String(value)
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'file';

const dataUrlToUpload = (dataUrl) => {
  const commaIndex = dataUrl.indexOf(',');

  if (!dataUrl.startsWith('data:') || commaIndex === -1) {
    throw new Error('Unsupported data URL format.');
  }

  const metadata = dataUrl
    .slice(5, commaIndex)
    .split(';')
    .filter(Boolean);
  const mimeType = metadata.find((part) => part.includes('/')) || 'application/octet-stream';
  const isBase64 = metadata.some((part) => part.toLowerCase() === 'base64');
  const body = dataUrl.slice(commaIndex + 1);
  const buffer = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(decodeURIComponent(body), 'utf8');

  return { buffer, mimeType };
};

const uploadDataUrl = async (supabase, dataUrl, { collection, itemId, ownerId, name, index }) => {
  const { buffer, mimeType } = dataUrlToUpload(dataUrl);
  const safeCollection = sanitizeSegment(collection);
  const safeOwnerId = sanitizeSegment(ownerId || 'legacy');
  const safeItemId = sanitizeSegment(itemId);
  const safeName = sanitizeSegment(name || `attachment-${index}`);
  const storagePath = `${safeCollection}/${safeOwnerId}/${safeItemId}/${Date.now()}-${index}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    cacheControl: '31536000',
    contentType: mimeType
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return {
    url: data.publicUrl,
    storagePath,
    bucket: BUCKET,
    mimeType,
    size: buffer.length
  };
};

const migrateAttachment = async (supabase, attachment, context) => {
  const sourceUrl = attachment?.url || attachment?.dataUrl || '';

  if (!isDataUrl(sourceUrl)) {
    return { attachment, changed: false };
  }

  const uploaded = await uploadDataUrl(supabase, sourceUrl, {
    ...context,
    name: attachment.name,
    index: context.index
  });

  return {
    changed: true,
    attachment: {
      id: attachment.id || `attachment-${Date.now()}-${context.index}`,
      name: attachment.name || 'Attachment',
      type: attachment.type || uploaded.mimeType,
      size: attachment.size || uploaded.size,
      attachedAt: attachment.attachedAt || new Date().toISOString(),
      isImage: Boolean(attachment.isImage),
      url: uploaded.url,
      storagePath: uploaded.storagePath,
      bucket: uploaded.bucket
    }
  };
};

const migrateRows = async (supabase, tableName, migratePayload) => {
  const { data, error } = await supabase.from(tableName).select('id,payload,created_at,updated_at');

  if (error) {
    throw error;
  }

  let changedCount = 0;

  for (const row of data || []) {
    const { changed, payload } = await migratePayload(supabase, row.payload || {}, row.id);

    if (!changed) {
      continue;
    }

    const { error: updateError } = await supabase
      .from(tableName)
      .upsert(
        {
          id: String(row.id),
          payload,
          created_at: row.created_at || payload.createdAt || new Date().toISOString(),
          updated_at: payload.updatedAt || new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (updateError) {
      throw updateError;
    }

    changedCount += 1;
    console.log(`Migrated ${tableName} row ${row.id}`);
  }

  return changedCount;
};

parseEnvFile();

const supabaseUrl = process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

console.log('Starting Luminote attachment migration...');
console.log(`Using Supabase project: ${supabaseUrl}`);

const noteCount = await migrateRows(supabase, 'luminote_notes', async (client, payload, rowId) => {
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  let changed = false;
  const migratedAttachments = [];

  for (const [index, attachment] of attachments.entries()) {
    const result = await migrateAttachment(client, attachment, {
      collection: 'notes',
      itemId: rowId,
      ownerId: payload.uploaderId,
      index
    });
    changed = changed || result.changed;
    migratedAttachments.push(result.attachment);
  }

  return {
    changed,
    payload: changed
      ? {
          ...payload,
          attachments: migratedAttachments,
          updatedAt: new Date().toISOString()
        }
      : payload
  };
});

const messageCount = await migrateRows(supabase, 'luminote_messages', async (client, payload, rowId) => {
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  let changed = false;
  const migratedAttachments = [];

  for (const [index, attachment] of attachments.entries()) {
    const result = await migrateAttachment(client, attachment, {
      collection: 'message-attachments',
      itemId: rowId,
      ownerId: payload.senderId,
      index
    });
    changed = changed || result.changed;
    migratedAttachments.push(result.attachment);
  }

  let migratedVoice = payload.voice || null;

  if (isDataUrl(payload.voice?.dataUrl)) {
    const uploadedVoice = await uploadDataUrl(client, payload.voice.dataUrl, {
      collection: 'message-voices',
      itemId: rowId,
      ownerId: payload.senderId,
      name: `voice-${rowId}.webm`,
      index: 'voice'
    });
    migratedVoice = {
      ...payload.voice,
      dataUrl: undefined,
      url: uploadedVoice.url,
      storagePath: uploadedVoice.storagePath,
      bucket: uploadedVoice.bucket
    };
    delete migratedVoice.dataUrl;
    changed = true;
  }

  return {
    changed,
    payload: changed
      ? {
          ...payload,
          attachments: migratedAttachments,
          voice: migratedVoice,
          updatedAt: new Date().toISOString()
        }
      : payload
  };
});

console.log(`Done. Migrated ${noteCount} note row(s) and ${messageCount} message row(s).`);
console.log('Keep backup tables until you confirm the deployed app works.');
