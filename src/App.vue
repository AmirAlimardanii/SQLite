<script setup>
import { ref, onMounted } from "vue";
// import { exportEncryptedDB } from '@/services/dbService'
import {
  importDatabaseFromServer,
  getArtists,
  addArtist,
  updateArtist,
  deleteArtist,
  syncWithServer,
  getInvoices,
  getStudy,
} from "@/services/dbService";

const artists = ref([]);
const study = ref([]);

const newArtistName = ref("");
const editArtistName = ref("");
const selectedArtistId = ref(null);

onMounted(async () => {
  await importDatabaseFromServer(
    "https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/feat/seperate-file/6001_encrypted.txt"

    // "https://raw.githubusercontent.com/m79yashar/sqlitr-db/refs/heads/main/chinook.enc.txt"
    // 'https://raw.githubusercontent.com/eltechno/python_course/master/Chinook.sqlite'
  );
  // artists.value = await getArtists();
  // console.log("artists:", artists.value);

  study.value = await getStudy();
  console.log("study:", study.value);

  // invoices.value = await getInvoices();

  // await syncWithServer("https://raw.githubusercontent.com/m79yashar/sqlitr-db/refs/heads/main/");
});

async function add() {
  if (!newArtistName.value.trim()) return;
  await addArtist(newArtistName.value.trim());
  newArtistName.value = "";
  artists.value = await getArtists(300);
}

function selectForEdit(artist) {
  selectedArtistId.value = artist.id;
  editArtistName.value = artist.name;
}

async function update() {
  if (!selectedArtistId.value || !editArtistName.value.trim()) return;
  await updateArtist(selectedArtistId.value, editArtistName.value.trim());
  selectedArtistId.value = null;
  editArtistName.value = "";
  artists.value = await getArtists(300);
}

async function remove(id) {
  if (!confirm("آیا مطمئن هستید که می‌خواهید حذف کنید؟")) return;
  await deleteArtist(id);
  artists.value = await getArtists(300);
}

// function downloadEncrypted() {
//   exportEncryptedDB('chinook.enc.txt') // دانلود نسخه رمز شده
// }
</script>

<template>
  <div>
    <h1>مدیریت آرتیست‌ها</h1>
    <table>
      <thead>
        <tr>
          <th>id</th>
          <th>name</th>
          <th>code</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in study" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.code }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style>
table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%;
}

td,
th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}
</style>
