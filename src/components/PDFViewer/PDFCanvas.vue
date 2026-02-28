<template>
  <div v-if="files.length > 0" :style="containerStyle">
    <div :style="contentStyle">
      <!-- 滚动模式：渲染所有页面 -->
      <div v-if="viewMode === 'scroll'" :style="scrollContainerStyle">
        <div
          v-for="page in totalPages"
          :key="page"
          :style="getPageWrapperStyle(page)"
        >
          <a-spin v-if="!pageRendered[page]" :tip="`渲染第 ${page} 页...`" />
          <canvas
            :ref="`canvas-${page}`"
            :style="{ display: pageRendered[page] ? 'block' : 'none' }"
          />
        </div>
      </div>

      <!-- 翻页模式：渲染 1 或 2 页 -->
      <div v-else :style="pageContainerStyle">
        <!-- 第一页 (当前页) -->
        <div :style="pageWrapperStyle">
          <a-spin v-if="!pageRendered[currentPage]" tip="渲染中..." />
          <canvas
            ref="canvas-current"
            :style="{ display: pageRendered[currentPage] ? 'block' : 'none' }"
          />
        </div>

        <!-- 第二页 (如果是双页模式且不是最后一页) -->
        <div
          v-if="viewMode === 'double' && currentPage < totalPages"
          :style="pageWrapperStyle"
        >
          <a-spin v-if="!pageRendered[currentPage + 1]" tip="渲染中..." />
          <canvas
            ref="canvas-next"
            :style="{
              display: pageRendered[currentPage + 1] ? 'block' : 'none',
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default {
  name: "PDFCanvas",
  props: {
    files: {
      type: Array,
      default: () => [],
    },
    fileInfoList: {
      type: Array,
      default: () => [],
    },
    totalPages: {
      type: Number,
      required: true,
    },
    currentPage: {
      type: Number,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
    rotation: {
      type: Number,
      required: true,
    },
    viewMode: {
      type: String,
      required: true,
    },
    previewScale: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      pdfDocuments: {},
      pageRendered: {},
      renderedScale: 1,
    };
  },
  computed: {
    containerStyle() {
      return {
        flex: 1,
        overflow: "auto",
        display: "flex",
        background: "#e8e8e8",
        position: "relative",
      };
    },
    contentStyle() {
      return {
        margin: "auto",
        padding: "40px",
        minWidth: "min-content",
        minHeight: "min-content",
      };
    },
    scrollContainerStyle() {
      return {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "center",
      };
    },
    pageContainerStyle() {
      return {
        display: "flex",
        flexDirection: "row",
        gap: "20px",
        alignItems: "center",
      };
    },
    pageWrapperStyle() {
      return {
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      };
    },
  },
  watch: {
    files: {
      immediate: true,
      handler(newFiles) {
        if (newFiles && newFiles.length > 0) {
          this.loadAllPDFs();
        }
      },
    },
    currentPage() {
      this.$nextTick(() => {
        this.renderCurrentPages();
      });
    },
    scale() {
      this.$nextTick(() => {
        this.renderCurrentPages();
      });
    },
    previewScale(newVal) {
      if (newVal !== null) {
        this.updateCanvasPreview(newVal);
      }
    },
    rotation() {
      this.$nextTick(() => {
        this.renderCurrentPages();
      });
    },
    viewMode() {
      this.$nextTick(() => {
        this.renderCurrentPages();
      });
    },
  },
  methods: {
    getPageWrapperStyle(page) {
      return {
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        marginBottom: page === this.totalPages ? 0 : "20px",
      };
    },
    // 全局页码 → { fileIndex, localPage }
    resolveGlobalPage(globalPage) {
      for (let i = 0; i < this.fileInfoList.length; i++) {
        const info = this.fileInfoList[i];
        if (
          globalPage >= info.globalStartPage &&
          globalPage <= info.globalEndPage
        ) {
          return {
            fileIndex: i,
            localPage: globalPage - info.globalStartPage + 1,
          };
        }
      }
      return null;
    },
    // 读取文件为 ArrayBuffer
    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    },
    // 按需获取 pdfDocument（带缓存）
    async getPdfDocument(fileIndex) {
      if (this.pdfDocuments[fileIndex]) {
        return this.pdfDocuments[fileIndex];
      }
      const file = this.files[fileIndex];
      if (!file) return null;

      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const typedArray = new Uint8Array(arrayBuffer);
      const doc = await pdfjsLib.getDocument(typedArray).promise;
      this.$set(this.pdfDocuments, fileIndex, doc);
      return doc;
    },
    // 加载所有 PDF，构建 fileInfoList
    async loadAllPDFs() {
      try {
        let totalPages = 0;
        const infoList = [];

        for (let i = 0; i < this.files.length; i++) {
          const doc = await this.getPdfDocument(i);
          const pageCount = doc.numPages;
          infoList.push({
            file: this.files[i],
            name: this.files[i].name,
            pageCount,
            globalStartPage: totalPages + 1,
            globalEndPage: totalPages + pageCount,
          });
          totalPages += pageCount;
        }

        this.$emit("all-documents-loaded", {
          totalPages,
          fileInfoList: infoList,
        });

        this.$nextTick(() => {
          this.renderCurrentPages();
        });
      } catch (err) {
        console.error("Error loading PDFs:", err);
      }
    },
    // 拖动预览：只更新 canvas 的 CSS 尺寸，不重新渲染 PDF
    updateCanvasPreview(newScale) {
      const ratio = newScale / this.renderedScale;
      const dpr = window.devicePixelRatio || 1;

      const updateCanvas = (canvasRef) => {
        let canvas;
        if (Array.isArray(this.$refs[canvasRef])) {
          canvas = this.$refs[canvasRef][0];
        } else {
          canvas = this.$refs[canvasRef];
        }
        if (!canvas) return;
        canvas.style.width = (canvas.width / dpr) * ratio + "px";
        canvas.style.height = (canvas.height / dpr) * ratio + "px";
      };

      if (this.viewMode === "scroll") {
        for (let i = 1; i <= this.totalPages; i++) {
          updateCanvas(`canvas-${i}`);
        }
      } else {
        updateCanvas("canvas-current");
        if (this.viewMode === "double" && this.currentPage < this.totalPages) {
          updateCanvas("canvas-next");
        }
      }
    },
    async renderCurrentPages() {
      if (this.fileInfoList.length === 0) return;

      if (this.viewMode === "scroll") {
        for (let i = 1; i <= this.totalPages; i++) {
          await this.renderPage(i, `canvas-${i}`);
        }
      } else {
        await this.renderPage(this.currentPage, "canvas-current");

        if (this.viewMode === "double" && this.currentPage < this.totalPages) {
          await this.renderPage(this.currentPage + 1, "canvas-next");
        }
      }
    },
    async renderPage(globalPage, canvasRef) {
      // 解析全局页码
      const resolved = this.resolveGlobalPage(globalPage);
      if (!resolved) return;

      try {
        const doc = await this.getPdfDocument(resolved.fileIndex);
        if (!doc) return;

        const page = await doc.getPage(resolved.localPage);

        // 获取 canvas 元素
        let canvas;
        if (Array.isArray(this.$refs[canvasRef])) {
          canvas = this.$refs[canvasRef][0];
        } else {
          canvas = this.$refs[canvasRef];
        }

        if (!canvas) return;

        const context = canvas.getContext("2d");

        // 考虑设备像素比，提高渲染质量
        const devicePixelRatio = window.devicePixelRatio || 1;
        const targetScale = this.scale;
        const minRenderScale = 1.5 / devicePixelRatio;
        const renderScale = Math.max(targetScale, minRenderScale);
        const viewport = page.getViewport({
          scale: renderScale * devicePixelRatio,
          rotation: this.rotation,
        });

        // 设置 canvas 实际尺寸（高分辨率）
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // 设置 canvas 显示尺寸
        const cssScale = targetScale / renderScale;
        canvas.style.width =
          (viewport.width / devicePixelRatio) * cssScale + "px";
        canvas.style.height =
          (viewport.height / devicePixelRatio) * cssScale + "px";

        // 首次渲染时发送页面尺寸
        if (globalPage === 1 && !this.pageRendered[1]) {
          this.$emit("page-load-success", {
            width: page.view[2],
            height: page.view[3],
          });
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        this.$set(this.pageRendered, globalPage, true);
        this.renderedScale = renderScale;
      } catch (error) {
        console.error(`Error rendering page ${globalPage}:`, error);
      }
    },
  },
  beforeDestroy() {
    // 销毁所有缓存的 pdfDocument
    Object.values(this.pdfDocuments).forEach((doc) => {
      if (doc) doc.destroy();
    });
    this.pdfDocuments = {};
  },
};
</script>
