<script setup>
import { ref, onMounted } from "vue";
import {
  importDatabaseFromServer,
  getTableData,
  getLastUpdate,
  mockSyncApi,
  deletedData,
  updateData,
} from "@/services/dbService";

const study = ref([]);
const users = ref([]);
const activeTab = ref('sources'); // برای مدیریت تب‌ها

const databases = {
  sources: {
    urls: [
      "https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/feat/seperate-file/newSources_encrypted_v2.txt",
    ],
    id: "INTEGER PRIMARY KEY",
    comapny: "TEXT",
    type: "TEXT",
    name: "TEXT",
    code: "TEXT",
    special: "TEXT",
    aquifer: "TEXT",
    river: "TEXT",
    village: "TEXT",
    status: "TEXT",
    study: "TEXT",
    tamab: "TEXT",
    lng: "TEXT",
    lat: "TEXT",
    alt: "TEXT",
    created_at: "TEXT",
    updated_at: "TEXT",
  },
  users: {
    urls: [
      "https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/feat/seperate-file/users.db.enc.base64",
    ],
    id: "INTEGER PRIMARY KEY",
    user_name: "TEXT",
    first_name: "TEXT",
    last_name: "TEXT",
    national_code: "TEXT",
  },
};

onMounted(async () => {
  await importDatabaseFromServer(databases);

  // بارگذاری داده‌های sources
  const lastUpdate = await getLastUpdate('sources');
  console.log("Last update:", lastUpdate);

  const result = await mockSyncApi(lastUpdate);
  console.log("📥 دریافت از mock API:", result);

  await deletedData('sources', result.deletedData);
  await updateData('sources', result.updateData.concat(result.createData));
  
  // بارگذاری هر دو جدول
  study.value = await getTableData('sources');
  users.value = await getTableData('users');
});
</script>

<template>
  <div>
    <h1>مدیریت داده‌ها</h1>
    
    <!-- تب‌ها برای切换 بین جداول -->
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'sources' }" 
        @click="activeTab = 'sources'"
      >
        منابع (Sources)
      </button>
      <button 
        :class="{ active: activeTab === 'users' }" 
        @click="activeTab = 'users'"
      >
        کاربران (Users)
      </button>
    </div>

    <!-- جدول sources -->
    <div v-if="activeTab === 'sources'">
      <h2>جدول منابع</h2>
      <table>
        <thead>
          <tr>
            <th>index</th>
            <th>id</th>
            <th>comapny</th>
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
            <td>{{ item.comapny }}</td>
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

    <!-- جدول users -->
    <div v-if="activeTab === 'users'">
      <h2>جدول کاربران</h2>
      <table>
        <thead>
          <tr>
            <th>index</th>
            <th>id</th>
            <th>user_name</th>
            <th>first_name</th>
            <th>last_name</th>
            <th>national_code</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in users" :key="user.id">
            <td>{{ index + 1 }}</td>
            <td>{{ user.id }}</td>
            <td>{{ user.user_name }}</td>
            <td>{{ user.first_name }}</td>
            <td>{{ user.last_name }}</td>
            <td>{{ user.national_code }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%;
  margin-top: 20px;
}

td,
th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #f2f2f2;
}

.tabs {
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  margin-right: 10px;
  border: 1px solid #ccc;
  background-color: #f8f8f8;
  cursor: pointer;
  border-radius: 4px;
}

.tabs button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.tabs button:hover {
  background-color: #e8e8e8;
}

.tabs button.active:hover {
  background-color: #45a049;
}
</style>