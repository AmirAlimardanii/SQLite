import { Capacitor } from "@capacitor/core";
import initSqlJs from "sql.js";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "0VE7aQMHfwFEbKRc023DGg98RO9qoECTFxmxtGh4";
const DATABASE_NAME = "simmab";
const KEY_NAME = "wells3_1708";
const NAME = "Census";

const myStudy = ["4717", "1708"];
export const wells3Urls = myStudy.map((id) => ({
  url: `https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/src/wells/wells3_${id}.txt`,
  file: `wells3_${id}`,
}));

export const databases = {
  wells3: {
    urls: wells3Urls,
    id: "INTEGER PRIMARY KEY",
    d: "INTEGER",
    c: "TEXT",
    e: "INTEGER",
    h: "TEXT",
    m: "INTEGER",
    a: "TEXT",
    n: "TEXT",
    q: "TEXT",
    p: "INTEGER",
    i: "TEXT",
    f: "INTEGER",
    k: "INTEGER",
    s: "INTEGER",
    j: "INTEGER",
    r: "INTEGER",
    o: "INTEGER",
    u: "TEXT",
    g: "REAL",
    t: "REAL",
    b: "TEXT",
    w: "TEXT",
    v: "TEXT",
    l: "TEXT",
    ms: "TEXT",
  },
  // users: {
  //   urls: [
  //     "https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/users_encrypted_base64.txt",
  //   ],
  //   id: "INTEGER PRIMARY KEY",
  //   user_name: "TEXT",
  //   first_name: "TEXT",
  //   last_name: "TEXT",
  //   national_code: "TEXT",
  // },
};
// --- Base64 <-> Uint8Array ---
function uint8ArrayToBase64(uint8Array) {
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(uint8Array[i]);
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// --- رمزگشایی ---
function decryptData(encryptedText) {
  try {
    // AES decrypt → WordArray
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);

    // WordArray → UTF8 (این مرحله باید Base64 بده چون اون‌طوری ذخیره کرده بودیم)
    const base64 = decrypted.toString(CryptoJS.enc.Utf8);

    if (!base64) {
      throw new Error("❌ Decryption failed: empty base64 output");
    }

    // Base64 → Uint8Array → SQLite binary
    return base64ToUint8Array(base64);
  } catch (error) {
    console.error("❌ Error while decrypting data:", error);
    throw error;
  }
}

let db = null;

// --- دریافت و لود دیتابیس ---

export async function manageIndexedDBFiles1() {
  if (Capacitor.getPlatform() === "web") {
    for (const [tableName, { urls }] of Object.entries(databases)) {
      let keysList = await getKeysInIndexedDB(NAME);
      let allowKeys = urls.map(({ file }) => file);
      let mostRemoveKeys = keysList.filter((key) => !allowKeys.includes(key));

      if (mostRemoveKeys.length > 0) {
        await Promise.all(mostRemoveKeys.map((key) => deleteKeyFromIndexedDB(NAME, key)));
      }

      // پردازش هر URL برای این جدول
      for (let i = 0; i < urls.length; i++) {
        const savedDb = await loadFromIndexedDB(NAME, urls[i].file);
        if (!savedDb || savedDb.length < 5) {
          try {
            const response = await fetch(urls[i].url);
            if (!response.ok) throw new Error(`❌ Failed to download DB from ${urls[i]}`);
            console.log("resp ", response);

            const encryptedText = await response.text();
            console.log("encryptedText ", encryptedText);

            await saveToIndexedDB(NAME, urls[i].file, encryptedText);
          } catch (error) {
            console.error(`❌ Error loading table ${tableName} from ${urls[i]}:`, error);
          }
        }
      }
    }
  }
}

