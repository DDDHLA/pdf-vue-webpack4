import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Webpack 4 兼容方案：Worker 文件由 CopyWebpackPlugin 自动从 node_modules 复制到输出根目录
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export function usePDFViewer() {
  return {
    data() {
      return {
        file: null,
        numPages: 0,
        currentPage: 1,
        scale: 1.0,
        rotation: 0,
        viewMode: "single", // 'single' | 'double' | 'scroll'
        sidebarVisible: true,
        pageDimensions: null,
      };
    },
    methods: {
      // 示例：从接口获取并加载 PDF
      // async loadPDFFromApi() {
      //   try {
      //     const response = await axios.get("/api/pdf/download", {
      //       responseType: "blob", // 必须指定为 blob
      //     });

      //     // 将 Blob 转换为 File 对象（File 是 Blob 的子类，增加了 name 属性）
      //     const file = new File([response.data], "document.pdf", {
      //       type: "application/pdf",
      //     });

      //     // 调用你 hook 中的方法
      //     this.handleFileUpload(file);
      //   } catch (error) {
      //     console.error("加载远程文件失败", error);
      //   }
      // },
      // 文件上传处理
      handleFileUpload(uploadedFile) {
        this.file = uploadedFile;
        this.currentPage = 1;
        this.scale = 1.0;
        this.rotation = 0;
      },

      // 文档加载完成
      onDocumentLoadSuccess(pdf) {
        this.numPages = pdf.numPages;
        this.currentPage = 1;
      },

      // 页面导航
      goToPage(page) {
        if (page >= 1 && page <= this.numPages) {
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
        this.currentPage = Math.min(this.currentPage + 1, this.numPages);
      },

      goToLastPage() {
        this.currentPage = this.numPages;
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

      // 下载 PDF
      downloadPDF() {
        if (this.file) {
          const url = URL.createObjectURL(this.file);
          const a = document.createElement("a");
          a.href = url;
          a.download = this.file.name;
          a.click();
          URL.revokeObjectURL(url);
        }
      },

      // 下载 Word (提取文本)
      async downloadWord() {
        if (!this.file) return;

        try {
          // 读取文件内容
          const arrayBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(this.file);
          });

          // 加载 PDF
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

          let docContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
              <meta charset='utf-8'>
              <title>${this.file.name}</title>
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

            // 简单的文本拼接，尝试保留一些结构
            // 这里的 textContent.items 包含 str (文本), transform (位置) 等信息
            // 简单处理：直接拼接字符串，每项之间加空格，最后加换行
            const pageText = textContent.items
              .map((item) => item.str)
              .join(" "); // 或者尝试根据 y 坐标换行，这里先简单处理

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
          const fileName = this.file.name.replace(/\.pdf$/i, "") + ".doc";

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
