<template>
  <a-config-provider :locale="locale">
    <div id="app">
      <router-view />
    </div>
  </a-config-provider>
</template>

<script>
import zhCN from "ant-design-vue/es/locale/zh_CN";

export default {
  name: "App",
  data() {
    return {
      locale: zhCN,
    };
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol", "Noto Color Emoji";
}

#app {
  height: 100vh;
  width: 100vw;
}
</style>