export async function importDatabaseFromFiles(tableName) {
  if (Capacitor.getPlatform() === "web") {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`,
    });

    const mainDb = new SQL.Database();

    // ستون‌های تعریف‌شده برای این جدول
    let columns = Object.keys(databases[tableName]).filter((col) => col !== "urls");
    let urls = databases[tableName].urls;

    // ایجاد جدول مقصد با ستون __source
    mainDb.exec(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        __source TEXT,
        ${columns
          .map((colName) =>
            colName === "id"
              ? `"${colName}" INTEGER` // دیگه PRIMARY KEY نیست
              : `"${colName}" ${databases[tableName][colName]}`
          )
          .join(", ")}
      )
    `);
    for (const url of urls) {
      const response = await fetch(url?.url);
      if (!response.ok) continue;
      const encryptedText = await response.text();
      const decryptedData = decryptData(encryptedText);
      const tempDb = new SQL.Database(decryptedData);
      const rows = tempDb.exec(`SELECT * FROM "${tableName}"`);
      if (rows.length === 0) {
        tempDb.close();
        continue;
      }
      const sourceColumns = rows[0].columns;
      const values = rows[0].values;

      const stmt = mainDb.prepare(
        `INSERT INTO "${tableName}" (__source, ${sourceColumns.map((c) => `"${c}"`).join(", ")})
         VALUES (?${", ?".repeat(sourceColumns.length)})`
      );
      for (const row of values) {
        stmt.run(["wells3", ...row]); // key = wells3_6002 یا wells3_6007 و ...
      }
      stmt.free();
      tempDb.close();
    }

    db = mainDb;
    console.log(`✅ ${tableName} merged from all sources`);
  }
}
export async function manageIndexedDBFiles() {
  if (Capacitor.getPlatform() === "web") {
    for (const [tableName, { urls }] of Object.entries(databases)) {
      // پردازش هر URL برای این جدول
      for (let i = 0; i < urls.length; i++) {
        // const savedDb = await loadFromIndexedDB(NAME, urls[i].file);
        // if (!savedDb || savedDb.length < 5) {
        try {
          const response = await fetch(urls[i].url);
          if (!response.ok) throw new Error(`❌ Failed to download DB from ${urls[i]}`);
          console.log("resp ", response);

          const encryptedText = await response.text();
          console.log("encryptedText ", encryptedText);

          // await saveToIndexedDB(NAME, urls[i].file, encryptedText);
        } catch (error) {
          console.error(`❌ Error loading table ${tableName} from ${urls[i]}:`, error);
        }
        // }
      }
    }
  }
}
export async function importDatabaseFromFiles1(tableName) {
  if (Capacitor.getPlatform() === "web") {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`,
    });
    const mainDb = new SQL.Database();
    let keys = await getKeysInIndexedDB(NAME);

    let columns = Object.keys(databases[tableName]).filter((col) => col !== "urls");
    // ایجاد جدول اگر وجود ندارد

    mainDb.exec(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          ${columns.map((colName) => `"${colName}" ${databases[tableName][colName]}`).join(", ")}
        )
      `);

    for (const key of keys.filter((k) => k.startsWith(`${tableName}_`))) {
      const file_data = await loadFromIndexedDB(NAME, key);
      const decryptedData = decryptData(file_data);

      const tempDb = new SQL.Database(decryptedData);

      //       // خواندن داده‌ها از جدول متناظر
      const rows = tempDb.exec(`SELECT * FROM "${tableName}"`);

      const sourceColumns = rows[0].columns;
      const values = rows[0].values;

      //         // درج داده‌ها
      const stmt = mainDb.prepare(
        `INSERT OR REPLACE INTO "${tableName}" (${sourceColumns
          .map((c) => `"${c}"`)
          .join(", ")}) VALUES (${sourceColumns.map(() => "?").join(", ")})`
      );

      for (const row of values) {
        stmt.run(row);
      }
      stmt.free();

      tempDb.close();
    }
    db = mainDb;
  }

  // برای هر جدول در databases

  //   // پردازش هر URL برای این جدول
  //   for (let i = 0; i < urls.length; i++) {
  //     try {
  //       const response = await fetch(urls[i].url);
  //       if (!response.ok) throw new Error(`❌ Failed to download DB from ${urls[i]}`);
  //       console.log("resp ", response);

  //       const encryptedText = await response.text();
  //       console.log("encryptedText ", encryptedText);

  //       await saveToIndexedDB(NAME, urls[i].file, encryptedText);

  //       const decrypted = decryptData(encryptedText);
  //       const tempDb = new SQL.Database(decrypted);

  //       // خواندن داده‌ها از جدول متناظر
  //       const rows = tempDb.exec(`SELECT * FROM "${tableName}"`);

  //       if (rows.length > 0) {
  //         const sourceColumns = rows[0].columns;
  //         const values = rows[0].values;

  //         // درج داده‌ها
  //         const stmt = mainDb.prepare(
  //           `INSERT OR REPLACE INTO "${tableName}" (${sourceColumns
  //             .map((c) => `"${c}"`)
  //             .join(", ")}) VALUES (${sourceColumns.map(() => "?").join(", ")})`
  //         );

  //         for (const row of values) {
  //           stmt.run(row);
  //         }
  //         stmt.free();
  //       }

  //       tempDb.close();
  //       console.log(`✅ Table ${tableName} loaded from URL ${i + 1}/${urls.length}`);
  //     } catch (error) {
  //       console.error(`❌ Error loading table ${tableName} from ${urls[i]}:`, error);
  //     }
  //   }
  // }

  // ذخیره دیتابیس نهایی
  // const mergedBinary = mainDb.export();

  // db = mainDb;
  // console.log("✅ All tables merged & saved to IndexedDB");
}

