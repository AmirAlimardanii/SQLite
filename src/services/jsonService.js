import { Capacitor } from "@capacitor/core";
import initSqlJs from "sql.js";
import CryptoJS from "crypto-js";
import { Pumps3 } from "../../pumps3_min.json";
import { Wells3 } from "../../wells3_min.json";
import { abbands } from "../../ab_bands_min.json";


const ENCRYPTION_KEY = "0VE7aQMHfwFEbKRc023DGg98RO9qoECTFxmxtGh4";
const study_code = "4717";

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


// function downloadEncryptedDb(db) {
//   // دیتابیس رو بگیر
//   const binaryArray = db.export();

//   // رمزگذاری با AES
//   const base64 = uint8ArrayToBase64(binaryArray);
//   const encrypted = CryptoJS.AES.encrypt(base64, ENCRYPTION_KEY).toString();

//   // ساخت Blob
//   const blob = new Blob([encrypted], { type: "text/plain" });

//   // ساخت لینک دانلود
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = "wells3_" + study_code + ".txt"; // پسوند دلخواه
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);

//   console.log("✅ Database encrypted and downloaded");
// }

function downloadEncryptedDb(db) {
  const binaryArray = db.export();                // SQLite → Uint8Array
  const base64 = uint8ArrayToBase64(binaryArray); // Uint8Array → Base64

  const encrypted = CryptoJS.AES.encrypt(base64, ENCRYPTION_KEY).toString();
  const blob = new Blob([encrypted], { type: "text/plain" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wells3_" + study_code + ".txt"; 
  a.click();
  URL.revokeObjectURL(url);
}

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

      try {
        const keys = Object.keys(databases[tableName]); // ستون‌ها طبق تعریف جدول
        // let id = 1;
        console.log("Inserting data into", Wells3);
        for (const item of Wells3.filter((well) => well.m == study_code)) {
          const stmt = mainDb.prepare(
            `INSERT OR REPLACE INTO ${tableName} (${keys.join(",")}) VALUES (${keys
              .map(() => "?")
              .join(", ")})`
          );

          const rowValues = keys.map((key) => {
            return item[key] ?? null;
          });

          stmt.run(rowValues);
          stmt.free();
          // id++;
        }
      } catch (error) {
        console.log(error);
      }

      // دانلود دیتابیس رمزگذاری شده
      downloadEncryptedDb(mainDb);
    }

    // ذخیره دیتابیس نهایی
    const mergedBinary = mainDb.export();
    await saveToIndexedDB(mergedBinary);

    db = mainDb;
    console.log("✅ All tables merged & saved to IndexedDB");
  }
}

// --- دریافت داده‌های جدول ---
export async function getLastUpdate(tableName) {
  if (!db) throw new Error("❌ Database not loaded yet");

  let orderBy = "updated_at";
  if (Capacitor.getPlatform() === "web") {
    const tableInfo = db.exec(`PRAGMA table_info("${tableName}")`);
    const columns = tableInfo[0].values.map((row) => row[1]);
    if (!columns.includes("updated_at")) {
      orderBy = "id";
    }
    const res = db.exec(`SELECT MAX(${orderBy}) AS last_update FROM "${tableName}"`);
    return res.length > 0 ? res[0].values[0][0] : null;
  } else {
    const tableInfo = await db.query(`PRAGMA table_info("${tableName}")`);
    const columns = tableInfo.values.map((row) => row[1]);
    if (!columns.includes("updated_at")) {
      orderBy = "id";
    }
    const res = await db.query(`SELECT MAX(${orderBy}) AS last_update FROM "${tableName}"`);
    return res.values.length > 0 ? res.values[0].last_update : null;
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

// --- دریافت آخرین تاریخ بروزرسانی ---
// export async function getLastUpdate(tableName) {
//   if (!db) throw new Error("❌ Database not loaded yet");

//   if (Capacitor.getPlatform() === "web") {
//     const res = db.exec(`SELECT MAX(updated_at) AS last_update FROM "${tableName}"`);
//     return res.length > 0 ? res[0].values[0][0] : null;
//   } else {
//     const res = await db.query(`SELECT MAX(updated_at) AS last_update FROM "${tableName}"`);
//     return res.values.length > 0 ? res.values[0].last_update : null;
//   }
// }

// --- توابع عمومی برای تمام جدول‌ها ---

// --- حذف رکوردها از هر جدول ---
export async function deleteRecords(tableName, ids) {
  if (!ids || ids.length === 0) return;
  if (!db) throw new Error("❌ Database not loaded yet");

  const placeholders = ids.map(() => "?").join(",");
  const query = `DELETE FROM "${tableName}" WHERE id IN (${placeholders})`;

  db.run(query, ids);
  await saveToIndexedDB(db.export());

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

  await saveToIndexedDB(db.export());
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
