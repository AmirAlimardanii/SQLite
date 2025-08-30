<script setup>
import { ref, onMounted } from "vue";
import {
  importDatabaseFromServer,
  getArtists,
  addArtist,
  updateArtist,
  deleteArtist,
  syncWithServer,
  getInvoices,
  getStudy,
  getLastUpdate,
} from "@/services/dbService";

const artists = ref([]);
const study = ref([]);

const newArtistName = ref("");
const editArtistName = ref("");
const selectedArtistId = ref(null);

onMounted(async () => {
  await importDatabaseFromServer([
    "https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/feat/seperate-file/data_encrypted.txt",
  ]);

  study.value = await getStudy();

  const lastUpdate = await getLastUpdate();
  console.log("Last update:", lastUpdate);
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
</script>

<template>
  <div>
    <h1>مدیریت آرتیست‌ها</h1>
    <table>
      <thead>
        <tr>
          <th>index</th>
          <th>id</th>
          <th>company</th>
          <th>type</th>
          <th>name</th>
          <th>code</th>
          <th>special</th>
          <th>aquifer</th>
          <th>river</th>
          <th>village</th>
          <th>status</th>
          <th>study</th>
          <th>tamab</th>
          <th>lng</th>
          <th>lat</th>
          <th>alt</th>
          <th>created_at</th>
          <th>updated_at</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in study" :key="item.id">
          <td>{{ index + 1 }}</td>
          <td>{{ item.id }}</td>
          <td>{{ item.company }}</td>
          <td>{{ item.type }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.code }}</td>
          <td>{{ item.special }}</td>
          <td>{{ item.aquifer }}</td>
          <td>{{ item.river }}</td>
          <td>{{ item.village }}</td>
          <td>{{ item.status }}</td>
          <td>{{ item.study }}</td>
          <td>{{ item.tamab }}</td>
          <td>{{ item.lng }}</td>
          <td>{{ item.lat }}</td>
          <td>{{ item.alt }}</td>
          <td>{{ item.created_at }}</td>
          <td>{{ item.updated_at }}</td>
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
