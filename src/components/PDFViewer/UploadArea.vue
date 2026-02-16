<template>
  <div :style="containerStyle">
    <a-upload-dragger
      :before-upload="handleBeforeUpload"
      :show-upload-list="false"
      accept=".pdf"
      :style="uploadStyle"
    >
      <p class="ant-upload-drag-icon">
        <a-icon type="inbox" :style="{ fontSize: '48px', color: '#1890ff' }" />
      </p>
      <p class="ant-upload-text" :style="{ fontSize: '16px', fontWeight: 500 }">
        点击或拖拽上传PDF文件
      </p>
      <p class="ant-upload-hint" :style="{ fontSize: '14px', color: '#999' }">
        支持PDF格式文件
      </p>
    </a-upload-dragger>
  </div>
</template>

<script>
export default {
  name: "UploadArea",
  computed: {
    containerStyle() {
      return {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      };
    },
    uploadStyle() {
      return {
        width: "400px",
        padding: "60px 40px",
      };
    },
  },
  methods: {
    handleBeforeUpload(file) {
      if (file.type === "application/pdf") {
        this.$emit("file-upload", file);
      }
      return false; // 阻止自动上传
    },
  },
};
</script>
