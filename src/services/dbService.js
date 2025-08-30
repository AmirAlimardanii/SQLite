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
export async function importDatabaseFromServer(url) {
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

    const response = await fetch(url);
    if (!response.ok) throw new Error("❌ Failed to download DB");
    const encryptedText = await response.text();

    const decrypted = decryptData(encryptedText);

    db = new SQL.Database(decrypted);
    console.log("✅ Chinook DB downloaded & decrypted from server");

    await saveToIndexedDB(decrypted);
  } else {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const response = await fetch(url);
    if (!response.ok) throw new Error("❌ Failed to download DB");
    const encryptedText = await response.text();

    const decrypted = decryptData(encryptedText);

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

export async function getStudy(limit = 10) {
  if (!db) throw new Error("❌ Database not loaded yet");

  if (Capacitor.getPlatform() === "web") {
    const res = db.exec(`SELECT id, name, code FROM [6001_6001] LIMIT ${limit}`);
    return res.length > 0 ? res[0].values.map(([id, name, code]) => ({ id, name, code })) : [];
  } else {
    const res = await db.query(`SELECT id, name, code FROM [6001_6001] LIMIT ${limit}`);
    return res.values;
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
