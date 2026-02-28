<template>
  <div ref="viewer" class="viewer-wrapper" :style="viewerStyle">
    <!-- 上传区域（无文件时显示） -->
    <upload-area v-if="!file" @file-upload="handleFileUpload" />

    <!-- PDF 查看器（有文件时显示） -->
    <template v-if="file">
      <!-- 第一行头部：标题 + 操作按钮 -->
      <div class="top-header">
        <span class="top-header-title">融资业务-材料复核</span>
        <div class="top-header-actions">
          <a-button size="small" type="primary">提交</a-button>
          <a-button size="small">保存</a-button>
          <a-button size="small">返回</a-button>
        </div>
      </div>
      <!-- 第二行头部：基本信息折叠面板 -->
      <a-collapse
        :active-key="infoExpanded ? ['info'] : []"
        :bordered="false"
        class="info-collapse"
        @change="(keys) => (infoExpanded = keys.includes('info'))"
      >
        <a-collapse-panel key="info" header="基本信息">
          <a-descriptions :column="2" size="small">
            <a-descriptions-item label="业务编号"
              >BIZ-2026-001</a-descriptions-item
            >
            <a-descriptions-item label="融资人"
              >XXXX有限公司</a-descriptions-item
            >
            <a-descriptions-item label="业务类型"
              >流动资金贷款</a-descriptions-item
            >
            <a-descriptions-item label="申请金额">500万元</a-descriptions-item>
            <a-descriptions-item label="申请日期"
              >2026-02-28</a-descriptions-item
            >
            <a-descriptions-item label="经办人">张三</a-descriptions-item>
          </a-descriptions>
        </a-collapse-panel>
      </a-collapse>
      <!-- 主体内容区 -->
      <div class="viewer-body">
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
            :preview-scale="previewScale"
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
            @scale-change="handleScaleChange"
            @scale-preview="handleScalePreview"
            @fit-width="handleFitWidth"
            @fit-height="handleFitHeight"
            @fit-page="handleFitPage"
            @fullscreen="handleFullscreen"
            @toggle-view-mode="setViewMode"
            @toggle-sidebar="sidebarVisible = !sidebarVisible"
            @open-split-dialog="splitDialogVisible = true"
            @open-analysis-dialog="analysisDialogVisible = true"
            @download-word="downloadWord"
          />
        </div>
        <!-- 右侧智能处理面板 -->
        <analysis-panel v-if="file" />
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
import AnalysisPanel from "@/components/PDFViewer/AnalysisPanel.vue";

export default {
  name: "PDFViewer",
  components: {
    UploadArea,
    ThumbnailPanel,
    PDFCanvas: PDFCanvas,
    Toolbar,
    SplitDialog,
    AnalysisPanel,
  },
  mixins: [usePDFViewer()],
  data() {
    return {
      splitDialogVisible: false,
      infoExpanded: true,
      previewScale: null,
    };
  },
  computed: {
    viewerStyle() {
      return {
        display: "flex",
        flexDirection: "column",
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
    handleScalePreview(previewScale) {
      this.previewScale = previewScale;
    },
    handleScaleChange(newScale) {
      this.previewScale = null;
      this.setCustomScale(newScale);
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

<style scoped>
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.top-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.top-header-actions {
  display: flex;
  gap: 8px;
}

.info-collapse {
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.viewer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
