<template>
  <div v-if="files.length > 0 && totalPages > 0" :style="panelStyle">
    <!-- 顶部标题 -->
    <div :style="headerStyle">缩略图</div>

    <!-- 文件导航栏 -->
    <div v-if="fileInfoList.length > 1" :style="fileNavStyle">
      <div
        :style="getNavArrowStyle(activeFileIndex <= 0)"
        @click="goToPrevFile"
      >
        <a-icon type="left" :style="{ fontSize: '12px' }" />
      </div>
      <div ref="fileNavScroll" :style="fileNavScrollStyle">
        <div
          v-for="(info, index) in fileInfoList"
          :key="index"
          :ref="'fileTab-' + index"
          :style="getFileTabStyle(index)"
          :title="info.name"
          @click="handleFileTabClick(index)"
        >
          <div :style="fileTabNameStyle">{{ truncateName(info.name) }}</div>
          <div :style="fileTabPageStyle">
            {{ info.globalStartPage }}-{{ info.globalEndPage }}页
          </div>
        </div>
      </div>
      <div
        :style="getNavArrowStyle(activeFileIndex >= fileInfoList.length - 1)"
        @click="goToNextFile"
      >
        <a-icon type="right" :style="{ fontSize: '12px' }" />
      </div>
    </div>

    <!-- 中间缩略图列表（所有文件连续滚动） -->
    <div ref="thumbnailList" :style="listStyle">
      <div
        v-for="globalPage in totalPages"
        :key="globalPage"
        :ref="'thumbnailItem-' + globalPage"
        :style="getThumbnailStyle(globalPage)"
        @click="$emit('page-click', globalPage)"
        @mouseenter="handleMouseEnter($event, globalPage)"
        @mouseleave="handleMouseLeave($event, globalPage)"
      >
        <div :style="thumbnailContentStyle">
          <div
            v-if="!thumbnailRendered[globalPage]"
            :style="{ padding: '60px 20px', textAlign: 'center' }"
          >
            <a-spin size="small" />
          </div>
          <canvas
            v-show="thumbnailRendered[globalPage]"
            :ref="'thumbnail-' + globalPage"
          />
        </div>
        <div :style="pageNumberStyle">第{{ globalPage }}页</div>
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
      <div :style="pageIndicatorStyle">{{ currentPage }} / {{ totalPages }}</div>
      <a-button
        type="text"
        size="small"
        :disabled="currentPage === totalPages"
        @click="$emit('next-page')"
      >
        <a-icon type="right" :style="{ fontSize: '12px', color: '#666' }" />
      </a-button>
      <a-button
        type="text"
        size="small"
        :disabled="currentPage === totalPages"
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
    files: {
      type: Array,
      default: () => [],
    },
    fileInfoList: {
      type: Array,
      default: () => [],
    },
    activeFileIndex: {
      type: Number,
      default: 0,
    },
    totalPages: {
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
      pdfDocuments: {},
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
    fileNavStyle() {
      return {
        display: "flex",
        alignItems: "center",
        height: "44px",
        borderBottom: "1px solid #f0f0f0",
        background: "#fafafa",
        flexShrink: 0,
        padding: "0 4px",
      };
    },
    fileNavScrollStyle() {
      return {
        flex: 1,
        display: "flex",
        overflowX: "auto",
        overflowY: "hidden",
        gap: "4px",
        padding: "4px 0",
        scrollbarWidth: "none",
      };
    },
    fileTabNameStyle() {
      return {
        fontSize: "11px",
        lineHeight: "1.2",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "80px",
      };
    },
    fileTabPageStyle() {
      return {
        fontSize: "10px",
        lineHeight: "1.2",
        opacity: 0.8,
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
    fileInfoList: {
      handler(newList) {
        if (newList.length > 0) {
          this.loadAllPDFs();
        }
      },
    },
  },
  methods: {
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
    truncateName(name) {
      const nameWithoutExt = name.replace(/\.pdf$/i, "");
      if (nameWithoutExt.length > 8) {
        return nameWithoutExt.substring(0, 7) + "…";
      }
      return nameWithoutExt;
    },
    getFileTabStyle(index) {
      const isActive = index === this.activeFileIndex;
      return {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 10px",
        borderRadius: "4px",
        cursor: "pointer",
        flexShrink: 0,
        whiteSpace: "nowrap",
        background: isActive ? "#1890ff" : "transparent",
        color: isActive ? "#fff" : "#333",
        transition: "all 0.2s",
        minWidth: "60px",
      };
    },
    getNavArrowStyle(disabled) {
      return {
        width: "22px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "#ccc" : "#666",
        flexShrink: 0,
        borderRadius: "4px",
        background: "#eee",
      };
    },
    getThumbnailStyle(globalPage) {
      const isActive = this.currentPage === globalPage;
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
    handleMouseEnter(event, globalPage) {
      if (this.currentPage !== globalPage) {
        event.currentTarget.style.borderColor = "#1890ff";
        event.currentTarget.style.boxShadow =
          "0 2px 8px rgba(24, 144, 255, 0.2)";
      }
    },
    handleMouseLeave(event, globalPage) {
      if (this.currentPage !== globalPage) {
        event.currentTarget.style.borderColor = "#e0e0e0";
        event.currentTarget.style.boxShadow = "none";
      }
    },
    handleFileTabClick(fileIndex) {
      this.$emit("file-tab-click", fileIndex);
      // 滚动缩略图列表到对应文件的第一页
      const info = this.fileInfoList[fileIndex];
      if (info) {
        this.$nextTick(() => {
          this.scrollToThumbnail(info.globalStartPage);
        });
      }
      // 滚动导航栏标签
      this.$nextTick(() => {
        const tabRef = this.$refs["fileTab-" + fileIndex];
        const tab = Array.isArray(tabRef) ? tabRef[0] : tabRef;
        if (tab && this.$refs.fileNavScroll) {
          tab.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      });
    },
    scrollToThumbnail(globalPage) {
      const itemRef = this.$refs["thumbnailItem-" + globalPage];
      const item = Array.isArray(itemRef) ? itemRef[0] : itemRef;
      if (item && this.$refs.thumbnailList) {
        item.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    },
    goToNextFile() {
      if (this.activeFileIndex < this.fileInfoList.length - 1) {
        this.handleFileTabClick(this.activeFileIndex + 1);
      }
    },
    goToPrevFile() {
      if (this.activeFileIndex > 0) {
        this.handleFileTabClick(this.activeFileIndex - 1);
      }
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
    // 加载所有 PDF 并渲染全部缩略图
    async loadAllPDFs() {
      try {
        // 清除旧状态
        this.thumbnailRendered = {};

        // 依次加载每个文件并渲染缩略图
        for (let i = 0; i < this.fileInfoList.length; i++) {
          const doc = await this.getPdfDocument(i);
          if (!doc) continue;

          const info = this.fileInfoList[i];
          await this.$nextTick();

          // 渲染该文件的所有缩略图
          for (let localPage = 1; localPage <= info.pageCount; localPage++) {
            const globalPage = info.globalStartPage + localPage - 1;
            await this.renderThumbnail(doc, localPage, globalPage);
          }
        }
      } catch (error) {
        console.error("Error loading PDFs for thumbnails:", error);
      }
    },
    async renderThumbnail(pdfDocument, localPage, globalPage) {
      if (!pdfDocument) return;

      try {
        const page = await pdfDocument.getPage(localPage);

        const refName = "thumbnail-" + globalPage;
        let canvas = this.$refs[refName];

        if (Array.isArray(canvas)) {
          canvas = canvas[0];
        }

        if (!canvas) {
          console.warn(`Canvas not found for thumbnail ${globalPage}`);
          return;
        }

        const context = canvas.getContext("2d");

        const devicePixelRatio = window.devicePixelRatio || 1;
        const containerWidth = 200;
        const viewport = page.getViewport({ scale: 1 });

        const targetScale = containerWidth / viewport.width;
        const renderScale = Math.max(targetScale, 1.5 / devicePixelRatio);
        const scale = renderScale * devicePixelRatio;

        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const cssScale = targetScale / renderScale;
        canvas.style.width = containerWidth + "px";
        canvas.style.height =
          (scaledViewport.height / devicePixelRatio) * cssScale + "px";

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
        this.$set(this.thumbnailRendered, globalPage, true);
      } catch (error) {
        console.error(`Error rendering thumbnail ${globalPage}:`, error);
      }
    },
  },
  beforeDestroy() {
    Object.values(this.pdfDocuments).forEach((doc) => {
      if (doc) doc.destroy();
    });
    this.pdfDocuments = {};
  },
};
</script>

<style scoped>
canvas {
  display: block;
}
/* 隐藏文件导航栏的滚动条 */
div::-webkit-scrollbar {
  height: 0;
  width: 0;
}
</style>
