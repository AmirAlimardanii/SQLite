// import { Capacitor } from "@capacitor/core";
// import initSqlJs from "sql.js";
// import CryptoJS from "crypto-js";

// const ENCRYPTION_KEY = "0VE7aQMHfwFEbKRc023DGg98RO9qoECTFxmxtGh4";
// const myStudy = ["4717", "6002"];
// export const wells3Urls = myStudy.map((id) => ({
//   url: `https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/src/wells/wells3_${id}.txt`,
//   file: `wells3_${id}`,
// }));

// export const databases = {
//   wells3: {
//     urls: wells3Urls,
//     id: "INTEGER PRIMARY KEY",
//     d: "INTEGER",
//     c: "TEXT",
//     e: "INTEGER",
//     h: "TEXT",
//     m: "INTEGER",
//     a: "TEXT",
//     n: "TEXT",
//     q: "TEXT",
//     p: "INTEGER",
//     i: "TEXT",
//     f: "INTEGER",
//     k: "INTEGER",
//     s: "INTEGER",
//     j: "INTEGER",
//     r: "INTEGER",
//     o: "INTEGER",
//     u: "TEXT",
//     g: "REAL",
//     t: "REAL",
//     b: "TEXT",
//     w: "TEXT",
//     v: "TEXT",
//     l: "TEXT",
//     ms: "TEXT",
//   },
// };

// function base64ToUint8Array(base64) {
//   const binary = atob(base64);
//   const len = binary.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
//   return bytes;
// }

// // --- رمزگشایی ---
// function decryptData(encryptedText) {
//   try {
//     // AES decrypt → WordArray
//     const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);

//     // WordArray → UTF8 (این مرحله باید Base64 بده چون اون‌طوری ذخیره کرده بودیم)
//     const base64 = decrypted.toString(CryptoJS.enc.Utf8);

//     if (!base64) {
//       throw new Error("❌ Decryption failed: empty base64 output");
//     }

//     // Base64 → Uint8Array → SQLite binary
//     return base64ToUint8Array(base64);
//   } catch (error) {
//     console.error("❌ Error while decrypting data:", error);
//     throw error;
//   }
// }

// let db = null;

// const removeExtraCaches = async () => {
//   caches.open("JsonCache-v1.01").then((cache) => {
//     cache.keys().then((keys) => {
//       Promise.all(
//         keys.map(async (request) => {
//           if (!wells3Urls.map(({ url }) => url).includes(request.url)) await cache.delete(request);
//         })
//       );
//     });
//   });
// };

// export async function createDatabase(tableName) {
//   if (Capacitor.getPlatform() === "web") {
//     const SQL = await initSqlJs({
//       locateFile: (file) => `/sql-wasm.wasm`,
//     });

//     removeExtraCaches();

//     const mainDb = new SQL.Database();

//     // ستون‌های تعریف‌شده برای این جدول
//     let columns = Object.keys(databases[tableName]).filter((col) => col !== "urls");
//     let urls = databases[tableName].urls;

//     // ایجاد جدول مقصد با ستون __source
//     mainDb.exec(`
//       CREATE TABLE IF NOT EXISTS "${tableName}" (
//         __source TEXT,
//         ${columns
//           .map((colName) =>
//             colName === "id"
//               ? `"${colName}" INTEGER` // دیگه PRIMARY KEY نیست
//               : `"${colName}" ${databases[tableName][colName]}`
//           )
//           .join(", ")}
//       )
//     `);
//     for (const url of urls) {
//       const response = await fetch(url?.url);
//       if (!response.ok) continue;
//       const encryptedText = await response.text();
//       const decryptedData = decryptData(encryptedText);
//       const tempDb = new SQL.Database(decryptedData);
//       const rows = tempDb.exec(`SELECT * FROM "${tableName}"`);
//       if (rows.length === 0) {
//         tempDb.close();
//         continue;
//       }
//       const sourceColumns = rows[0].columns;
//       const values = rows[0].values;

//       const stmt = mainDb.prepare(
//         `INSERT INTO "${tableName}" (__source, ${sourceColumns.map((c) => `"${c}"`).join(", ")})
//          VALUES (?${", ?".repeat(sourceColumns.length)})`
//       );
//       for (const row of values) {
//         stmt.run(["wells3", ...row]); // key = wells3_6002 یا wells3_6007 و ...
//       }
//       stmt.free();
//       tempDb.close();
//     }

