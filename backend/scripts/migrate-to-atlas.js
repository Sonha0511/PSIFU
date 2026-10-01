/*
 * Copies the entire local PSIFU database to MongoDB Atlas.
 *
 * Safe by default: the command aborts when any destination collection has
 * documents. Use --force only to upsert local documents by their existing _id.
 * --force never drops collections or deletes Atlas-only documents.
 */
const path = require('path');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017';
const atlasUri = process.env.ATLAS_MONGODB_URI;
const dbName = process.env.DB_NAME || 'psifu';
const force = process.argv.includes('--force');
const batchSize = 500;

if (!atlasUri) {
  console.error('Thiếu ATLAS_MONGODB_URI trong backend/.env. URI Atlas không được ghi trực tiếp vào command.');
  process.exit(1);
}

const cleanIndex = ({ v, ns, ...index }) => index;

async function copyIndexes(sourceCollection, targetCollection) {
  const indexes = await sourceCollection.listIndexes().toArray();
  const nonDefaultIndexes = indexes.filter(index => index.name !== '_id_').map(cleanIndex);
  if (!nonDefaultIndexes.length) return 0;

  let copied = 0;
  for (const index of nonDefaultIndexes) {
    try {
      const { key, ...options } = index;
      await targetCollection.createIndex(key, options);
      copied += 1;
    } catch (error) {
      // An existing equivalent index is safe to keep. Conflicting indexes are
      // reported so they can be reviewed without losing any destination data.
      if (error.codeName === 'IndexOptionsConflict' || error.code === 85 || error.code === 86) {
        console.warn(`  ! Không sao chép index \"${index.name}\": index Atlas đang khác cấu hình.`);
      } else {
        throw error;
      }
    }
  }
  return copied;
}

async function migrateCollection(sourceDb, targetDb, name) {
  const source = sourceDb.collection(name);
  const target = targetDb.collection(name);
  const sourceCount = await source.countDocuments();
  const targetCount = await target.countDocuments();

  if (targetCount > 0 && !force) {
    throw new Error(`Atlas collection \"${name}\" đã có ${targetCount} documents. Dừng để tránh ghi đè. Dùng --force chỉ khi bạn đã kiểm tra dữ liệu đích.`);
  }

  console.log(`\nMigrating ${name} (${sourceCount} documents)...`);
  let copied = 0;
  const cursor = source.find({}).batchSize(batchSize);
  let batch = [];
  const flush = async () => {
    if (!batch.length) return;
    if (force) {
      await target.bulkWrite(batch.map(document => ({ replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true } })), { ordered: false });
    } else {
      await target.insertMany(batch, { ordered: true });
    }
    copied += batch.length;
    batch = [];
  };
  for await (const document of cursor) {
    batch.push(document);
    if (batch.length >= batchSize) await flush();
  }
  await flush();

  const indexesCopied = await copyIndexes(source, target);
  console.log(`  ${copied} documents copied. ${indexesCopied} indexes copied.`);
  return { sourceCount, copied, indexesCopied };
}

async function main() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);
  try {
    console.log('Connecting to local MongoDB...');
    await localClient.connect();
    console.log('Connected.');
    console.log('Connecting to MongoDB Atlas...');
    await atlasClient.connect();
    console.log('Connected.');

    const sourceDb = localClient.db(dbName);
    const targetDb = atlasClient.db(dbName);
    const collections = await sourceDb.listCollections({}, { nameOnly: false }).toArray();
    const sourceCollections = collections.filter(collection => collection.type === 'collection');
    const unsupported = collections.filter(collection => collection.type !== 'collection');
    console.log(`Found ${sourceCollections.length} collections.`);
    for (const collection of unsupported) console.warn(`Skipping unsupported ${collection.type}: ${collection.name}`);

    if (!force) {
      for (const collection of sourceCollections) {
        const count = await targetDb.collection(collection.name).countDocuments();
        if (count > 0) throw new Error(`Atlas collection \"${collection.name}\" đã có ${count} documents. Migration chưa chạy; không có dữ liệu nào bị thay đổi.`);
      }
    }

    let documentsMigrated = 0;
    let indexesMigrated = 0;
    for (const collection of sourceCollections) {
      const result = await migrateCollection(sourceDb, targetDb, collection.name);
      documentsMigrated += result.copied;
      indexesMigrated += result.indexesCopied;
    }

    console.log('\nVerification');
    let verified = true;
    for (const collection of sourceCollections) {
      const localCount = await sourceDb.collection(collection.name).countDocuments();
      const atlasCount = await targetDb.collection(collection.name).countDocuments();
      const ok = localCount === atlasCount;
      verified &&= ok;
      console.log(`${collection.name}: Local ${localCount} | Atlas ${atlasCount} | ${ok ? 'OK' : 'MISMATCH'}`);
    }
    console.log('\nMigration completed.');
    console.log(`Collections migrated: ${sourceCollections.length}`);
    console.log(`Documents migrated: ${documentsMigrated}`);
    console.log(`Indexes migrated: ${indexesMigrated}`);
    console.log(`Verification: ${verified ? 'passed' : 'failed'}`);
    process.exitCode = verified ? 0 : 2;
  } finally {
    await Promise.allSettled([localClient.close(), atlasClient.close()]);
  }
}

main().catch(error => { console.error(`\nMigration failed: ${error.message}`); process.exitCode = 1; });
