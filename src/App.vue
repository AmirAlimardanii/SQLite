<script setup>
import { ref, onMounted } from "vue";
import {
  importDatabaseFromServer,
  getTableData,
  getLastUpdate,
  mockSyncApi,
  deleteRecords,
  upsertRecords,
  getRecordById,
} from "@/services/dbService";

const study = ref([]);
const users = ref([]);
const activeTab = ref("Wells3");
const myStudy = ["4717", "6002"];
const databases = {
  wells3: {
    // urls: myStudy.map(
    //   (m) =>
    //     `https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/src/wells/wells3_${m}.txt`
    //     // https://github.com/AmirAlimardanii/SQLite/blob/th-db/src/wells/wells3_1708.txt
    // ),
    urls: [
      "https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/src/wells/wells3_6002.txt",
    ],

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
  users: {
    urls: [
      "https://raw.githubusercontent.com/AmirAlimardanii/SQLite/refs/heads/th-db/users_encrypted_base64.txt",
    ],
    id: "INTEGER PRIMARY KEY",
    user_name: "TEXT",
    first_name: "TEXT",
    last_name: "TEXT",
    national_code: "TEXT",
  },
};

onMounted(async () => {
  try {
    // 1. ایمپورت دیتابیس
    await importDatabaseFromServer(databases);

    // 2. دریافت آخرین تاریخ بروزرسانی برای هر جدول
    const sourcesLastUpdate = await getLastUpdate("Wells3");
    const usersLastUpdate = await getLastUpdate("users");

    console.log("Last update - Sources:", sourcesLastUpdate);
    console.log("Last update - Users:", usersLastUpdate);

    // 3. استفاده از mock API برای هر جدول
    const sourcesSync = await mockSyncApi("Wells3", sourcesLastUpdate);
    const usersSync = await mockSyncApi("users", usersLastUpdate);

    console.log("Sources sync data:", sourcesSync);
    console.log("Users sync data:", usersSync);

    // 4. پردازش نتایج سینک
    if (sourcesSync.deletedData && sourcesSync.deletedData.length > 0) {
      await deleteRecords("Wells3", sourcesSync.deletedData);
    }

    if (sourcesSync.updateData || sourcesSync.createData) {
      const allSourcesData = [...(sourcesSync.updateData || []), ...(sourcesSync.createData || [])];
      if (allSourcesData.length > 0) {
        await upsertRecords("Wells3", allSourcesData);
      }
    }

    if (usersSync.deletedData && usersSync.deletedData.length > 0) {
      await deleteRecords("users", usersSync.deletedData);
    }

    if (usersSync.updateData || usersSync.createData) {
      const allUsersData = [...(usersSync.updateData || []), ...(usersSync.createData || [])];
      if (allUsersData.length > 0) {
        await upsertRecords("users", allUsersData);
      }
    }

    // 5. بارگذاری داده‌ها برای نمایش
    study.value = await getTableData("Wells3");
    users.value = await getTableData("users");

    console.log("Sources loaded:", study.value.length);
    console.log("Users loaded:", users.value.length);

    // 6. تست توابع اضافی (اختیاری)
    // const sourceRecord = await getRecordById("Wells3", 5556);
    // const userRecord = await getRecordById("users", 1001);
    // console.log("Sample source record:", sourceRecord);
    // console.log("Sample user record:", userRecord);
  } catch (error) {
    console.error("Error in onMounted:", error);
  }
});
</script>

<template>
  <div>
    <h1>مدیریت داده‌ها</h1>

    <!-- تب‌ها برای切换 بین جداول -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'Wells3' }" @click="activeTab = 'Wells3'">
        منابع (Sources) - {{ study.length }} رکورد
      </button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
        کاربران (Users) - {{ users.length }} رکورد
      </button>
    </div>

    <!-- جدول Wells3 -->
    <div v-if="activeTab === 'Wells3'">
      <h2>جدول منابع</h2>
      <div v-if="study.length === 0" class="no-data">داده‌ای برای نمایش وجود ندارد</div>
      <table v-else>
        <!-- <table v-else> -->
        <thead>
          <tr>
            <th>id</th>
            <th>d</th>
            <th>c</th>
            <th>e</th>
            <th>h</th>
            <th>m</th>
            <th>a</th>
            <th>n</th>
            <th>q</th>
            <th>p</th>
            <th>i</th>
            <th>f</th>
            <th>k</th>
            <th>s</th>
            <th>j</th>
            <th>r</th>
            <th>o</th>
            <th>u</th>
            <th>g</th>
            <th>t</th>
            <th>b</th>
            <th>w</th>
            <th>v</th>
            <th>ms</th>
            <th>ms</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in study" :key="item.id">
            <td>{{ item.id }}id</td>
            <td>{{ item.d }}</td>
            <td>c{{ item.c }}</td>
            <td>{{ item.e }}</td>
            <td>{{ item.h }}</td>
            <td>{{ item.m }}</td>
            <td>{{ item.a }}</td>
            <td>{{ item.n }}</td>
            <td>{{ item.q }}</td>
            <td>{{ item.p }}</td>
            <td>{{ item.i }}</td>
            <td>{{ item.f }}</td>
            <td>{{ item.k }}</td>
            <td>{{ item.s }}</td>
            <td>{{ item.j }}</td>
            <td>{{ item.r }}</td>
            <td>{{ item.o }}</td>
            <td>{{ item.u }}</td>
            <td>{{ item.g }}</td>
            <td>{{ item.t }}</td>
            <td>{{ item.b }}</td>
            <td>{{ item.w }}</td>
            <td>{{ item.v }}</td>
            <td>{{ item.ms }}</td>
          </tr>
        </tbody>
        <!-- </table> -->
      </table>
    </div>

    <!-- جدول users -->
    <div v-if="activeTab === 'users'">
      <h2>جدول کاربران</h2>
      <div v-if="users.length === 0" class="no-data">داده‌ای برای نمایش وجود ندارد</div>
      <table v-else>
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
  background-color: #4caf50;
  color: white;
  border-color: #4caf50;
}

.tabs button:hover {
  background-color: #e8e8e8;
}

.tabs button.active:hover {
  background-color: #45a049;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}
</style>
