<template>
  <a-layout style="height: 100vh">
    <!-- 左侧菜单 -->
    <a-layout-sider
      v-model="collapsed"
      :trigger="null"
      collapsible
      :style="{ background: '#001529' }"
    >
      <div :style="logoStyle">
        {{ collapsed ? "文档" : "智能文档处理" }}
      </div>
      <a-menu
        theme="dark"
        mode="inline"
        :selected-keys="[currentPath]"
        @click="handleMenuClick"
      >
        <a-menu-item key="/pdf-viewer">
          <a-icon type="file-pdf" />
          <span>PDF查看</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧内容区 -->
    <a-layout>
      <!-- 顶部导航栏 -->
      <a-layout-header :style="headerStyle">
        <a-icon
          class="trigger"
          :type="collapsed ? 'menu-unfold' : 'menu-fold'"
          @click="() => (collapsed = !collapsed)"
        />
        <div style="margin-left: 24px; font-size: 16px; color: #1890ff">
          智能合同审核
        </div>
      </a-layout-header>

      <!-- 主内容 -->
      <a-layout-content :style="contentStyle">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script>
export default {
  name: "MainLayout",
  data() {
    return {
      collapsed: false,
    };
  },
  computed: {
    currentPath() {
      return this.$route.path;
    },
    logoStyle() {
      return {
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: this.collapsed ? "14px" : "18px",
        fontWeight: 500,
        transition: "all 0.2s",
      };
    },
    headerStyle() {
      return {
        padding: "0 24px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #f0f0f0",
      };
    },
    contentStyle() {
      return {
        margin: 0,
        padding: 0,
        background: "#f5f5f5",
        overflow: "hidden",
      };
    },
  },
  methods: {
    handleMenuClick({ key }) {
      this.$router.push(key);
    },
  },
};
</script>

<style scoped>
.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}
</style>