//     db = mainDb;
//     console.log(`✅ ${tableName} merged from all sources`);
//   }
// }

// export async function getTableData(tableName, limit = 100000) {
//   if (!db) throw new Error("❌ Database not loaded yet");

//   let orderBy = "updated_at";
//   if (Capacitor.getPlatform() === "web") {
//     const tableInfo = db.exec(`PRAGMA table_info("${tableName}")`);
//     const columns = tableInfo[0].values.map((row) => row[1]);
//     if (!columns.includes("updated_at")) {
//       orderBy = "id";
//     }
//     const res = db.exec(`SELECT * FROM "${tableName}" ORDER BY ${orderBy} DESC LIMIT ${limit}`);
//     if (res.length === 0) return [];
//     return res[0].values.map((row) => {
//       const obj = {};
//       res[0].columns.forEach((col, index) => {
//         obj[col] = row[index];
//       });
//       return obj;
//     });
//   } else {
//     const tableInfo = await db.query(`PRAGMA table_info("${tableName}")`);
//     const columns = tableInfo.values.map((row) => row[1]);
//     if (!columns.includes("updated_at")) {
//       orderBy = "id";
//     }
//     const res = await db.query(
//       `SELECT * FROM "${tableName}" ORDER BY ${orderBy} DESC LIMIT ${limit}`
//     );
//     return res.values;
//   }
// }

// V1 with base64
// import { Capacitor } from "@capacitor/core";
// import initSqlJs from "sql.js";
// import CryptoJS from "crypto-js";
// import { CapacitorSQLite } from "@capacitor-community/sqlite";
// import { Filesystem, Directory } from "@capacitor/filesystem";

// const ENCRYPTION_KEY = "0VE7aQMHfwFEbKRc023DGg98RO9qoECTFxmxtGh4";

// // لیست فایل‌های دیتابیس رمزگذاری‌شده روی سرور
// const myStudy = ["4717", "6002"];
// export const wells3Urls = myStudy.map((id) => ({
//   url: `https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/src/wells/wells3_${id}.txt`,
//   file: `wells3_${id}`,
// }));

// export const databases = {
//   wells3: {
//     urls: wells3Urls,
//     id: "INTEGER PRIMARY KEY",
//     d: "INTEGER",
//     c: "TEXT",
//     e: "INTEGER",
//     h: "TEXT",
//     m: "INTEGER",
//     a: "TEXT",
//     n: "TEXT",
//     q: "TEXT",
//     p: "INTEGER",
//     i: "TEXT",
//     f: "INTEGER",
//     k: "INTEGER",
//     s: "INTEGER",
//     j: "INTEGER",
//     r: "INTEGER",
//     o: "INTEGER",
//     u: "TEXT",
//     g: "REAL",
//     t: "REAL",
//     b: "TEXT",
//     w: "TEXT",
//     v: "TEXT",
//     l: "TEXT",
//     ms: "TEXT",
//   },
// };

// // -------------------- Helpers --------------------
// function base64ToUint8Array(base64) {
//   const binary = atob(base64);
//   const len = binary.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
//   return bytes;
// }

// // رمزگشایی برای Web → Uint8Array
// function decryptDataWeb(encryptedText) {
//   const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
//   const base64 = decrypted.toString(CryptoJS.enc.Utf8);
//   if (!base64) throw new Error("❌ Decryption failed (web)");
//   return base64ToUint8Array(base64);
// }

// // رمزگشایی برای Native → Base64 مستقیم
// function decryptDataNative(encryptedText) {
//   const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
//   const base64 = decrypted.toString(CryptoJS.enc.Base64);
//   if (!base64) throw new Error("❌ Decryption failed (native)");
//   return base64;
// }

// let db = null;

// // -------------------- ایجاد دیتابیس --------------------
// export async function createDatabase(tableName) {
//   const platform = Capacitor.getPlatform();

//   if (platform === "web") {
//     // ------------------- WEB -------------------
//     const SQL = await initSqlJs({
//       locateFile: (file) => `/sql-wasm.wasm`,
//     });

//     const mainDb = new SQL.Database();

//     let columns = Object.keys(databases[tableName]).filter((col) => col !== "urls");
//     let urls = databases[tableName].urls;

