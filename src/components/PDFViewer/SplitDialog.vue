<template>
  <a-modal
    :visible="visible"
    title="PDF手工拆分"
    :width="700"
    @cancel="handleCancel"
    @ok="handleConfirm"
  >
    <!-- PDF页面预览区域 -->
    <div class="preview-container">
      <div class="page-preview-wrapper">
        <div v-for="page in numPages" :key="page" class="page-wrapper">
          <div class="page-item">
            <div class="page-thumbnail">
              <canvas :ref="`thumbnail-${page}`" class="thumbnail-canvas" />
            </div>
            <div class="page-label">第{{ page }}页</div>
          </div>
          <!-- 在拆分点显示分割线和剪刀图标 -->
          <div v-if="isSplitPoint(page)" class="split-indicator">
            <div class="split-line"></div>
            <div class="split-icon">
              <a-icon type="scissor" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="splits"
      :pagination="false"
      size="small"
      bordered
    >
      <template slot="range" slot-scope="text, record">
        <div
          style="
            display: flex;
            align-items: center;
            gap: 4px;
            justify-content: center;
          "
        >
          <a-input-number
            :value="record.startPage"
            :min="1"
            :max="numPages"
            size="small"
            style="width: 70px"
            @change="(value) => handleStartPageChange(record, value)"
          />
          <span>-</span>
          <a-input-number
            :value="record.endPage"
            :min="record.startPage"
            :max="numPages"
            size="small"
            style="width: 70px"
            @change="(value) => handleEndPageChange(record, value)"
          />
        </div>
      </template>
      <template slot="docType" slot-scope="text, record">
        <a-select
          :value="record.docType"
          size="small"
          style="width: 120px"
          @change="(value) => handleDocTypeChange(record, value)"
        >
          <a-select-option value="合同">合同</a-select-option>
          <a-select-option value="发票">发票</a-select-option>
          <a-select-option value="报告">报告</a-select-option>
          <a-select-option value="证明">证明</a-select-option>
          <a-select-option value="其他">其他</a-select-option>
        </a-select>
      </template>
      <template slot="pageCount" slot-scope="text, record">
        {{ record.endPage - record.startPage + 1 }}
      </template>
      <template slot="action" slot-scope="text, record">
        <a-button
          type="link"
          size="small"
          :disabled="splits.length <= 1"
          @click="handleDelete(record)"
        >
          <a-icon type="delete" style="color: #ff4d4f" />
        </a-button>
      </template>
    </a-table>
    <a-button
      type="dashed"
      block
      icon="plus"
      style="margin-top: 16px"
      @click="handleAdd"
    >
      添加拆分
    </a-button>
  </a-modal>
</template>

<script>
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

