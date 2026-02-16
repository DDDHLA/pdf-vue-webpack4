<template>
  <div :style="toolbarStyle">
    <!-- 中间：视图工具栏 -->
    <div :style="viewToolbarStyle">
      <a-space :size="1">
        <a-button
          type="text"
          size="small"
          :style="getButtonStyle(sidebarVisible)"
          @click="$emit('toggle-sidebar')"
          :title="sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'"
        >
          <a-icon type="eye" />
        </a-button>
        <a-button
          type="text"
          size="small"
          @click="$emit('open-split-dialog')"
          title="手工拆分"
        >
          <a-icon type="scissor" />
        </a-button>
        <div :style="dividerStyle" />
        <a-button
          type="text"
          size="small"
          :style="getButtonStyle(viewMode === 'scroll')"
          @click="$emit('toggle-view-mode', 'scroll')"
          title="滚动视图"
        >
          <a-icon type="unordered-list" />
        </a-button>
        <a-button
          type="text"
          size="small"
          :style="getButtonStyle(viewMode === 'double')"
          @click="$emit('toggle-view-mode', 'double')"
          title="双页视图"
        >
          <a-icon type="book" />
        </a-button>
        <a-button
          type="text"
          size="small"
          :style="getButtonStyle(viewMode === 'single')"
          @click="$emit('toggle-view-mode', 'single')"
          title="单页视图"
        >
          <a-icon type="file" />
        </a-button>
        <div :style="dividerStyle" />
        <a-button
          type="text"
          size="small"
          @click="$emit('fit-height')"
          title="适应高度"
        >
          <a-icon type="arrows-alt" :rotate="90" />
        </a-button>
        <a-button
          type="text"
          size="small"
          @click="$emit('fit-width')"
          title="适应宽度"
        >
          <a-icon type="arrows-alt" />
        </a-button>
        <a-button
          type="text"
          size="small"
          @click="$emit('fit-page')"
          title="适应页面"
        >
          <a-icon type="fullscreen" />
        </a-button>
        <a-button
          type="text"
          size="small"
          @click="$emit('reset-zoom')"
          title="重置视图"
        >
          <a-icon type="fullscreen-exit" />
        </a-button>
        <a-button
          type="text"
          size="small"
          @click="$emit('rotate')"
          title="旋转"
        >
          <a-icon type="redo" />
        </a-button>
        <div :style="dividerStyle" />
        <a-button
          type="text"
          size="small"
          @click="$emit('download-word')"
          title="下载 Word"
        >
          <a-icon type="file-word" />
        </a-button>
      </a-space>
    </div>

    <!-- 右侧：缩放控制 -->
    <div :style="zoomControlStyle">
      <a-select
        size="small"
        :value="scalePercent"
        :style="{ width: '80px', fontSize: '12px' }"
        @change="handleScaleChange"
      >
        <a-select-option value="50%">50%</a-select-option>
        <a-select-option value="75%">75%</a-select-option>
        <a-select-option value="100%">100%</a-select-option>
        <a-select-option value="125%">125%</a-select-option>
        <a-select-option value="150%">150%</a-select-option>
        <a-select-option value="200%">200%</a-select-option>
      </a-select>
      <a-button type="text" size="small" @click="$emit('zoom-out')">
        <a-icon type="zoom-out" />
      </a-button>
      <a-slider
        :min="30"
        :max="300"
        :value="Math.round(scale * 100)"
        :style="{ flex: 1, margin: '0 8px' }"
        :tip-formatter="null"
        @change="handleSliderChange"
      />
      <a-button type="text" size="small" @click="$emit('zoom-in')">
        <a-icon type="zoom-in" />
      </a-button>
      <a-button
        type="text"
        size="small"
        @click="$emit('fullscreen')"
        title="全屏"
      >
        <a-icon type="fullscreen" />
      </a-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "Toolbar",
  props: {
    scale: {
      type: Number,
      required: true,
    },
    viewMode: {
      type: String,
      required: true,
    },
    sidebarVisible: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    scalePercent() {
      return Math.round(this.scale * 100) + "%";
    },
    toolbarStyle() {
      return {
        background: "#eeeeee",
        borderTop: "1px solid #d0d0d0",
        padding: "4px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "40px",
        userSelect: "none",
        gap: "20px",
      };
    },
    viewToolbarStyle() {
      return {
        display: "flex",
        alignItems: "center",
        gap: "1px",
        background: "#ddd",
        padding: "2px",
        borderRadius: "4px",
      };
    },
    dividerStyle() {
      return {
        width: "1px",
        height: "14px",
        background: "#bbb",
        margin: "0 2px",
      };
    },
    zoomControlStyle() {
      return {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "300px",
      };
    },
  },
  methods: {
    getButtonStyle(isActive) {
      return {
        background: isActive ? "#ccc" : "transparent",
      };
    },
    handleScaleChange(value) {
      this.$emit("scale-change", parseFloat(value) / 100);
    },
    handleSliderChange(value) {
      this.$emit("scale-change", value / 100);
    },
  },
};
</script>
