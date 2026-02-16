<template>
  <div v-if="file && numPages > 0" :style="panelStyle">
    <!-- 顶部标题 -->
    <div :style="headerStyle">缩略图</div>

    <!-- 中间缩略图列表 -->
    <div :style="listStyle">
      <div
        v-for="page in numPages"
        :key="page"
        :style="getThumbnailStyle(page)"
        @click="$emit('page-click', page)"
        @mouseenter="handleMouseEnter($event, page)"
        @mouseleave="handleMouseLeave($event, page)"
      >
        <div :style="thumbnailContentStyle">
          <div
            v-if="!thumbnailRendered[page]"
            :style="{ padding: '60px 20px', textAlign: 'center' }"
          >
            <a-spin size="small" />
          </div>
          <canvas v-show="thumbnailRendered[page]" :ref="'thumbnail-' + page" />
        </div>
        <div :style="pageNumberStyle">第{{ page }}页</div>
      </div>
    </div>

    <!-- 底部分页导航 -->
    <div :style="footerStyle">
      <a-button
        type="text"
        size="small"
        :disabled="currentPage === 1"
        @click="$emit('first-page')"
      >
        <a-icon
          type="step-backward"
          :style="{ fontSize: '12px', color: '#666' }"
        />
      </a-button>
      <a-button
        type="text"
        size="small"
        :disabled="currentPage === 1"
        @click="$emit('prev-page')"
      >
        <a-icon type="left" :style="{ fontSize: '12px', color: '#666' }" />
      </a-button>
      <div :style="pageIndicatorStyle">{{ currentPage }} / {{ numPages }}</div>
      <a-button
        type="text"
        size="small"
        :disabled="currentPage === numPages"
        @click="$emit('next-page')"
      >
        <a-icon type="right" :style="{ fontSize: '12px', color: '#666' }" />
      </a-button>
      <a-button
        type="text"
        size="small"
        :disabled="currentPage === numPages"
        @click="$emit('last-page')"
      >
        <a-icon
          type="step-forward"
          :style="{ fontSize: '12px', color: '#666' }"
        />
      </a-button>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default {
  name: "ThumbnailPanel",
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
  },
  data() {
    return {
      pdfDocument: null,
      thumbnailRendered: {},
    };
  },
  computed: {
    panelStyle() {
      return {
        width: "250px",
        minWidth: "250px",
        background: "white",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      };
    },
    headerStyle() {
      return {
        height: "48px",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #f0f0f0",
        fontSize: "16px",
        fontWeight: 500,
        color: "#333",
        flexShrink: 0,
      };
    },
    listStyle() {
      return {
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      };
    },
    thumbnailContentStyle() {
      return {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
      };
    },
    footerStyle() {
      return {
        height: "40px",
        padding: "0 12px",
        borderTop: "1px solid #e0e0e0",
        background: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        flexShrink: 0,
      };
    },
    pageNumberStyle() {
      return {
        textAlign: "center",
        padding: "8px",
        background: "#fafafa",
        fontSize: "12px",
        color: "#666",
        flexShrink: 0,
      };
    },
    pageIndicatorStyle() {
      return {
        margin: "0 4px",
        padding: "2px 10px",
        background: "white",
        border: "1px solid #d9d9d9",
        borderRadius: "4px",
        fontSize: "12px",
        minWidth: "50px",
        textAlign: "center",
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
  },
  methods: {
    getThumbnailStyle(page) {
      const isActive = this.currentPage === page;
      return {
        cursor: "pointer",
        border: isActive ? "2px solid #ff4d4f" : "2px solid #e0e0e0",
        borderRadius: "4px",
        overflow: "hidden",
        transition: "all 0.2s",
        background: "white",
        marginBottom: "4px",
        boxShadow: isActive ? "0 2px 8px rgba(255, 77, 79, 0.3)" : "none",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      };
    },
    handleMouseEnter(event, page) {
      if (this.currentPage !== page) {
        event.currentTarget.style.borderColor = "#1890ff";
        event.currentTarget.style.boxShadow =
          "0 2px 8px rgba(24, 144, 255, 0.2)";
      }
    },
    handleMouseLeave(event, page) {
      if (this.currentPage !== page) {
        event.currentTarget.style.borderColor = "#e0e0e0";
        event.currentTarget.style.boxShadow = "none";
      }
    },
    async loadPDF() {
      try {
        if (!this.file) {
          console.error("No file provided");
          return;
        }

        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
          try {
            const typedArray = new Uint8Array(e.target.result);
            this.pdfDocument = await pdfjsLib.getDocument(typedArray).promise;
            // 等待 DOM 更新后再渲染
            await this.$nextTick();
            // 延迟一点确保所有 canvas 元素都已创建
            setTimeout(() => {
              this.renderAllThumbnails();
            }, 100);
          } catch (err) {
            console.error("Error parsing PDF for thumbnails:", err);
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
    async renderAllThumbnails() {
      if (!this.pdfDocument) return;

      // 逐个渲染缩略图
      for (let i = 1; i <= this.pdfDocument.numPages; i++) {
        await this.renderThumbnail(i);
      }
    },
    async renderThumbnail(pageNum) {
      if (!this.pdfDocument) return;

      try {
        const page = await this.pdfDocument.getPage(pageNum);

        // 获取 canvas 元素
        const refName = "thumbnail-" + pageNum;
        let canvas = this.$refs[refName];

        // 如果是数组，取第一个元素
        if (Array.isArray(canvas)) {
          canvas = canvas[0];
        }

        if (!canvas) {
          console.warn(`Canvas not found for thumbnail ${pageNum}`);
          return;
        }

        const context = canvas.getContext("2d");

        // 考虑设备像素比，提高渲染质量
        const devicePixelRatio = window.devicePixelRatio || 1;
        const containerWidth = 200;
        const viewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth / viewport.width) * devicePixelRatio;
        const scaledViewport = page.getViewport({ scale });

        // 设置 canvas 实际尺寸（高分辨率）
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // 设置 canvas 显示尺寸
        canvas.style.width = containerWidth + "px";
        canvas.style.height = scaledViewport.height / devicePixelRatio + "px";

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
        this.$set(this.thumbnailRendered, pageNum, true);
      } catch (error) {
        console.error(`Error rendering thumbnail ${pageNum}:`, error);
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

<style scoped>
/* 移除所有 canvas 样式限制，让它保持原始渲染尺寸 */
canvas {
  display: block;
}
</style>