export async function importDatabaseFromFiles2(tableName) {
  if (Capacitor.getPlatform() === "web") {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`,
    });

    const mainDb = new SQL.Database();
    let keys = await getKeysInIndexedDB(NAME);

    // ستون‌های تعریف‌شده برای این جدول
    let columns = Object.keys(databases[tableName]).filter((col) => col !== "urls");

    // ایجاد جدول مقصد با ستون __source
    mainDb.exec(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        __source TEXT,
        ${columns
          .map((colName) =>
            colName === "id"
              ? `"${colName}" INTEGER` // دیگه PRIMARY KEY نیست
              : `"${colName}" ${databases[tableName][colName]}`
          )
          .join(", ")}
      )
    `);

    for (const key of keys.filter((k) => k.startsWith(`${tableName}_`))) {
      const file_data = await loadFromIndexedDB(NAME, key);
      if (!file_data) continue;

      const decryptedData = decryptData(file_data);
      const tempDb = new SQL.Database(decryptedData);

      const rows = tempDb.exec(`SELECT * FROM "${tableName}"`);
      if (rows.length === 0) {
        tempDb.close();
        continue;
      }

      const sourceColumns = rows[0].columns;
      const values = rows[0].values;

      const stmt = mainDb.prepare(
        `INSERT INTO "${tableName}" (__source, ${sourceColumns.map((c) => `"${c}"`).join(", ")})
         VALUES (?${", ?".repeat(sourceColumns.length)})`
      );

      for (const row of values) {
        stmt.run([key, ...row]); // key = wells3_6002 یا wells3_6007 و ...
      }

      stmt.free();
      tempDb.close();
    }

    db = mainDb;
    console.log(`✅ ${tableName} merged from all sources`);
  }
}

export async function getTableData(tableName, limit = 100000) {
  if (!db) throw new Error("❌ Database not loaded yet");

  let orderBy = "updated_at";
  if (Capacitor.getPlatform() === "web") {
    const tableInfo = db.exec(`PRAGMA table_info("${tableName}")`);
    const columns = tableInfo[0].values.map((row) => row[1]);
    if (!columns.includes("updated_at")) {
      orderBy = "id";
    }
    const res = db.exec(`SELECT * FROM "${tableName}" ORDER BY ${orderBy} DESC LIMIT ${limit}`);
    if (res.length === 0) return [];
    return res[0].values.map((row) => {
      const obj = {};
      res[0].columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });
  } else {
    const tableInfo = await db.query(`PRAGMA table_info("${tableName}")`);
    const columns = tableInfo.values.map((row) => row[1]);
    if (!columns.includes("updated_at")) {
      orderBy = "id";
    }
    const res = await db.query(
      `SELECT * FROM "${tableName}" ORDER BY ${orderBy} DESC LIMIT ${limit}`
    );
    return res.values;
  }
}
export async function deleteRecords(tableName, ids) {
  if (!ids || ids.length === 0) return;
  if (!db) throw new Error("❌ Database not loaded yet");

  const placeholders = ids.map(() => "?").join(",");
  const query = `DELETE FROM "${tableName}" WHERE id IN (${placeholders})`;

  db.run(query, ids);
  await saveToIndexedDB(NAME, KEY_NAME, db.export());

  console.log(`✅ Deleted ${ids.length} records from ${tableName}`);
}

