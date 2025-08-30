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
} from "@/services/dbService";

const artists = ref([]);
const invoices = ref([]);

const newArtistName = ref("");
const editArtistName = ref("");
const selectedArtistId = ref(null);

onMounted(async () => {
  await importDatabaseFromServer(
    "https://raw.githubusercontent.com/m79yashar/sqlitr-db/refs/heads/master/Chinook_part1.sqlite"

    // "https://raw.githubusercontent.com/m79yashar/sqlitr-db/refs/heads/main/chinook.enc.txt"
    // 'https://raw.githubusercontent.com/eltechno/python_course/master/Chinook.sqlite'
  );
  // artists.value = await getArtists(300)
  invoices.value = await getInvoices();
  console.log("invoices:", invoices.value);

  await syncWithServer("https://raw.githubusercontent.com/m79yashar/sqlitr-db/refs/heads/main/");
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
    <!-- <button @click="downloadEncrypted">دانلود دیتابیس رمزگذاری‌شده</button> -->
    <!-- <div>
      <input v-model="newArtistName" placeholder="نام آرتیست جدید" />
      <button @click="add">افزودن</button>
    </div>

    <div v-if="selectedArtistId">
      <input v-model="editArtistName" placeholder="ویرایش نام آرتیست" />
      <button @click="update">ثبت تغییرات</button>
    </div>

    <ul>
      <li v-for="a in artists.reverse()" :key="a.id">
        {{ a.id }} - {{ a.name }}
        <button @click="selectForEdit(a)">ویرایش</button>
        <button @click="remove(a.id)">حذف</button>
      </li>
    </ul> -->

    <table>
      <caption>
        add new
      </caption>
      <thead>
        <tr>
          <th>id</th>
          <th>customerId</th>
          <th>date</th>
          <th>billingAddress</th>
          <th>billingCity</th>
          <th>billingState</th>
          <th>billingCountry</th>
          <th>billingPostalCode</th>
          <th>total</th>
          <th>delete</th>
          <th>edite</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in invoices" :key="item.InvoiceId">
          <td>{{ item.InvoiceId }}</td>
          <td>{{ item.CustomerId }}</td>
          <td>{{ item.InvoiceDate }}</td>
          <td>{{ item.BillingAddress }}</td>
          <td>{{ item.BillingCity }}</td>
          <td>{{ item.BillingState }}</td>
          <td>{{ item.BillingCountry }}</td>
          <td>{{ item.BillingPostalCode }}</td>
          <td>{{ item.Total }}</td>
          <td>
            <button @click="remove(item.InvoiceId)">حذف</button>
          </td>
          <td>
            <button @click="selectForEdit(item)">ویرایش</button>
          </td>
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