//     // ایجاد جدول مقصد
//     mainDb.exec(`
//       CREATE TABLE IF NOT EXISTS "${tableName}" (
//         __source TEXT,
//         ${columns
//           .map((colName) =>
//             colName === "id"
//               ? `"${colName}" INTEGER`
//               : `"${colName}" ${databases[tableName][colName]}`
//           )
//           .join(", ")}
//       )
//     `);

//     for (const { url, file } of urls) {
//       const response = await fetch(url);
//       if (!response.ok) continue;
//       const encryptedText = await response.text();
//       const decryptedData = decryptDataWeb(encryptedText);

//       const tempDb = new SQL.Database(decryptedData);
//       const rows = tempDb.exec(`SELECT * FROM "${tableName}"`);
//       if (rows.length > 0) {
//         const sourceColumns = rows[0].columns;
//         const values = rows[0].values;
//         const stmt = mainDb.prepare(
//           `INSERT INTO "${tableName}" (__source, ${sourceColumns.map((c) => `"${c}"`).join(", ")})
//            VALUES (?${", ?".repeat(sourceColumns.length)})`
//         );
//         for (const row of values) stmt.run([file, ...row]);
//         stmt.free();
//       }
//       tempDb.close();
//     }

//     db = mainDb;
//     console.log(`✅ ${tableName} ready on Web`);
//     return db;
//   } else {
//     // ------------------- Native (Android/iOS) -------------------
//     const sqlite = CapacitorSQLite;
//     const urls = databases[tableName].urls;

//     // فعلا یکی از فایل‌ها رو استفاده می‌کنیم
//     const { url, file } = urls[0];
//     const response = await fetch(url);
//     if (!response.ok) throw new Error("❌ Failed to fetch DB file");
//     const encryptedText = await response.text();
//     const base64Db = decryptDataNative(encryptedText);

//     // ذخیره روی دیسک
//     await Filesystem.writeFile({
//       path: `${tableName}.db`,
//       data: base64Db,
//       directory: Directory.Data,
//     });

//     // اتصال به دیتابیس
//     await sqlite.createConnection({
//       database: tableName,
//       encrypted: false,
//       mode: "no-encryption",
//       version: 1,
//     });

//     db = await sqlite.open({ database: tableName });
//     console.log(`✅ ${tableName} ready on Native`);
//     return db;
//   }
// }

// // -------------------- گرفتن داده‌ها --------------------
// export async function getTableData(tableName, limit = 100000) {
//   if (!db) throw new Error("❌ Database not loaded yet");
//   const platform = Capacitor.getPlatform();

//   let orderBy = "updated_at";

//   if (platform === "web") {
//     const tableInfo = db.exec(`PRAGMA table_info("${tableName}")`);
//     const columns = tableInfo[0].values.map((row) => row[1]);
//     if (!columns.includes("updated_at")) orderBy = "id";

//     const res = db.exec(`SELECT * FROM "${tableName}" ORDER BY ${orderBy} DESC LIMIT ${limit}`);
//     if (res.length === 0) return [];

//     return res[0].values.map((row) => {
//       const obj = {};
//       res[0].columns.forEach((col, index) => {
//         obj[col] = row[index];
//       });
//       return obj;
//     });
//   } else {
//     const tableInfo = await db.query(`PRAGMA table_info("${tableName}")`);
//     const columns = tableInfo.values.map((row) => row[1]);
//     if (!columns.includes("updated_at")) orderBy = "id";

//     const res = await db.query(
//       `SELECT * FROM "${tableName}" ORDER BY ${orderBy} DESC LIMIT ${limit}`
//     );
//     return res.values;
//   }
// }

// V2 with cipher

import { Capacitor } from "@capacitor/core";
import initSqlJs from "sql.js";
import CryptoJS from "crypto-js";
import { CapacitorSQLite } from "@capacitor-community/sqlite";
import { Filesystem, Directory } from "@capacitor/filesystem";

const ENCRYPTION_KEY = "0VE7aQMHfwFEbKRc023DGg98RO9qoECTFxmxtGh4";
const SQLCIPHER_KEY = ENCRYPTION_KEY.substring(0, 32); // استفاده از 32 کاراکتر اول برای کلید SQLCipher

const TEST_KEY = "amir1234".padEnd(32, "0");

