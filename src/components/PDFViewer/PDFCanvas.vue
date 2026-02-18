<template>
  <div v-if="file" :style="containerStyle">
    <div :style="contentStyle">
      <!-- 滚动模式：渲染所有页面 -->
      <div v-if="viewMode === 'scroll'" :style="scrollContainerStyle">
        <div
          v-for="page in numPages"
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
          v-if="viewMode === 'double' && currentPage < numPages"
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
    file: {
      type: [File, Object],
      default: null,
    },
    numPages: {
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
  },
  data() {
    return {
      pdfDocument: null,
      pageRendered: {},
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
    file: {
      immediate: true,
      handler(newFile) {
        if (newFile) {
          this.loadPDF();
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
        marginBottom: page === this.numPages ? 0 : "20px",
      };
    },
    async loadPDF() {
      try {
        if (!this.file) {
          console.error("No file provided");
          return;
        }

        // 检查文件类型
        console.log(
          "Loading PDF, file type:",
          11111,
          this.file.constructor.name,
          22222,
          this.file,
        );

        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
          try {
            const typedArray = new Uint8Array(e.target.result);
            this.pdfDocument = await pdfjsLib.getDocument(typedArray).promise;
            this.$emit("document-load-success", {
              numPages: this.pdfDocument.numPages,
            });
            this.$nextTick(() => {
              this.renderCurrentPages();
            });
          } catch (err) {
            console.error("Error parsing PDF:", err);
          }
        };
        fileReader.onerror = (error) => {
          console.error("FileReader error:", error);
        };
        fileReader.readAsArrayBuffer(this.file);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    },
    async renderCurrentPages() {
      if (!this.pdfDocument) return;

      if (this.viewMode === "scroll") {
        // 滚动模式：渲染所有页面
        for (let i = 1; i <= this.pdfDocument.numPages; i++) {
          await this.renderPage(i, `canvas-${i}`);
        }
      } else {
        // 翻页模式：渲染当前页
        await this.renderPage(this.currentPage, "canvas-current");

        // 双页模式：渲染下一页
        if (
          this.viewMode === "double" &&
          this.currentPage < this.pdfDocument.numPages
        ) {
          await this.renderPage(this.currentPage + 1, "canvas-next");
        }
      }
    },
    async renderPage(pageNum, canvasRef) {
      if (!this.pdfDocument) return;

      try {
        const page = await this.pdfDocument.getPage(pageNum);

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
        const viewport = page.getViewport({
          scale: this.scale * devicePixelRatio,
          rotation: this.rotation,
        });

        // 设置 canvas 实际尺寸（高分辨率）
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // 设置 canvas 显示尺寸
        canvas.style.width = viewport.width / devicePixelRatio + "px";
        canvas.style.height = viewport.height / devicePixelRatio + "px";

        // 首次渲染时发送页面尺寸
        if (pageNum === 1 && !this.pageRendered[1]) {
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
        this.$set(this.pageRendered, pageNum, true);
      } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
    },
  },
  beforeDestroy() {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
    }
  },
};
</script>
