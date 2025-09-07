<template>
  <button @click="downloadJson">Download JSON</button>
  <table>
    <thead>
      <tr>
        <th>id</th>
        <th v-for="title in nahrs">{{ title }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in study" :key="item.id">
        <td>{{ item.id }}</td>
        <td v-for="key in Object.keys(nahrs)">{{ item[key] }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
const FILE_NAME = "wells";
import { RECORDS } from "../data/wells_min.json";
// import wells3 from "../new_data/wells3.json";
// import  spring3  from "../new_data/spring3.json";
import { ref, onMounted } from "vue";
import {
  importDatabaseFromServer,
  getTableData,
  getLastUpdate,
  mockSyncApi,
  deleteRecords,
  upsertRecords,
  getRecordById,
} from "@/services/jsonService";
import { Spring3 } from "../CensusConst";

const study = ref([]);
const users = ref([]);
const activeTab = ref("sources");

const databases = {
  // pumps3: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   h: "INTEGER",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   w: "TEXT",
  //   r: "TEXT",
  //   i: "TEXT",
  //   v: "TEXT",
  //   j: "TEXT",
  //   p: "TEXT",
  //   q: "TEXT",
  //   f: "TEXT",
  //   k: "INTEGER",
  //   b: "INTEGER",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // abbands: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   m: "INTEGER",
  //   c: "TEXT",
  //   n: "TEXT",
  //   r: "TEXT",
  //   a: "TEXT",
  //   v: "TEXT",
  //   l: "TEXT",
  //   w: "TEXT",
  //   k: "INTEGER",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // abbands3: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   m: "INTEGER",
  //   c: "TEXT",
  //   a: "TEXT",
  //   l: "TEXT",
  //   w: "TEXT",
  //   r: "INTEGER",
  //   v: "TEXT",
  //   k: "INTEGER",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // nahrs: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   m: "INTEGER",
  //   c: "TEXT",
  //   r: "TEXT",
  //   n: "TEXT",
  //   a: "TEXT",
  //   l: "TEXT",
  //   f: "TEXT",
  //   v: "TEXT",
  //   k: "INTEGER",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // nahrs3: {
  // id: "INTEGER PRIMARY KEY",
  // d: "INTEGER",
  // c: "TEXT",
  // h: "TEXT",
  // m: "INTEGER",
  // a: "TEXT",
  // n: " TEXT",
  //   i: "TEXT",
  //   f: "INTEGER",
  //   r: "TEXT",
  //   k: "INTEGER",
  //   b: "TEXT",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // motors: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   m: "INTEGER",
  //   c: "TEXT",
  //   r: "TEXT",
  //   w: "TEXT",
  //   a: "TEXT",
  //   f: "TEXT",
  //   s: "TEXT",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // motors3: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   h: "TEXT",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   w: "TEXT",
  //   r: "TEXT",
  //   f: "INTEGER",
  //   k: "INTEGER",
  //   b: "REAL",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // springs3: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   h: "TEXT",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   w: "TEXT",
  //   n: "TEXT",
  //   q: "TEXT",
  //   p: "TEXT",
  //   i: "TEXT",
  //   f: "TEXT",
  //   k: "INTEGER",
  //   s: "INTEGER",
  //   j: "INTEGER",
  //   o: "INTEGER",
  //   g: "REAL",
  //   t: "REAL",
  //   b: "TEXT",
  //   l: "TEXT",
  // },
  // springs: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   w: "TEXT",
  //   n: "TEXT",
  //   f: "TEXT",
  //   s: "INTEGER",
  //   b: "TEXT",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // qanats: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   u: "INTEGER",
  //   e: "INTEGER",
  //   q: "INTEGER",
  //   w: "TEXT",
  //   n: "TEXT",
  //   f: "TEXT",
  //   s: "TEXT",
  //   p: "TEXT",
  //   o: "INTEGER",
  //   b: "TEXT",
  //   g: "REAL",
  //   t: "REAL",
  // },
  // qanats3: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   e: "INTEGER",
  //   h: "TEXT",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   w: "TEXT",
  //   n: "TEXT",
  //   q: "TEXT",
  //   p: "TEXT",
  //   i: "TEXT",
  //   j: "TEXT",
  //   f: "TEXT",
  //   k: "INTEGER",
  //   s: "INTEGER",
  //   r: "INTEGER",
  //   o: "INTEGER",
  //   g: "TEXT",
  //   t: "TEXT",
  //   b: "TEXT",
  //   l: "TEXT",
  //   v: "TEXT",
  //   u: "TEXT",
  //   mx: "TEXT",
  //   my: "TEXT",
  // },
  // wells3: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   e: "INTEGER",
  //   h: "TEXT",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   n: "TEXT",
  //   q: "TEXT",
  //   p: "INTEGER",
  //   i: "TEXT",
  //   f: "INTEGER",
  //   k: "INTEGER",
  //   s: "INTEGER",
  //   j: "INTEGER",
  //   r: "INTEGER",
  //   o: "INTEGER",
  //   u: "TEXT",
  //   g: "REAL",
  //   t: "REAL",
  //   b: "TEXT",
  //   w: "TEXT",
  //   v: "TEXT",
  //   l: "TEXT",
  //   ms: "TEXT",
  // }
  // wells: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   e: "INTEGER",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   w: "TEXT",
  //   q: "TEXT",
  //   p: "INTEGER",
  //   i: "INTEGER",
  //   f: "INTEGER",
  //   k: "INTEGER",
  //   s: "INTEGER",
  //   j: "TEXT",
  //   r: "INTEGER",
  //   o: "TEXT",
  //   u: "TEXT",
  //   g: "REAL",
  //   t: "REAL",
  // },
  sammab: {
    id: "INTEGER PRIMARY KEY",
    class: "INTEGER",
    samab: "INTEGER",
    wrs: "INTEGER",
    codab: "INTEGER",
    study_code: "INTEGER",
    affair_name: "TEXT",
    utm_x: "INTEGER",
    utm_y: "INTEGER",
    zone: "INTEGER",
    longitude: "REAL",
    latitude: "REAL",
    elec_sub: "TEXT",
    elec_code: "TEXT",
    village_name: "TEXT",
    owner: "TEXT",
    owner_name: "TEXT",
    phone: "TEXT",
    city: "TEXT",
    license_code: "TEXT",
    first_license_code: "TEXT",
    first_license_number: "TEXT",
    first_license_date: "TEXT",
    first_flow: "TEXT",
    first_work_hour: "TEXT",
    last_license_code: "TEXT",
    last_license_number: "TEXT",
    last_license_date: "TEXT",
    license_validity_date: "TEXT",
    well_depth: "TEXT",
    allowed_flow: "TEXT",
    working_hour: "TEXT",
    annual_discharge: "TEXT",
    pipe_diameter: "TEXT",
    wall_pipe: "TEXT",
    usage_code: "TEXT",
    pump_depth: "TEXT",
    power_code: "TEXT",
    counter_type: "TEXT",
    counter_status: "TEXT",
    created_at: "TEXT",
    updated_at: "TEXT",
  },
  // dams3: {
  //   id: "INTEGER PRIMARY KEY",
  //   d: "INTEGER",
  //   c: "TEXT",
  //   h: "TEXT",
  //   m: "INTEGER",
  //   a: "TEXT",
  //   n: "TEXT",
  //   r: "TEXT",
  //   sf: "TEXT",
  //   hs: "TEXT",
  //   as: "TEXT",
  //   ep: "TEXT",
  //   ek: "TEXT",
  //   tt: "TEXT",
  //   tn: "TEXT",
  //   tmm: "TEXT",
  //   hm: "TEXT",
  //   sd: "TEXT",
  //   ag: "TEXT",
  //   aka: "TEXT",
  //   ab: "TEXT",
  //   ps3: "TEXT",
  //   dps: "TEXT",
  //   vf: "TEXT",
  //   nsr: "TEXT",
  //   hss: "TEXT",
  //   ns: "TEXT",
  //   nh: "TEXT",
  //   nbf: "TEXT",
  //   pa: "TEXT",
  //   nb: "TEXT",
  //   nw: "TEXT",
  //   j: "TEXT",
  //   f: "TEXT",
  //   g: "TEXT",
  //   t: "TEXT",
  // },
};

onMounted(async () => {
  try {
    await importDatabaseFromServer(databases);
    study.value = await getTableData("wells3");
  } catch (error) {
    console.error("Error in onMounted:", error);
  }
});

function downloadJson() {
  const blob = new Blob([JSON.stringify(RECORDS.map((item, id) => ({ ...item, id: id + 1 })))], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = FILE_NAME + ".json";
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<!-- <template>
  <div>
    <h1>مدیریت داده‌ها</h1>

    <div class="tabs">
      <button :class="{ active: activeTab === 'sources' }" @click="activeTab = 'sources'">
        منابع (Sources) - {{ study.length }} رکورد
      </button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
        کاربران (Users) - {{ users.length }} رکورد
      </button>
    </div>

    <div v-if="activeTab === 'sources'">
      <h2>جدول منابع</h2>
      <div v-if="study.length === 0" class="no-data">داده‌ای برای نمایش وجود ندارد</div>
      <table v-else>
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
</template> -->

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
