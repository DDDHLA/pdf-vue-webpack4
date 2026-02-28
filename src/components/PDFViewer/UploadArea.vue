<template>
  <div :style="containerStyle">
    <a-upload-dragger
      :before-upload="handleBeforeUpload"
      :show-upload-list="false"
      accept=".pdf"
      multiple
      :style="uploadStyle"
    >
      <p class="ant-upload-drag-icon">
        <a-icon type="inbox" :style="{ fontSize: '48px', color: '#1890ff' }" />
      </p>
      <p class="ant-upload-text" :style="{ fontSize: '16px', fontWeight: 500 }">
        点击或拖拽上传PDF文件
      </p>
      <p class="ant-upload-hint" :style="{ fontSize: '14px', color: '#999' }">
        支持选择多个PDF文件
      </p>
    </a-upload-dragger>

    <!-- 已选文件列表 -->
    <div v-if="selectedFiles.length > 0" :style="fileListStyle">
      <div :style="fileListHeaderStyle">
        已选择 {{ selectedFiles.length }} 个文件
      </div>
      <div
        v-for="(file, index) in selectedFiles"
        :key="index"
        :style="fileItemStyle"
      >
        <a-icon
          type="file-pdf"
          :style="{ color: '#ff4d4f', marginRight: '8px', fontSize: '16px' }"
        />
        <span :style="fileNameStyle">{{ file.name }}</span>
        <span :style="fileSizeStyle">{{ formatFileSize(file.size) }}</span>
        <a-icon
          type="delete"
          :style="{ cursor: 'pointer', color: '#999' }"
          @click="removeFile(index)"
        />
      </div>
      <div :style="fileListFooterStyle">
        <a-button size="small" @click="clearFiles">清空</a-button>
        <a-button size="small" type="primary" @click="confirmUpload"
          >确认上传</a-button
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "UploadArea",
  data() {
    return {
      selectedFiles: [],
    };
  },
  computed: {
    containerStyle() {
      return {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        gap: "20px",
      };
    },
    uploadStyle() {
      return {
        width: "400px",
        padding: "60px 40px",
      };
    },
    fileListStyle() {
      return {
        width: "500px",
        background: "#fff",
        borderRadius: "4px",
        border: "1px solid #e0e0e0",
        overflow: "hidden",
      };
    },
    fileListHeaderStyle() {
      return {
        padding: "10px 16px",
        fontSize: "14px",
        fontWeight: 500,
        color: "#333",
        borderBottom: "1px solid #f0f0f0",
        background: "#fafafa",
      };
    },
    fileItemStyle() {
      return {
        display: "flex",
        alignItems: "center",
        padding: "8px 16px",
        borderBottom: "1px solid #f0f0f0",
        fontSize: "13px",
      };
    },
    fileNameStyle() {
      return {
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: "#333",
      };
    },
    fileSizeStyle() {
      return {
        color: "#999",
        marginRight: "12px",
        flexShrink: 0,
        fontSize: "12px",
      };
    },
    fileListFooterStyle() {
      return {
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
        padding: "10px 16px",
        background: "#fafafa",
      };
    },
  },
  methods: {
    handleBeforeUpload(file) {
      if (file.type === "application/pdf") {
        this.selectedFiles.push(file);
      }
      return false;
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },
    clearFiles() {
      this.selectedFiles = [];
    },
    confirmUpload() {
      if (this.selectedFiles.length > 0) {
        this.$emit("files-upload", [...this.selectedFiles]);
      }
    },
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    },
  },
};
</script>
