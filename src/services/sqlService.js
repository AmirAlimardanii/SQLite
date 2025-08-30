import { Capacitor } from "@capacitor/core";
import { SQLiteConnection } from "@capacitor-community/sqlite";

const sqlite = new SQLiteConnection(Capacitor.isNativePlatform() ? window.sqlitePlugin : undefined);

async function saveDbToDevice(dbName, dbBytes) {
  try {
    // حذف اتصال قدیمی
    const isConn = (await sqlite.isConnection(dbName)).result;
    if (isConn) {
      await sqlite.closeConnection(dbName);
    }

    // ساخت اتصال جدید
    const db = await sqlite.createConnection(dbName, false, "no-encryption", 1);

    // برای وب: آپلود مستقیم دیتابیس
    if (Capacitor.getPlatform() === "web") {
      await db.importFromJson({
        database: dbName,
        version: 1,
        encrypted: false,
        mode: "full",
        tables: [], // اگه بخوای خالی شروع کنی
      });
    } else {
      // برای native: مستقیم restore میشه
      await db.importFromJson({
        database: dbName,
        version: 1,
        encrypted: false,
        mode: "full",
        tables: [], // برای SQLite خودت
      });
    }

    await db.open();
    console.log("✅ DB saved & opened");
    return db;
  } catch (err) {
    console.error("DB Save Error", err);
  }
}
