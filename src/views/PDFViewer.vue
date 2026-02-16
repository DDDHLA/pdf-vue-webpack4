<template>
  <div ref="viewer" :style="viewerStyle">
    <!-- 上传区域（无文件时显示） -->
    <upload-area v-if="!file" @file-upload="handleFileUpload" />

    <!-- PDF 查看器（有文件时显示） -->
    <template v-if="file">
      <!-- 左侧缩略图面板 -->
      <thumbnail-panel
        v-if="sidebarVisible"
        :file="file"
        :num-pages="numPages"
        :current-page="currentPage"
        @page-click="goToPage"
        @first-page="goToFirstPage"
        @prev-page="goToPrevPage"
        @next-page="goToNextPage"
        @last-page="goToLastPage"
      />

      <!-- 右侧主内容区 -->
      <div ref="container" :style="containerStyle">
        <!-- 顶部文件名 -->
        <div :style="headerStyle">
          文件名称：<span style="color: #ff4d4f">{{ file.name }}</span>
        </div>

        <!-- PDF 画布 -->
        <p-d-f-canvas
          :file="file"
          :num-pages="numPages"
          :current-page="currentPage"
          :scale="scale"
          :rotation="rotation"
          :view-mode="viewMode"
          @document-load-success="onDocumentLoadSuccess"
          @page-load-success="handlePageLoadSuccess"
        />

        <!-- 底部工具栏 -->
        <toolbar
          :scale="scale"
          :view-mode="viewMode"
          :sidebar-visible="sidebarVisible"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @reset-zoom="resetZoom"
          @rotate="rotatePage"
          @scale-change="setCustomScale"
          @fit-width="handleFitWidth"
          @fit-height="handleFitHeight"
          @fit-page="handleFitPage"
          @fullscreen="handleFullscreen"
          @toggle-view-mode="setViewMode"
          @toggle-sidebar="sidebarVisible = !sidebarVisible"
          @open-split-dialog="splitDialogVisible = true"
          @download-word="downloadWord"
        />
      </div>
    </template>

    <!-- 拆分配置弹窗 -->
    <split-dialog
      :visible="splitDialogVisible"
      :num-pages="numPages"
      :file="file"
      @close="splitDialogVisible = false"
      @confirm="handleSplitConfirm"
    />
  </div>
</template>

<script>
import { usePDFViewer } from "@/hooks/usePDFViewer";
import UploadArea from "@/components/PDFViewer/UploadArea.vue";
import ThumbnailPanel from "@/components/PDFViewer/ThumbnailPanel.vue";
import PDFCanvas from "@/components/PDFViewer/PDFCanvas.vue";
import Toolbar from "@/components/PDFViewer/Toolbar.vue";
import SplitDialog from "@/components/PDFViewer/SplitDialog.vue";

export default {
  name: "PDFViewer",
  components: {
    UploadArea,
    ThumbnailPanel,
    PDFCanvas: PDFCanvas,
    Toolbar,
    SplitDialog,
  },
  mixins: [usePDFViewer()],
  data() {
    return {
      splitDialogVisible: false,
    };
  },
  computed: {
    viewerStyle() {
      return {
        display: "flex",
        height: "100%",
        overflow: "hidden",
        background: "#f5f5f5",
      };
    },
    containerStyle() {
      return {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        position: "relative",
        background: "#f5f5f5",
      };
    },
    headerStyle() {
      return {
        height: "48px",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        background: "white",
        borderBottom: "1px solid #e0e0e0",
        fontSize: "16px",
        fontWeight: 500,
        color: "#333",
        flexShrink: 0,
      };
    },
  },
  methods: {
    handlePageLoadSuccess(dimensions) {
      this.pageDimensions = dimensions;
    },
    handleFitWidth() {
      if (this.$refs.container && this.pageDimensions) {
        const availableWidth = this.$refs.container.clientWidth - 100;
        const isDouble =
          this.viewMode === "double" && this.currentPage < this.numPages;
        const targetWidth = isDouble
          ? this.pageDimensions.width * 2 + 20
          : this.pageDimensions.width;
        this.fitWidth(availableWidth, targetWidth);
      }
    },
    handleFitHeight() {
      if (this.$refs.container && this.pageDimensions) {
        const availableHeight = this.$refs.container.clientHeight - 168;
        this.fitHeight(availableHeight, this.pageDimensions.height);
      }
    },
    handleFitPage() {
      if (this.$refs.container && this.pageDimensions) {
        const availableWidth = this.$refs.container.clientWidth - 100;
        const availableHeight = this.$refs.container.clientHeight - 168;
        const isDouble =
          this.viewMode === "double" && this.currentPage < this.numPages;
        const targetWidth = isDouble
          ? this.pageDimensions.width * 2 + 20
          : this.pageDimensions.width;
        this.fitPage(
          availableWidth,
          availableHeight,
          targetWidth,
          this.pageDimensions.height,
        );
      }
    },
    handleFullscreen() {
      if (this.$refs.viewer) {
        if (!document.fullscreenElement) {
          this.$refs.viewer.requestFullscreen().catch((err) => {
            console.error(
              `Error attempting to enable fullscreen: ${err.message}`,
            );
          });
        } else {
          document.exitFullscreen();
        }
      }
    },
    setViewMode(mode) {
      this.viewMode = mode;
    },
    handleSplitConfirm(splits) {
      console.log("拆分方案:", splits);
      // 后续可以调用PDF拆分API
      this.splitDialogVisible = false;
      this.$message.success(`已生成 ${splits.length} 个拆分段落`);
    },
  },
};
</script>
