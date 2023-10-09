<script setup lang="ts">
import DebuggingFeature from '../components/DebuggingFeature.vue'
import TabListContainer from '@/components/TabListContainer.vue'
import PouchDB from 'pouchdb-browser'

const pouchdb = new PouchDB('test')
pouchdb.info().then(function (info) {
  console.log(info)
})
</script>

<template>
  <div class="row text-start" id="debugging">
    <div class="col">
      <DebuggingFeature />
    </div>
  </div>

  <form class="row" id="searchForm">
    <div class="d-none d-xl-block col-xl-2"></div>
    <div class="col-12 col-xl-8">
      <input type="text" class="form-control" id="inputSearchBar" placeholder="Search pages" />
      <!-- <input type="submit" hidden /> -->
    </div>
    <div class="d-none d-xl-block col-xl-2"></div>
  </form>

  <div class="row gap-50px"></div>

  <div class="row"><TabListContainer /></div>
</template>

<style scoped>
div.gap-50px {
  margin-top: 50px;
}

#debugging {
  margin-top: 10px;
}
#searchForm {
  margin-top: 20vh;
}
</style>
