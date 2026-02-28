<template>
  <div ref="viewer" class="viewer-wrapper" :style="viewerStyle">
    <!-- 上传区域（无文件时显示） -->
    <upload-area v-if="files.length === 0" @files-upload="handleFilesUpload" />

    <!-- PDF 查看器（有文件时显示） -->
    <template v-if="files.length > 0">
      <!-- 第一行头部：标题 + 操作按钮 -->
      <div v-if="!isFullscreen" class="top-header">
        <span class="top-header-title">融资业务-材料复核</span>
        <div class="top-header-actions">
          <a-button size="small" type="primary">智能要素识别</a-button>
          <a-button size="small">暂存</a-button>
          <a-button size="small" @click="handleSubmitAndUpload">提交并上传文件</a-button>
        </div>
      </div>
      <!-- 第二行头部：基本信息折叠面板 -->
      <a-collapse
        v-if="!isFullscreen"
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
          :files="files"
          :file-info-list="fileInfoList"
          :active-file-index="activeFileIndex"
          :total-pages="totalPages"
          :current-page="currentPage"
          :analysis-documents="analysisDocuments"
          @page-click="goToPage"
          @file-tab-click="handleFileTabClick"
          @first-page="goToFirstPage"
          @prev-page="goToPrevPage"
          @next-page="goToNextPage"
          @last-page="goToLastPage"
        />

        <!-- 右侧主内容区 -->
        <div ref="container" :style="containerStyle">
          <!-- 顶部文件名 -->
          <div :style="headerStyle">
            文件名称：<span style="color: #ff4d4f">{{ currentFileName }}</span>
          </div>

          <!-- PDF 画布 -->
          <p-d-f-canvas
            :files="files"
            :file-info-list="fileInfoList"
            :total-pages="totalPages"
            :current-page="currentPage"
            :scale="scale"
            :preview-scale="previewScale"
            :rotation="rotation"
            :view-mode="viewMode"
            @all-documents-loaded="handleAllDocumentsLoaded"
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
        <analysis-panel
          v-if="files.length > 0 && !isFullscreen"
          @documents-change="handleDocumentsChange"
        />
      </div>
    </template>

    <!-- 拆分配置弹窗 -->
    <split-dialog
      :visible="splitDialogVisible"
      :num-pages="activeFilePageCount"
      :file="activeFile"
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
      infoExpanded: false,
      previewScale: null,
      isFullscreen: false,
      analysisDocuments: [],
    };
  },
  computed: {
    currentFileName() {
      const info = this.fileInfoList[this.activeFileIndex];
      return info ? info.name : (this.files[0] && this.files[0].name) || "";
    },
    activeFile() {
      const info = this.fileInfoList[this.activeFileIndex];
      return info ? info.file : this.files[0] || null;
    },
    activeFilePageCount() {
      const info = this.fileInfoList[this.activeFileIndex];
      return info ? info.pageCount : 0;
    },
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
  mounted() {
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
  },
  beforeDestroy() {
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
  },
  methods: {
    onFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
    },
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
          this.viewMode === "double" && this.currentPage < this.totalPages;
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
          this.viewMode === "double" && this.currentPage < this.totalPages;
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
    handleDocumentsChange(documents) {
      this.analysisDocuments = documents;
    },
    handleSplitConfirm(splits) {
      console.log("拆分方案:", splits);
      this.splitDialogVisible = false;
      this.$message.success(`已生成 ${splits.length} 个拆分段落`);
    },
    handleSubmitAndUpload() {
      const documents = this.analysisDocuments;

      // A. 页码校验
      // A1. 检查所有页码均已填写
      const hasEmptyPage = documents.some(
        (doc) => doc.startPage == null || doc.endPage == null,
      );
      if (hasEmptyPage) {
        this.$message.warning("部分页码尚未填写，请调整");
        return;
      }

      // A2. 检查所有页码均在[1, totalPages]范围内
      const outOfRange = documents.some(
        (doc) =>
          doc.startPage < 1 ||
          doc.endPage > this.totalPages ||
          doc.startPage > doc.endPage,
      );
      if (outOfRange) {
        this.$message.warning("页码超过实际文件页码范围，请调整");
        return;
      }

      // A3. 检查页码范围是否有重叠
      const overlaps = [];
      for (let i = 0; i < documents.length; i++) {
        for (let j = i + 1; j < documents.length; j++) {
          const a = documents[i];
          const b = documents[j];
          if (a.startPage <= b.endPage && b.startPage <= a.endPage) {
            overlaps.push(
              `${a.startPage}-${a.endPage}、${b.startPage}-${b.endPage}`,
            );
          }
        }
      }
      if (overlaps.length > 0) {
        this.$message.warning(
          `${overlaps.join("，")}的页码范围有重复，请调整`,
        );
        return;
      }

      // B. 文档类型校验
      const hasEmptyDocType = documents.some((doc) => !doc.docType);
      if (hasEmptyDocType) {
        this.$message.warning("部分文档类型尚未选择，请调整");
        return;
      }

      // C. 文档要素校验
      const emptyFieldDetails = [];
      documents.forEach((doc) => {
        if (doc.fields && doc.fields.length > 0) {
          const emptyLabels = doc.fields
            .filter((field) => !field.value && field.value !== 0)
            .map((field) => field.label);
          if (emptyLabels.length > 0) {
            emptyFieldDetails.push({
              docType: doc.docType,
              startPage: doc.startPage,
              endPage: doc.endPage,
              labels: emptyLabels,
            });
          }
        }
      });
      if (emptyFieldDetails.length > 0) {
        const h = this.$createElement;
        const listItems = emptyFieldDetails.map((item) =>
          h("div", { style: { marginBottom: "4px" } }, [
            `${item.docType}(${item.startPage}-${item.endPage})：${item.labels.join("、")}`,
          ]),
        );
        this.$confirm({
          title: "存在以下文档类型的要素尚未填写补全，是否确认继续提交?",
          content: h("div", { style: { marginTop: "8px" } }, listItems),
          okText: "继续",
          cancelText: "取消",
          onOk: () => {
            this.doSubmit();
          },
        });
        return;
      }

      this.doSubmit();
    },
    doSubmit() {
      this.$message.success("提交成功");
      console.log("提交数据:", this.analysisDocuments);
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
