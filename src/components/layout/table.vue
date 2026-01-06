<template>
  <div class="contain-example">
    <el-scrollbar ref="scrollbarRef">
      <div v-for="(item, index) in catalog" :key="index" class="list">
        <div class="list-title">
          <div class="title-box">
            <svg-icon
              :name="item.icon"
              size="16"
              style="margin-right: 5px"
            ></svg-icon>
            <div class="title">{{ item.name + getCount(item) }}</div>
          </div>
          <div class="line"></div>
        </div>
        <div
          v-for="(cItem, cIndex) in item.children"
          :key="cIndex"
          class="list-item"
        >
          <div class="list-children_title">
            {{ cItem.name + getCount(item) }}
          </div>
          <div class="list-chilidren">
            <div
              v-for="(cardItem, cardIndex) in cItem.children"
              :key="cardIndex"
              class="list-chilidren_item"
              @click="jumpUrl(cardItem)"
            >
              <el-image
                style="width: 259px; height: 200px; border-radius: 4px"
                :src="getImageUrl(cardItem.thumbnail)"
                :fit="fit"
                lazy
              />
              <p class="name">{{ cardItem.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import catalog from "@/config/example.json";
import { getCount } from "@/utils/util";
import svgIcon from "@/components/svg-icon.vue";
import { ElScrollbar } from "element-plus";

const fit = ref("cover");
const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>();
function getImageUrl(value: string) {
  return `http://cdn.marsgis.cn/mars3d-example/thumbnail/${value}`;
}
/**
 * scrollbar 滚动到指定位置
 * @param v
 */
function scrollTo(v: string) {
  const orders = v.split("-");
  const allList = document.querySelectorAll(
    ".el-scrollbar__view .list"
  ) as NodeListOf<HTMLElement>;
  const f = Number(orders[0]) || 0;
  const s = Number(orders[1]) || 0;
  let fh = 0;
  allList.forEach((t, index) => {
    if (index <= f) {
      fh = fh + (t.offsetHeight || 0);
    }
  });
  let sh = 0;
  const length = allList[f]?.children.length || 0;
  for (let i = length - 1; i > 0; i--) {
    if (i > s) {
      const dom = allList[f]?.children[i] as HTMLElement;
      sh = sh + (dom.offsetHeight || 0);
    }
  }
  const h = fh - sh;
  scrollbarRef.value?.setScrollTop(h);
}

function jumpUrl(item: any) {
  debugger
  let url = import.meta.env.BASE_URL;
    url += "editor-vue.html";

  // 处理参数
  url += `?id=` + encodeURI(item.main);
  if (item.params) {
    url += `&${item.params}`;
  }
  window.open(url, "_blank");
}

defineExpose({ scrollTo });
</script>
<style scoped lang="scss">
.contain-example {
  width: 100%;
  height: calc(100vh - 100px);
  .list {
    padding-top: 60px;
  }
  .list:first-child {
    padding-top: 0;
  }
  .list-title {
    display: flex;
    align-items: center;
    margin-bottom: 22px;
    margin-top: 60px;
    cursor: default;
    .title-box {
      min-width: 136px;
      height: 36px;
      background: #def0ff;
      border-radius: 4px;
      display: flex;
      align-items: center;
      padding: 0 10px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      text-align: center;
      .title {
        height: 30px;
        font-size: 16px;
        line-height: 32px;
        color: #038bfe;
      }
    }
    .line {
      width: 426px;
      height: 1px;
      background-color: #e1f0ff;
      margin-left: 13px;
      position: relative;
    }
  }
  .list-title:first-child {
    margin-top: 0;
  }
  .list-item {
    margin-left: 20px;
    .list-children_title {
      text-align: left;
      min-width: 155px;
      height: 27px;
      font-size: 18px;
      color: #071228;
      padding: 15px 0;
    }
    .list-chilidren {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      align-items: center;
      gap: 20px 30px;
      .list-chilidren_item {
        width: 275px;
        background: #f2f6fa;
        border-radius: 4px;
        padding: 8px;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        :deep(.el-image):hover {
          transform: scale(1.1);
          transition: transform 0.5s;
        }
        .name {
          width: 80%;
          font-size: 14px;
          font-weight: 400;
          margin: auto;
          padding-top: 11px;
          color: #071228;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          text-align: center;
        }
      }
    }
  }
}
</style>
