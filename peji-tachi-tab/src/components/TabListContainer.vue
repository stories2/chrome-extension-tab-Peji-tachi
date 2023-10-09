<script setup lang="ts">
import TabListItem from './TabListItem.vue'
import { type BasicTabModel } from '@/models/BasicTabModel'

defineProps<{
  tabList: BasicTabModel[]
}>()
</script>

<template>
  <template v-for="tab in tabList.reverse()" :key="tab.id">
    <TabListItem
      :children-len="tab.children.length"
      :tab-id="tab.id"
      :img-url="tab.favIconUrl"
      :title="tab.title"
    />
  </template>
</template>