// --- اضافه یا ویرایش رکوردها در هر جدول (INSERT OR REPLACE) ---
export async function upsertRecords(tableName, records) {
  if (!records || records.length === 0) return;
  if (!db) throw new Error("❌ Database not loaded yet");

  // دریافت نام ستون‌ها از جدول
  const tableInfo = db.exec(`PRAGMA table_info("${tableName}")`);
  const columns = tableInfo[0].values.map((row) => row[1]);

  for (const record of records) {
    const values = columns.map((col) => record[col] || null);
    const placeholders = columns.map(() => "?").join(", ");

    db.run(
      `INSERT OR REPLACE INTO "${tableName}" (${columns
        .map((c) => `"${c}"`)
        .join(", ")}) VALUES (${placeholders})`,
      values
    );
  }

  await saveToIndexedDB(NAME, KEY_NAME, db.export());
  console.log(`✅ Upserted ${records.length} records in ${tableName}`);
}

// --- دریافت رکورد بر اساس ID از هر جدول ---
export async function getRecordById(tableName, id) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    const res = db.exec(`SELECT * FROM "${tableName}" WHERE id = ?`, [id]);
    if (res.length === 0) return null;

    const record = {};
    res[0].columns.forEach((col, index) => {
      record[col] = res[0].values[0][index];
    });
    return record;
  } else {
    const res = await db.query(`SELECT * FROM "${tableName}" WHERE id = ?`, [id]);
    return res.values.length > 0 ? res.values[0] : null;
  }
}

// --- mock API برای سینک (عمومی) ---
export async function mockSyncApi(tableName, last_update) {
  console.log(`📡 Mock API called for ${tableName} with last_update:`, last_update);

  if (tableName === "sources") {
    return {
      createData: [
        {
          id: 5556,
          comapny: "510",
          type: "22",
          name: "تست آپدیت شده",
          code: "",
          special: "1",
          aquifer: "",
          river: "هریرود",
          village: "ابراهیم بای",
          status: "1",
          study: "6009",
          tamab: "",
          lng: "61.2606353",
          lat: "35.6185029",
          alt: "",
          created_at: "2025-03-04 10:11:32",
          updated_at: "2025-09-01 12:00:00",
        },
      ],
      deletedData: ["5554", "5555"],
      updateData: [
        {
          id: "5558",
          comapny: "510",
          type: "22",
          name: "تست string اپدیت",
          code: "",
          special: "1",
          aquifer: "",
          river: "هریرود",
          village: "ابراهیم بای",
          status: "1",
          study: "6009",
          tamab: "",
          lng: "61.2606353",
          lat: "35.6185029",
          alt: "",
          created_at: "2025-03-04 10:11:32",
          updated_at: "2025-09-01 12:00:00",
        },
      ],
    };
  } else if (tableName === "users") {
    return {
      createData: [
        {
          id: 1001,
          user_name: "new_user",
          first_name: "نام",
          last_name: "3333333",
          national_code: "0012345678",
          created_at: "2025-09-01 10:00:00",
          updated_at: "2025-09-01 10:00:00",
        },
      ],
      deletedData: ["1000", "1002"],
      updateData: [
        {
          id: 1003,
          user_name: "updated_user",
          first_name: "نام",
          last_name: "آپدیت شده",
          national_code: "0098765432",
          created_at: "2025-08-01 09:00:00",
          updated_at: "2025-09-01 12:00:00",
        },
      ],
    };
  }

  return { createData: [], deletedData: [], updateData: [] };
}

// --- توابع اختصاصی برای backward compatibility ---
export async function deletedData(tableName, ids) {
  return deleteRecords(tableName, ids);
}

export async function updateData(tableName, data) {
  return upsertRecords(tableName, data);
}

function manageIndexedDB(storeName, mode, callback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        console.error(`❌ ObjectStore "${storeName}" پیدا نشد`);
        resolve(null);
        return;
      }
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      callback(store, resolve, reject);
    };

    request.onerror = reject;
  });
}

async function saveToIndexedDB(name, key, data) {
  return manageIndexedDB(name, "readwrite", (store, resolve, reject) => {
    const req = store.put(data, key);
    req.onsuccess = () => resolve(true);
    req.onerror = reject;
  });
}

async function loadFromIndexedDB(name, key) {
  return manageIndexedDB(name, "readonly", (store, resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = reject;
  });
}

export async function getKeysInIndexedDB(name) {
  return manageIndexedDB(name, "readonly", (store, resolve, reject) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = reject;
  });
}

async function deleteKeyFromIndexedDB(name, key) {
  return manageIndexedDB(name, "readwrite", (store, resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = reject;
  });
}