export default {
  name: "SplitDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    numPages: {
      type: Number,
      required: true,
    },
    file: {
      type: [File, Object],
      default: null,
    },
  },
  data() {
    return {
      splits: [],
      pdfDocument: null,
      columns: [
        {
          title: "序号",
          dataIndex: "id",
          key: "id",
          width: 80,
          align: "center",
        },
        {
          title: "范围",
          dataIndex: "range",
          key: "range",
          scopedSlots: { customRender: "range" },
          align: "center",
        },
        {
          title: "文档类型",
          dataIndex: "docType",
          key: "docType",
          scopedSlots: { customRender: "docType" },
          width: 140,
          align: "center",
        },
        {
          title: "页数",
          dataIndex: "pageCount",
          key: "pageCount",
          scopedSlots: { customRender: "pageCount" },
          width: 100,
          align: "center",
        },
        {
          title: "操作",
          key: "action",
          scopedSlots: { customRender: "action" },
          width: 100,
          align: "center",
        },
      ],
    };
  },
  watch: {
    visible(newVal) {
      if (newVal && this.numPages > 0) {
        this.splits = this.generateDefaultSplits(this.numPages);
        console.log("Generated splits:", this.splits);
        this.$nextTick(() => {
          this.loadPDFThumbnails();
        });
      }
    },
  },
  methods: {
    // 加载PDF缩略图
    async loadPDFThumbnails() {
      if (!this.file) return;

      try {
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
          try {
            const typedArray = new Uint8Array(e.target.result);
            this.pdfDocument = await pdfjsLib.getDocument(typedArray).promise;

            // 渲染所有缩略图
            for (let i = 1; i <= this.numPages; i++) {
              await this.renderThumbnail(i);
            }
          } catch (err) {
            console.error("Error loading PDF for thumbnails:", err);
          }
        };
        fileReader.readAsArrayBuffer(this.file);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    },

    // 渲染单个缩略图
    async renderThumbnail(pageNum) {
      if (!this.pdfDocument) return;

      try {
        const page = await this.pdfDocument.getPage(pageNum);
        const canvas = this.$refs[`thumbnail-${pageNum}`];

        if (!canvas || !canvas[0]) return;
        const canvasEl = canvas[0];
        const context = canvasEl.getContext("2d");

        // 设置缩略图尺寸（固定宽度120px）
        const viewport = page.getViewport({ scale: 1 });
        const scale = 120 / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvasEl.width = scaledViewport.width;
        canvasEl.height = scaledViewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error(`Error rendering thumbnail ${pageNum}:`, error);
      }
    },

    // 判断某页后面是否是拆分点
    isSplitPoint(page) {
      // 如果这一页是某个拆分段落的结束页，且不是最后一页，则显示剪刀
      return this.splits.some(
        (split) => split.endPage === page && page < this.numPages,
      );
    },

    // 生成随机拆分方案
    generateDefaultSplits(totalPages) {
      const numSplits = Math.floor(Math.random() * 3) + 3; // 3-5个段落
      const splits = [];
      let currentStart = 1;

      for (let i = 0; i < numSplits; i++) {
        const remainingPages = totalPages - currentStart + 1;
        if (remainingPages <= 0) break;

        const minPages = Math.max(
          1,
          Math.floor(remainingPages / (numSplits - i)),
        );
        const maxPages = Math.max(
          minPages,
          Math.floor((remainingPages / (numSplits - i)) * 1.5),
        );
        const pages = Math.min(
          Math.floor(Math.random() * (maxPages - minPages + 1)) + minPages,
          remainingPages,
        );

        splits.push({
          id: i + 1,
          startPage: currentStart,
          endPage: currentStart + pages - 1,
          docType: "其他",
        });

        currentStart += pages;
        if (currentStart > totalPages) break;
      }

      return splits;
    },

    // 处理起始页变化
    handleStartPageChange(record, value) {
      const index = this.splits.findIndex((s) => s.id === record.id);
      if (index !== -1) {
        this.$set(this.splits[index], "startPage", value);
        // 确保结束页不小于起始页
        if (this.splits[index].endPage < value) {
          this.$set(this.splits[index], "endPage", value);
        }
      }
    },

    // 处理结束页变化
    handleEndPageChange(record, value) {
      const index = this.splits.findIndex((s) => s.id === record.id);
      if (index !== -1) {
        this.$set(this.splits[index], "endPage", value);
      }
    },

    // 处理文档类型变化
    handleDocTypeChange(record, value) {
      const index = this.splits.findIndex((s) => s.id === record.id);
      if (index !== -1) {
        this.$set(this.splits[index], "docType", value);
      }
    },

    // 添加新的拆分
    handleAdd() {
      const lastSplit = this.splits[this.splits.length - 1];
      const newStartPage = lastSplit ? lastSplit.endPage + 1 : 1;

      if (newStartPage <= this.numPages) {
        this.splits.push({
          id: this.splits.length + 1,
          startPage: newStartPage,
          endPage: this.numPages,
          docType: "其他",
        });
      } else {
        this.$message.warning("已达到最大页数，无法添加更多拆分");
      }
    },

    // 删除拆分
    handleDelete(record) {
      if (this.splits.length <= 1) {
        this.$message.warning("至少保留一个拆分段落");
        return;
      }
      this.splits = this.splits.filter((s) => s.id !== record.id);
      // 重新编号
      this.splits.forEach((split, index) => {
        split.id = index + 1;
      });
    },

    // 取消
    handleCancel() {
      this.$emit("close");
    },

    // 确认
    handleConfirm() {
      // 数据验证
      for (let i = 0; i < this.splits.length; i++) {
        const split = this.splits[i];
        if (split.startPage > split.endPage) {
          this.$message.error(`第${i + 1}个拆分段落的起始页不能大于结束页`);
          return;
        }
      }

      this.$emit("confirm", this.splits);
    },
  },
};
</script>

<style scoped>
.preview-container {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.page-preview-wrapper {
  display: flex;
  overflow-x: auto;
  gap: 0;
  padding: 8px 0;
  align-items: center;
}

.page-preview-wrapper::-webkit-scrollbar {
  height: 8px;
}

.page-preview-wrapper::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}

.page-preview-wrapper::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

.page-wrapper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.page-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  margin: 0 8px;
}

.page-thumbnail {
  width: 120px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

.page-label {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.split-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  height: 100%;
  margin: 0 -8px;
}

.split-line {
  width: 2px;
  height: 120px;
  margin: 0 8px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 40%,
    #1890ff 40%,
    #1890ff 60%,
    transparent 60%,
    transparent 100%
  );
  background-size: 2px 10px;
  background-repeat: repeat-y;
  position: relative;
}

.split-line::before,
.split-line::after {
  content: "";
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #1890ff;
  border-radius: 50%;
}

.split-line::before {
  top: 38%;
}

.split-line::after {
  bottom: 38%;
}

.split-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  background: white;
  border: 2px solid #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #1890ff;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
}
</style>
