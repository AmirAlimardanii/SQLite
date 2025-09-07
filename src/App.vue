<template>
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
          <td>{{ item.c }}</td>
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
import { ref, onBeforeMount, onBeforeUnmount } from "vue";
import { getTableData, createDatabase } from "@/services/cacheService";

const study = ref([]);

const ddd = async () => {
  study.value = await getTableData("wells3");
};

let checkSwCount = 0;
let checkSwActive = null;
onBeforeMount(() => {
  if ("serviceWorker" in navigator) {
    checkSwActive = setInterval(() => {
      navigator.serviceWorker.ready.then((res) => {
        if (res.active.state === "activated") {
          checkNewInstall();
          clearInterval(checkSwActive);
        }
      });
      checkSwCount++;
      if (checkSwCount > 4) {
        window.location.href = "/";
        console.log("checkSwCount", checkSwCount);
      }
    }, 1000);
  } else createDatabase("wells3");
});

onBeforeUnmount(() => {
  if (checkSwActive) clearInterval(checkSwActive);
});

const checkNewInstall = () => {
  let InstallTemporary = localStorage.getItem("InstallTemporary");
  if (InstallTemporary === null) {
    localStorage.setItem("InstallTemporary", "refresh");
    window.location.href = "/";
  } else createDatabase("wells3");
};
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
