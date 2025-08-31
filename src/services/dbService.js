import { Capacitor } from "@capacitor/core";
import initSqlJs from "sql.js";
import { SQLiteConnection } from "@capacitor-community/sqlite";
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
let sqlite = null;

// --- دریافت و لود دیتابیس ---
export async function importDatabaseFromServer1(urls) {
  if (Capacitor.getPlatform() === "web") {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`,
    });

    const savedDb = await loadFromIndexedDB();
    if (savedDb) {
      db = new SQL.Database(savedDb);
      console.log("✅ Chinook DB loaded (plain) from IndexedDB");
      return;
    }

    for (const url of urls) {
      const response = await fetch(url);
      if (!response.ok) throw new Error("❌ Failed to download DB");
      const encryptedText = await response.text();

      const decrypted = decryptData(encryptedText);
      console.log(decrypted, "decrypted");
    }
    await saveToIndexedDB(decrypted);

    // db = new SQL.Database(decrypted);
    console.log("✅ Chinook DB downloaded & decrypted from server");
  } else {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    for (const url of urls) {
      const response = await fetch(url);
      if (!response.ok) throw new Error("❌ Failed to download DB");
      const encryptedText = await response.text();

      const decrypted = decryptData(encryptedText);
      console.log(decrypted, "decrypted");
      await saveToIndexedDB(decrypted);
    }

    const base64 = uint8ArrayToBase64(decrypted);

    await Filesystem.writeFile({
      path: "chinook.sqlite",
      data: base64,
      directory: Directory.Data,
    });

    sqlite = new SQLiteConnection();
    const ret = await sqlite.createConnection("chinook", false, "no-encryption", 1);
    db = ret;
    await db.open();
  }
}

export async function importDatabaseFromServer(urls) {
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

    for (let i = 0; i < urls.length; i++) {
      const response = await fetch(urls[i]);
      if (!response.ok) throw new Error("❌ Failed to download DB");
      const encryptedText = await response.text();

      const decrypted = decryptData(encryptedText);
      const tempDb = new SQL.Database(decrypted);

      // فرض بر اینه که جدول‌ها اسمشون sources هست
      const rows = tempDb.exec("SELECT * FROM sources");
      if (rows.length > 0) {
        const columns = rows[0].columns;
        const values = rows[0].values;

        // ایجاد جدول اگر هنوز ساخته نشده
        mainDb.exec(
          `CREATE TABLE IF NOT EXISTS sources (${columns.map((c) => `"${c}" TEXT`).join(", ")})`
        );

        // درج داده‌ها
        const stmt = mainDb.prepare(
          `INSERT INTO sources (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${columns
            .map(() => "?")
            .join(", ")})`
        );
        for (const row of values) {
          stmt.run(row);
        }
        stmt.free();
      }

      tempDb.close();

      // ذخیره دیتابیس نهایی
      const mergedBinary = mainDb.export();
      await saveToIndexedDB(mergedBinary);

      db = mainDb;
      console.log("✅ Merged DB downloaded & saved");
    }
  }
}
// --- CRUD Artist ---
export async function getArtists(limit = 10) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    const res = db.exec(`SELECT ArtistId, Name FROM Artist LIMIT ${limit}`);
    return res.length > 0 ? res[0].values.map(([id, name]) => ({ id, name })) : [];
  } else {
    const res = await db.query(`SELECT ArtistId, Name FROM Artist LIMIT ${limit}`);
    return res.values;
  }
}

export async function getStudy(limit = 100000) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    const res = db.exec(`SELECT * FROM sources ORDER BY updated_at DESC LIMIT ${limit}`);
    return res.length > 0
      ? res[0].values.map((row) => ({
          id: row[0],
          company: row[1],
          type: row[2],
          name: row[3],
          code: row[4],
          special: row[5],
          aquifer: row[6],
          river: row[7],
          village: row[8],
          status: row[9],
          study: row[10],
          tamab: row[11],
          lng: row[12],
          lat: row[13],
          alt: row[14],
          created_at: row[15],
          updated_at: row[16],
        }))
      : [];
  } else {
    const res = await db.query(`SELECT * FROM sources ORDER BY updated_at DESC LIMIT ${limit}`);
    return res.values;
  }
}

export async function getLastUpdate() {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    const res = db.exec(`SELECT MAX(updated_at) AS last_update FROM sources`);
    return res.length > 0 ? res[0].values[0] : null;
  } else {
    const res = await db.query(`SELECT MAX(updated_at) AS last_update FROM sources`);
    return res.values.length > 0 ? res.values[0] : null;
  }
}

export async function getInvoices(limit = 415) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    // INSERT INTO Invoice (

    const res = db.exec(
      `SELECT InvoiceId, CustomerId, InvoiceDate, BillingAddress, BillingCity, BillingState, BillingCountry, BillingPostalCode, Total FROM Invoice LIMIT ${limit}`
    );
    return res.length > 0
      ? res[0].values.map(
          ([
            InvoiceId,
            CustomerId,
            InvoiceDate,
            BillingAddress,
            BillingCity,
            BillingState,
            BillingCountry,
            BillingPostalCode,
            Total,
          ]) => ({
            InvoiceId,
            CustomerId,
            InvoiceDate,
            BillingAddress,
            BillingCity,
            BillingState,
            BillingCountry,
            BillingPostalCode,
            Total,
          })
        )
      : [];
  } else {
    const res = await db.query(
      `SELECT InvoiceId, CustomerId, InvoiceDate, BillingAddress, BillingCity, BillingState, BillingCountry, BillingPostalCode, Total FROM Invoice LIMIT ${limit}`
    );
    return res.values;
  }
}

export async function addArtist(name) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    db.run(`INSERT INTO Artist (Name) VALUES (?)`, [name]);
    await saveToIndexedDB(db.export());
  } else {
    await db.run(`INSERT INTO Artist (Name) VALUES (?)`, [name]);
  }
}

export async function updateArtist(id, newName) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    db.run(`UPDATE Artist SET Name = ? WHERE ArtistId = ?`, [newName, id]);
    await saveToIndexedDB(db.export());
  } else {
    await db.run(`UPDATE Artist SET Name = ? WHERE ArtistId = ?`, [newName, id]);
  }
}

export async function deleteArtist(id) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    db.run(`DELETE FROM Artist WHERE ArtistId = ?`, [id]);
    await saveToIndexedDB(db.export());
  } else {
    await db.run(`DELETE FROM Artist WHERE ArtistId = ?`, [id]);
  }
}

// --- گرفتن آخرین تاریخ فاکتور ---
export async function getLastInvoiceDate() {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    const res = db.exec(`SELECT InvoiceId FROM Invoice ORDER BY InvoiceId DESC LIMIT 1`);
    return res.length > 0 && res[0].values.length > 0 ? res[0].values[0][0] : null;
  } else {
    const res = await db.query(`SELECT InvoiceDate FROM Invoice ORDER BY InvoiceDate DESC LIMIT 1`);
    return res.values.length > 0 ? res.values[0].InvoiceDate : null;
  }
}

// --- درج رکورد جدید در Invoice ---
async function insertInvoice(record) {
  if (Capacitor.getPlatform() === "web") {
    db.run(
      `INSERT INTO Invoice (InvoiceId, CustomerId, InvoiceDate, BillingAddress, BillingCity, BillingState, BillingCountry, BillingPostalCode, Total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.InvoiceId,
        record.CustomerId,
        record.InvoiceDate,
        record.BillingAddress,
        record.BillingCity,
        record.BillingState,
        record.BillingCountry,
        record.BillingPostalCode,
        record.Total,
      ]
    );
    await saveToIndexedDB(db.export());
  } else {
    await db.run(
      `INSERT INTO Invoice (InvoiceId, CustomerId, InvoiceDate, BillingAddress, BillingCity, BillingState, BillingCountry, BillingPostalCode, Total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.InvoiceId,
        record.CustomerId,
        record.InvoiceDate,
        record.BillingAddress,
        record.BillingCity,
        record.BillingState,
        record.BillingCountry,
        record.BillingPostalCode,
        record.Total,
      ]
    );
  }
}

// --- سینک با سرور ---
export async function syncWithServer(apiUrl) {
  const lastDate = await getLastInvoiceDate();
  console.log("⏳ Last invoice date:", lastDate);
  if (!lastDate) {
    console.log("⏳ No invoices found.");
    return;
  }
  //   try {
  //     const response = await fetch(apiUrl, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ last_update: lastDate })
  //     })

  //     if (!response.ok) throw new Error('❌ Failed to sync with server')

  //     const updates = await response.json()
  //     console.log('📦 Updates from server:', updates)

  //     for (const invoice of updates) {
  //       await insertInvoice(invoice)
  //     }

  //     console.log(`✅ ${updates.length} new invoices added to local DB.`)
  //     return updates

  //   } catch (err) {
  //     console.error('❌ Sync error:', err)
  //     throw err
  //   }
}

// mockApi.js
export async function mockSyncApi(last_update) {
  console.log("📡 Mock API called with last_update:", last_update);

  // دیتای تستی
  const createData = [
    {
      id: 10894,
      company: "510",
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
      updated_at: "2025-09-01 12:00:00", // جدیدتر از last_update
    },
    {
      id: 10895,
      company: "999",
      type: "99",
      name: "رکورد جدید",
      code: "NEW-001",
      special: "0",
      aquifer: "X",
      river: "Y",
      village: "Z",
      status: "1",
      study: "7777",
      tamab: "",
      lng: "60.0000",
      lat: "35.0000",
      alt: "100",
      created_at: "2025-09-01 12:05:00",
      updated_at: "2025-09-01 12:05:00",
    },
  ];

  // آی‌دی‌هایی که حذف شده‌اند
  const deletedData = ["5554", "5555"];

  const updateData = [
    {
      id: 10895,
      company: "510",
      type: "22",
      name: "رکورد 3",
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
      updated_at: "2025-09-01 12:00:00", // جدیدتر از last_update
    },
    {
      id: 10894,
      company: "999",
      type: "99",
      name: "رکورد 4",
      code: "NEW-001",
      special: "0",
      aquifer: "X",
      river: "Y",
      village: "Z",
      status: "1",
      study: "7777",
      tamab: "",
      lng: "60.0000",
      lat: "35.0000",
      alt: "100",
      created_at: "2025-09-01 12:05:00",
      updated_at: "2025-09-01 12:05:00",
    },
  ];

  return { createData, deletedData, updateData };
}

export async function deletedData(ids) {
  if (!ids || ids.length === 0) return;

  const placeholders = ids.map(() => "?").join(",");
  const query = `DELETE FROM sources WHERE id IN (${placeholders})`;

  await db.run(query, ids);
}

export async function updateData(data) {
  const columns = await db.exec(`PRAGMA table_info(sources)`);
  const idColumn = columns[0].values.find((col) => col[1] === "id");
  console.log("Type of id:", idColumn[2]); // ستون سوم، type هست

  if (!db) throw new Error("❌ Database not loaded yet");
  if (!data || data.length === 0) return;

  console.log(data);

  for (const item of data) {
    await db.run(
      `INSERT OR REPLACE INTO sources
        (id, company, type, name, code, special, aquifer, river, village, status, study, tamab, lng, lat, alt, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.company,
        item.type,
        item.name,
        item.code,
        item.special,
        item.aquifer,
        item.river,
        item.village,
        item.status,
        item.study,
        item.tamab,
        item.lng,
        item.lat,
        item.alt,
        item.created_at,
        item.updated_at,
      ]
    );
  }
}