const myStudy = ["4717", "6002"];

// URLs برای پلتفرم‌های مختلف
export const wells3Urls = {
  web: myStudy.map((id) => ({
    url: `https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/src/wells/wells3_${id}.txt`,
    file: `wells3_${id}`,
  })),
  native: myStudy.map((id) => ({
    url: `https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/src/wells/wells3_${id}_sqlcipher.db`,
    file: `wells3_${id}`,
  })),
};

export const databases = {
  wells3: {
    urls: wells3Urls,
    id: "INTEGER PRIMARY KEY",
    // ... سایر فیلدها
  },
};

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decryptDataWeb(encryptedText) {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  const base64 = decrypted.toString(CryptoJS.enc.Utf8);
  if (!base64) throw new Error("❌ Decryption failed (web)");
  return base64ToUint8Array(base64);
}

let db = null;

export async function createDatabase(tableName) {
  const platform = Capacitor.getPlatform();

  if (platform === "web") {
    // بخش وب بدون تغییر
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`,
    });

    const mainDb = new SQL.Database();
    let columns = Object.keys(databases[tableName]).filter((col) => col !== "urls");
    let urls = databases[tableName].urls.web; // استفاده از URLs مخصوص وب

    mainDb.exec(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        __source TEXT,
        ${columns
          .map((colName) =>
            colName === "id"
              ? `"${colName}" INTEGER`
              : `"${colName}" ${databases[tableName][colName]}`
          )
          .join(", ")}
      )
    `);

    for (const { url, file } of urls) {
      const response = await fetch(url);
      if (!response.ok) continue;
      const encryptedText = await response.text();
      const decryptedData = decryptDataWeb(encryptedText);

      const tempDb = new SQL.Database(decryptedData);
      const rows = tempDb.exec(`SELECT * FROM "${tableName}"`);
      if (rows.length > 0) {
        const sourceColumns = rows[0].columns;
        const values = rows[0].values;
        const stmt = mainDb.prepare(
          `INSERT INTO "${tableName}" (__source, ${sourceColumns.map((c) => `"${c}"`).join(", ")})
           VALUES (?${", ?".repeat(sourceColumns.length)})`
        );
        for (const row of values) stmt.run([file, ...row]);
        stmt.free();
      }
      tempDb.close();
    }

    db = mainDb;
    console.log(`✅ ${tableName} ready on Web`);
    return db;
  } else {
    // بخش نیتیو با SQLCipher
    const sqlite = CapacitorSQLite;
    const urls = databases[tableName].urls.native; // استفاده از URLs مخصوص نیتیو

    const { url, file } = urls[0];
    const response = await fetch(url);
    if (!response.ok) throw new Error("❌ Failed to fetch DB file");
    const arrayBuffer = await response.arrayBuffer();
    const base64Db = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    await Filesystem.writeFile({
      path: `${tableName}.db`,
      data: base64Db,
      directory: Directory.Data,
    });

    await sqlite.createConnection({
      database: tableName,
      encrypted: true, // فعال بودن رمزگذاری
      mode: "secret", // حالت درست برای اتصال به دیتابیس رمزگذاری‌شده
      version: 1,
      secret: TEST_KEY, // کلید SQLCipher
    });

    db = await sqlite.open({ database: tableName });
    console.log(`✅ ${tableName} ready on Native with SQLCipher`);
    return db;
  }
}

export async function getTableData(tableName, limit = 100000) {
  if (!db) throw new Error("❌ Database not loaded yet");
  const platform = Capacitor.getPlatform();

  let orderBy = "updated_at";

  if (platform === "web") {
    // بخش وب بدون تغییر
    const tableInfo = db.exec(`PRAGMA table_info("${tableName}")`);
    const columns = tableInfo[0].values.map((row) => row[1]);
    if (!columns.includes("updated_at")) orderBy = "id";

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
    // بخش نیتیو بدون تغییر
    const tableInfo = await db.query(`PRAGMA table_info("${tableName}")`);
    const columns = tableInfo.values.map((row) => row[1]);
    if (!columns.includes("updated_at")) orderBy = "id";

    const res = await db.query(
      `SELECT * FROM "${tableName}" ORDER BY ${orderBy} DESC LIMIT ${limit}`
    );
    return res.values;
  }
}
