import { Capacitor } from "@capacitor/core";
import initSqlJs from "sql.js";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "0VE7aQMHfwFEbKRc023DGg98RO9qoECTFxmxtGh4";
const myStudy = ["4717", "6002"];
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
};

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

export async function createDatabase(tableName) {
  if (Capacitor.getPlatform() === "web") {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`,
    });

    removeExtraCaches();

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

const removeExtraCaches = async () => {
  caches.open("JsonCache-v1.01").then((cache) => {
    cache.keys().then((keys) => {
      Promise.all(
        keys.map(async (request) => {
          if (!wells3Urls.map(({ url }) => url).includes(request.url)) await cache.delete(request);
        })
      );
    });
  });
};
