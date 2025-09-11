<template>
  <button @click="(e) => importDatabaseFromFiles('wells3')">get Data</button>
  <button @click="ddd">Load Data</button>
  <div>
    <table>
      <!-- <table v-else> -->
      <thead>
        <tr>
          <th>index</th>
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
          <td>{{ index + 1 }}</td>
          <td>{{ item.id }}</td>
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
</template>
<script setup>
import { RECORDS } from "../pumps3_min.json";
import { abbands } from "../ab_bands_min.json";
import { Wells3 } from "../wells3_min.json";
import { Pump3 } from "../CensusConst";
import { ref, onMounted } from "vue";
import {
  getTableData,
  manageIndexedDBFiles,
  importDatabaseFromFiles,
  // getKeysInIndexedDB,
} from "@/services/dbService";

const study = ref([]);
// const users = ref([]);
// const activeTab = ref("Wells3");

const ddd = async () => {
  study.value = await getTableData("wells3");
};
onMounted(async () => {
  try {
    // 1. ایمپورت دیتابیس
    await manageIndexedDBFiles();

    // 3. استفاده از mock API برای هر جدول
    // const sourcesSync = await mockSyncApi("sources", sourcesLastUpdate);
    // const usersSync = await mockSyncApi("users", usersLastUpdate);

    // 4. پردازش نتایج سینک
    // if (sourcesSync.deletedData && sourcesSync.deletedData.length > 0) {
    //   await deleteRecords("sources", sourcesSync.deletedData);
    // }

    // if (sourcesSync.updateData || sourcesSync.createData) {
    //   const allSourcesData = [...(sourcesSync.updateData || []), ...(sourcesSync.createData || [])];
    //   if (allSourcesData.length > 0) {
    //     await upsertRecords("sources", allSourcesData);
    //   }
    // }
    // if (sourcesSync.deletedData && sourcesSync.deletedData.length > 0) {
    //   await deleteRecords("sources", sourcesSync.deletedData);
    // }

    // if (sourcesSync.updateData || sourcesSync.createData) {
    //   const allSourcesData = [...(sourcesSync.updateData || []), ...(sourcesSync.createData || [])];
    //   if (allSourcesData.length > 0) {
    //     await upsertRecords("sources", allSourcesData);
    //   }
    // }

    // if (usersSync.deletedData && usersSync.deletedData.length > 0) {
    //   await deleteRecords("users", usersSync.deletedData);
    // }

    // if (usersSync.updateData || usersSync.createData) {
    //   const allUsersData = [...(usersSync.updateData || []), ...(usersSync.createData || [])];
    //   if (allUsersData.length > 0) {
    //     await upsertRecords("users", allUsersData);
    //   }
    // }
    // if (usersSync.deletedData && usersSync.deletedData.length > 0) {
    //   await deleteRecords("users", usersSync.deletedData);
    // }

    // if (usersSync.updateData || usersSync.createData) {
    //   const allUsersData = [...(usersSync.updateData || []), ...(usersSync.createData || [])];
    //   if (allUsersData.length > 0) {
    //     await upsertRecords("users", allUsersData);
    //   }
    // }

    // 5. بارگذاری داده‌ها برای نمایش
    // users.value = await getTableData("users");

    // console.log("Sources loaded:", study.value.length);
    // console.log("Users loaded:", users.value.length);
    // console.log("Sources loaded:", study.value.length);
    // console.log("Users loaded:", users.value.length);

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

