<template>
  <div class="compare-view">
    <div id="leftViewer"></div>
    <div id="rightViewer"></div>
  </div>
</template>

<style lang="scss">
.compare-view {
  display: flex;
  width: 100%;
  height: 100%;
}

#leftViewer,
#rightViewer {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
}

#leftViewer {
  border-right: 2px solid #333;
}
</style>
