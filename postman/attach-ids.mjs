/**
 * Postman putCollection API requires each folder/request to have an `id`.
 * Reads Budgeteer-API-v2.postman_collection.json, assigns UUIDs, writes postman-put-payload.json
 * for MCP putCollection (collectionId + collection).
 */
import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function assignIds(items) {
  if (!Array.isArray(items)) return;
  for (const el of items) {
    el.id = el.id ?? randomUUID();
    if (Array.isArray(el.item)) assignIds(el.item);
  }
}

const col = JSON.parse(readFileSync(join(__dirname, 'Budgeteer-API-v2.postman_collection.json'), 'utf8'));
assignIds(col.item);

const collectionId =
  process.env.POSTMAN_COLLECTION_UID ?? '10044652-e89b34f7-8b49-4c41-a24b-4ee87f0c2913';

const out = {
  collectionId,
  collection: col,
};

const dest = join(__dirname, 'postman-put-payload.json');
writeFileSync(dest, JSON.stringify(out));
console.log('Wrote', dest, 'bytes', Buffer.byteLength(JSON.stringify(out)));
