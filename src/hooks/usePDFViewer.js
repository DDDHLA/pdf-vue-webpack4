import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Webpack 4 兼容方案：Worker 文件由 CopyWebpackPlugin 自动从 node_modules 复制到输出根目录
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export function usePDFViewer() {
  return {
    data() {
      return {
        files: [],
        fileInfoList: [],
        totalPages: 0,
        currentPage: 1,
        activeFileIndex: 0,
        scale: 1.0,
        rotation: 0,
        viewMode: "single", // 'single' | 'double' | 'scroll'
        sidebarVisible: true,
        pageDimensions: null,
      };
    },
    watch: {
      currentPage(newPage) {
        // 翻页跨文件时自动同步 activeFileIndex
        const resolved = this.resolveGlobalPage(newPage);
        if (resolved && resolved.fileIndex !== this.activeFileIndex) {
          this.activeFileIndex = resolved.fileIndex;
        }
      },
    },
    methods: {
      // 多文件上传处理
      handleFilesUpload(uploadedFiles) {
        this.files = uploadedFiles;
        this.currentPage = 1;
        this.scale = 1.0;
        this.rotation = 0;
        this.activeFileIndex = 0;
        this.fileInfoList = [];
        this.totalPages = 0;
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
              fileInfo: info,
            };
          }
        }
        return null;
      },

      // 文件标签点击：跳转到指定文件首页
      handleFileTabClick(fileIndex) {
        this.activeFileIndex = fileIndex;
        const info = this.fileInfoList[fileIndex];
        if (info) {
          this.currentPage = info.globalStartPage;
        }
      },

      // 所有文档加载完成
      handleAllDocumentsLoaded({ totalPages, fileInfoList }) {
        this.totalPages = totalPages;
        this.fileInfoList = fileInfoList;
        this.currentPage = 1;
        this.activeFileIndex = 0;
      },

      // 文档加载完成（兼容）
      onDocumentLoadSuccess(pdf) {
        this.totalPages = pdf.numPages;
        this.currentPage = 1;
      },

      // 页面导航
      goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
        }
      },

      goToFirstPage() {
        this.currentPage = 1;
      },

      goToPrevPage() {
        this.currentPage = Math.max(this.currentPage - 1, 1);
      },

      goToNextPage() {
        this.currentPage = Math.min(this.currentPage + 1, this.totalPages);
      },

      goToLastPage() {
        this.currentPage = this.totalPages;
      },

      // 缩放控制
      zoomIn() {
        this.scale = Math.min(this.scale + 0.2, 3.0);
      },

      zoomOut() {
        this.scale = Math.max(this.scale - 0.2, 0.3);
      },

      resetZoom() {
        this.scale = 1.0;
      },

      setCustomScale(newScale) {
        this.scale = newScale;
      },

      // 适应控制
      fitWidth(containerWidth, pageWidth) {
        if (containerWidth && pageWidth) {
          this.scale = containerWidth / pageWidth;
        }
      },

      fitHeight(containerHeight, pageHeight) {
        if (containerHeight && pageHeight) {
          this.scale = containerHeight / pageHeight;
        }
      },

      fitPage(containerWidth, containerHeight, pageWidth, pageHeight) {
        if (containerWidth && containerHeight && pageWidth && pageHeight) {
          const scaleX = containerWidth / pageWidth;
          const scaleY = containerHeight / pageHeight;
          this.scale = Math.min(scaleX, scaleY);
        }
      },

      // 旋转控制
      rotatePage() {
        this.rotation = (this.rotation + 90) % 360;
      },

      // 下载 PDF（使用当前活跃文件）
      downloadPDF() {
        const activeFile =
          this.fileInfoList[this.activeFileIndex]?.file || this.files[0];
        if (activeFile) {
          const url = URL.createObjectURL(activeFile);
          const a = document.createElement("a");
          a.href = url;
          a.download = activeFile.name;
          a.click();
          URL.revokeObjectURL(url);
        }
      },

      // 下载 Word (提取文本，使用当前活跃文件)
      async downloadWord() {
        const activeFile =
          this.fileInfoList[this.activeFileIndex]?.file || this.files[0];
        if (!activeFile) return;

        try {
          // 读取文件内容
          const arrayBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(activeFile);
          });

          // 加载 PDF
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

          let docContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
              <meta charset='utf-8'>
              <title>${activeFile.name}</title>
              <style>
                body { font-family: 'SimSun', '宋体', sans-serif; }
                p { margin-bottom: 10px; line-height: 1.5; }
                .page-break { page-break-after: always; }
              </style>
            </head>
            <body>
          `;

          // 遍历页面提取文本
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
              .map((item) => item.str)
              .join(" ");

            docContent += `
              <div class="page">
                <p>${pageText || "[空页面或无法提取文本]"}</p>
              </div>
              <br class="page-break" />
            `;
          }

          docContent += "</body></html>";

          // 创建 Blob 并下载
          const blob = new Blob([docContent], { type: "application/msword" });
          const url = URL.createObjectURL(blob);
          const fileName =
            activeFile.name.replace(/\.pdf$/i, "") + ".doc";

          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("导出 Word 失败:", error);
          alert("导出 Word 失败: " + (error.message || "未知错误"));
        }
      },
    },
  };
}
