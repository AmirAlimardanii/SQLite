import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "MySecretKey12345";

// تابع رمزگذاری
export function encryptJSON(jsonData) {
  const jsonString = JSON.stringify(jsonData);
  return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
}

// تابع رمزگشایی
export function decryptJSON(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedString);
}

// تابع برای دانلود فایل
export function downloadFile(content, fileName) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

// مثال استفاده
const myData = { name: "Tahere", age: 25 };

// 1. رمزگذاری
const encryptedData = encryptJSON(myData);

// 2. دانلود فایل رمزگذاری شده
downloadFile(encryptedData, "encrypted.json");

// ---- بعداً برای رمزگشایی ----
// const decryptedData = decryptJSON(encryptedData);
// console.log(decryptedData);
