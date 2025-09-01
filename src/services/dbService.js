import { Capacitor } from "@capacitor/core";
import initSqlJs from "sql.js";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "MySecretKey12345";

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
function decryptData(encryptedBase64) {
  const bytes = CryptoJS.AES.decrypt(encryptedBase64, ENCRYPTION_KEY);
  const originalBase64 = bytes.toString(CryptoJS.enc.Utf8);
  return base64ToUint8Array(originalBase64);
}

// --- ذخیره در IndexedDB ---
async function saveToIndexedDB(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("chinook-storage", 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("databases");
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("databases", "readwrite");
      tx.objectStore("databases").put(data, "chinook");
      tx.oncomplete = resolve;
      tx.onerror = reject;
    };
  });
}

// --- لود از IndexedDB ---
async function loadFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("chinook-storage", 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("databases");
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("databases", "readonly");
      const getReq = tx.objectStore("databases").get("chinook");
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = reject;
    };
  });
}

let db = null;

// --- دریافت و لود دیتابیس ---
export async function importDatabaseFromServer(databases) {
  if (Capacitor.getPlatform() === "web") {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`,
    });

    const savedDb = await loadFromIndexedDB();
    if (savedDb) {
      db = new SQL.Database(savedDb);
      console.log("✅ DB loaded from IndexedDB");
      return;
    }

    // دیتابیس نهایی
    const mainDb = new SQL.Database();

    // برای هر جدول در databases
    for (const [tableName, tableConfig] of Object.entries(databases)) {
      const { urls, ...columns } = tableConfig;

      // ایجاد جدول اگر وجود ندارد
      const columnDefinitions = Object.entries(columns)
        .map(([colName, colType]) => `"${colName}" ${colType}`)
        .join(", ");

      mainDb.exec(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          ${columnDefinitions}
        )
      `);

      // پردازش هر URL برای این جدول
      for (let i = 0; i < urls.length; i++) {
        try {
          const response = await fetch(urls[i]);
          if (!response.ok) throw new Error(`❌ Failed to download DB from ${urls[i]}`);
          const encryptedText = await response.text();

          const decrypted = decryptData(encryptedText);
          const tempDb = new SQL.Database(decrypted);

          // خواندن داده‌ها از جدول متناظر
          const rows = tempDb.exec(`SELECT * FROM "${tableName}"`);

          if (rows.length > 0) {
            const sourceColumns = rows[0].columns;
            const values = rows[0].values;

            // درج داده‌ها
            const stmt = mainDb.prepare(
              `INSERT OR REPLACE INTO "${tableName}" (${sourceColumns
                .map((c) => `"${c}"`)
                .join(", ")}) VALUES (${sourceColumns.map(() => "?").join(", ")})`
            );

            for (const row of values) {
              stmt.run(row);
            }
            stmt.free();
          }

          tempDb.close();
          console.log(`✅ Table ${tableName} loaded from URL ${i + 1}/${urls.length}`);
        } catch (error) {
          console.error(`❌ Error loading table ${tableName} from ${urls[i]}:`, error);
        }
      }
    }

    // ذخیره دیتابیس نهایی
    const mergedBinary = mainDb.export();
    await saveToIndexedDB(mergedBinary);

    db = mainDb;
    console.log("✅ All tables merged & saved to IndexedDB");
  }
}

// --- دریافت داده‌های جدول ---
export async function getTableData(tableName, limit = 100000) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    // برای جدول users ممکن است updated_at وجود نداشته باشد
    const orderBy = tableName === "users" ? "id" : "updated_at";
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
    const orderBy = tableName === "users" ? "id" : "updated_at";
    const res = await db.query(
      `SELECT * FROM "${tableName}" ORDER BY ${orderBy} DESC LIMIT ${limit}`
    );
    return res.values;
  }
}

// --- دریافت آخرین تاریخ بروزرسانی ---
export async function getLastUpdate(tableName) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    const res = db.exec(`SELECT MAX(updated_at) AS last_update FROM "${tableName}"`);
    return res.length > 0 ? res[0].values[0][0] : null;
  } else {
    const res = await db.query(`SELECT MAX(updated_at) AS last_update FROM "${tableName}"`);
    return res.values.length > 0 ? res.values[0].last_update : null;
  }
}

// --- mock API برای سینک ---
export async function mockSyncApi(last_update) {
  console.log("📡 Mock API called with last_update:", last_update);

  const createData = [
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
  ];

  const deletedData = ["5554", "5555"];

  const updateData = [
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
  ];

  return { createData, deletedData, updateData };
}

// --- حذف داده‌ها ---
export async function deletedData(tableName, ids) {
  if (!ids || ids.length === 0) return;
  if (!db) throw new Error("❌ Database not loaded yet");

  const placeholders = ids.map(() => "?").join(",");
  const query = `DELETE FROM "${tableName}" WHERE id IN (${placeholders})`;

  db.run(query, ids);
  await saveToIndexedDB(db.export());
}

// --- بروزرسانی داده‌ها ---
export async function updateData(tableName, data) {
  if (!db) throw new Error("❌ Database not loaded yet");
  if (!data || data.length === 0) return;

  // دریافت نام ستون‌ها از جدول
  const tableInfo = db.exec(`PRAGMA table_info("${tableName}")`);
  const columns = tableInfo[0].values.map((row) => row[1]);

  for (const item of data) {
    const values = columns.map((col) => item[col] || null);
    const placeholders = columns.map(() => "?").join(", ");

    db.run(
      `INSERT OR REPLACE INTO "${tableName}" (${columns
        .map((c) => `"${c}"`)
        .join(", ")}) VALUES (${placeholders})`,
      values
    );
  }

  await saveToIndexedDB(db.export());
}
