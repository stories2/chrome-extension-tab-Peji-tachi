<script setup lang="ts">
import defaultImgIcon from '@/assets/icon16.png'

export interface TabListItemModel {
  title: string
  imgUrl?: string
  link: string
  tabId: number
  childrenLen: number
}

const props = withDefaults(defineProps<TabListItemModel>(), {
  title: 'Default Title',
  link: '#',
  tabId: -1,
  childrenLen: 0,
  imgUrl: defaultImgIcon
})

function loadDefaultImg(e: Event) {
  ;(e.target as HTMLImageElement).src = defaultImgIcon
}

function onTabItemClicked() {
  if (props && props.tabId >= 0) window.open(props.link, '_blank')
  else console.warn(`tabId is less than 0`)
}
</script>

<template>
  <div class="col-12 col-md-6 col-lg-4">
    <ul class="list-group list-group-flush">
      <li
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
        style="cursor: pointer"
        @click="onTabItemClicked"
      >
        <div>
          <!-- <input class="form-check-input me-1" type="checkbox" value="" id="firstCheckbox" /> -->
          <img
            :src="imgUrl"
            @error="loadDefaultImg"
            class="tab-favicon-img"
            style="vertical-align: super"
          />
          <label
            class="form-check-label tab-item-text"
            for="firstCheckbox"
            style="max-width: 150px"
            >{{ title }}</label
          >
        </div>
        <span class="badge bg-primary rounded-pill">{{ childrenLen }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tab-item-text {
  text-overflow: ellipsis;
  word-break: break-all;
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
}

.tab-favicon-img {
  height: 16px;
  width: auto;
  max-width: 32px;
}
</style>
