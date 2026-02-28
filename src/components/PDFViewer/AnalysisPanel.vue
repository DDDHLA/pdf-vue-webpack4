<template>
  <div class="analysis-panel">
    <div class="action-bar">
      <span class="action-bar-title">智能文档处理结果</span>
    </div>
    <div class="action-bar-sub">
      <a-checkbox
        :checked="isAllChecked"
        :indeterminate="isIndeterminate"
        @change="handleToggleAll"
      >
        文档列表
      </a-checkbox>
      <a-button type="link" size="small" @click="handleExpandAll">
        {{ isAllExpanded ? "全部折叠" : "全部展开" }}
      </a-button>
    </div>
    <div class="analysis-content">
      <a-collapse
        :active-key="activeKeys"
        :bordered="false"
        @change="(keys) => (activeKeys = keys)"
      >
        <a-collapse-panel v-for="item in documents" :key="item.id">
          <template slot="header">
            <div class="panel-header" @click.stop>
              <a-checkbox
                :checked="checkedKeys.includes(item.id)"
                @change="(e) => handleCheck(item.id, e)"
              />
              <span class="page-label">页码</span>
              <a-input-number
                :value="item.startPage"
                :min="1"
                size="small"
                :style="{ width: '55px' }"
                @change="(v) => (item.startPage = v)"
              />
              <span class="page-sep">—</span>
              <a-input-number
                :value="item.endPage"
                :min="item.startPage"
                size="small"
                :style="{ width: '55px' }"
                @change="(v) => (item.endPage = v)"
              />
              <a-select
                :value="item.docType"
                size="small"
                :style="{ width: '160px', marginLeft: '12px' }"
                @change="(v) => (item.docType = v)"
              >
                <a-select-option
                  v-for="opt in docTypeOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </a-select-option>
              </a-select>
              <a-tag
                :color="item.status === '待复核' ? 'orange' : 'cyan'"
                style="margin-left: 12px"
              >
                {{ item.status }}
              </a-tag>
              <div class="panel-actions">
                <a-icon
                  type="plus"
                  class="action-icon"
                  @click="handleAddAbove(item)"
                />
                <a-icon
                  type="delete"
                  class="action-icon delete-icon"
                  @click="handleDelete(item)"
                />
              </div>
            </div>
          </template>

          <!-- 面板内容 -->
          <div class="panel-content">
            <template v-if="item.formType === 'form'">
              <a-form-model
                layout="horizontal"
                :label-col="{ span: 6 }"
                :wrapper-col="{ span: 14 }"
              >
                <a-form-model-item
                  v-for="field in item.fields"
                  :key="field.label"
                  :label="field.label"
                >
                  <template v-if="field.type === 'date'">
                    <a-date-picker
                      v-model="field.dateValue"
                      size="default"
                      style="width: 100%"
                      :placeholder="field.placeholder"
                      @change="
                        (date, dateString) => {
                          field.value = dateString || null;
                        }
                      "
                    />
                  </template>
                  <template v-else-if="field.suffix">
                    <a-input v-model="field.value" size="default">
                      <span slot="addonAfter">{{ field.suffix }}</span>
                    </a-input>
                  </template>
                  <template v-else>
                    <a-input v-model="field.value" size="default" />
                  </template>
                </a-form-model-item>
              </a-form-model>
            </template>

            <template v-else>
              <div
                v-for="field in item.fields"
                :key="field.label"
                style="padding: 8px 24px; font-size: 14px"
              >
                {{ field.label }}：{{ field.value }}
              </div>
            </template>
          </div>
        </a-collapse-panel>
      </a-collapse>
      <div class="add-doc-btn" @click="handleAddDoc">
        <a-icon type="plus" />
        <span>添加文档类型</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AnalysisPanel",
  data() {
    return {
      activeKeys: ["1", "2", "3", "4"],
      checkedKeys: [],
      docTypeOptions: [
        "融资人营业执照",
        "融资人身份证",
        "法人担保人营业执照",
        "审计报告",
        "财务报表",
        "征信报告",
      ],
      documents: [
        {
          id: "1",
          startPage: 1,
          endPage: 1,
          // docType: "融资人营业执照",
          docType: "",
          status: "待复核",
          formType: "form",
          fields: [
            { label: "企业名称", value: "XXXXXXX", type: "text" },
            { label: "统一社会信用代码", value: "XXXXXXX", type: "text" },
            {
              label: "成立日期",
              value: null,
              dateValue: null,
              placeholder: "请选择日期",
              type: "date",
            },
            { label: "注册资本", value: "XXXXXXX", type: "text", suffix: "元" },
          ],
        },
        {
          id: "2",
          startPage: 2,
          endPage: 3,
          docType: "融资人身份证",
          status: "待复核",
          formType: "form",
          fields: [
            { label: "姓名", value: "XXXX" },
            { label: "性别", value: "男" },
          ],
        },
        {
          id: "3",
          startPage: 3,
          endPage: 5,
          docType: "法人担保人营业执照",
          status: "已复核",
          formType: "form",
          fields: [
            { label: "企业名称", value: "XXXXXXX", type: "text" },
            { label: "统一社会信用代码", value: "XXXXXXX", type: "text" },
            {
              label: "成立日期",
              value: null,
              dateValue: null,
              placeholder: "请选择日期",
              type: "date",
            },
            { label: "注册资本", value: "XXXXXXX", type: "text", suffix: "元" },
          ],
        },
        {
          id: "4",
          startPage: 5,
          endPage: 5,
          docType: "",
          status: "已复核",
          formType: "form",
          fields: [
            { label: "报告编号", value: "AUD-2026-001" },
            { label: "审计机构", value: "XXXX会计师事务所" },
          ],
        },
      ],
    };
  },
  created() {
    // 保存初始值，用于重置
    this.initialFieldValues = {};
    this.documents.forEach((doc) => {
      this.initialFieldValues[doc.id] = doc.fields.map((f) => ({
        value: f.value,
        dateValue: f.dateValue !== undefined ? f.dateValue : undefined,
      }));
    });
  },
  mounted() {
    this.$emit("documents-change", this.documents);
  },
  watch: {
    documents: {
      handler(val) {
        this.$emit("documents-change", val);
      },
      deep: true,
    },
  },
  computed: {
    isAllExpanded() {
      return this.documents.every((d) => this.activeKeys.includes(d.id));
    },
    isAllChecked() {
      return (
        this.documents.length > 0 &&
        this.checkedKeys.length === this.documents.length
      );
    },
    isIndeterminate() {
      return (
        this.checkedKeys.length > 0 &&
        this.checkedKeys.length < this.documents.length
      );
    },
  },
  methods: {
    handleToggleAll(e) {
      if (e.target.checked) {
        this.checkedKeys = this.documents.map((d) => d.id);
      } else {
        this.checkedKeys = [];
      }
    },
    handleExpandAll() {
      if (this.isAllExpanded) {
        this.activeKeys = [];
      } else {
        this.activeKeys = this.documents.map((d) => d.id);
      }
    },
    handleCheck(id, e) {
      if (e.target.checked) {
        this.checkedKeys.push(id);
      } else {
        this.checkedKeys = this.checkedKeys.filter((k) => k !== id);
      }
    },
    handleAddDoc() {
      const lastDoc = this.documents[this.documents.length - 1];
      const newId = String(Date.now());
      const newDoc = {
        id: newId,
        startPage: lastDoc ? lastDoc.endPage : 1,
        endPage: lastDoc ? lastDoc.endPage : 1,
        docType: this.docTypeOptions[0],
        status: "待复核",
        formType: "text",
        fields: [],
      };
      this.documents.push(newDoc);
      this.activeKeys.push(newId);
    },
    handleAddAbove(item) {
      const idx = this.documents.findIndex((d) => d.id === item.id);
      const newId = String(Date.now());
      const newDoc = {
        id: newId,
        startPage: item.startPage,
        endPage: item.startPage,
        docType: this.docTypeOptions[0],
        status: "待复核",
        formType: "text",
        fields: [],
      };
      this.documents.splice(idx, 0, newDoc);
      this.activeKeys.push(newId);
    },
    handleDelete(item) {
      if (this.documents.length <= 1) {
        this.$message.warning("至少保留一条文档记录");
        return;
      }
      this.documents = this.documents.filter((d) => d.id !== item.id);
      this.checkedKeys = this.checkedKeys.filter((k) => k !== item.id);
    },
    handleSave(item) {
      const formData = {};
      item.fields.forEach((field) => {
        if (field.type === "date") {
          formData[field.label] = field.dateValue
            ? field.dateValue.format("YYYY-MM-DD")
            : null;
        } else {
          formData[field.label] = field.value;
        }
      });
      console.log(`[保存] 文档「${item.docType}」表单内容:`, formData);
      this.$message.success("保存成功");
    },
    handleReset(item) {
      const initial = this.initialFieldValues[item.id];
      if (initial) {
        item.fields.forEach((field, idx) => {
          this.$set(field, "value", initial[idx].value);
          if (field.type === "date") {
            this.$set(field, "dateValue", initial[idx].dateValue);
          }
        });
      } else {
        item.fields.forEach((field) => {
          this.$set(field, "value", "");
          if (field.type === "date") {
            this.$set(field, "dateValue", null);
          }
        });
      }
      this.$message.info("已重置");
    },
  },
};
</script>

<style scoped>
.analysis-panel {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-left: 1px solid #e0e0e0;
  background: #fff;
  overflow: hidden;
}

.action-bar {
  padding: 12px 16px 0;
  flex-shrink: 0;
}

.action-bar-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.action-bar-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.analysis-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
}

.panel-header {
  display: flex;
  align-items: center;
  width: 100%;
  flex-wrap: nowrap;
}

.page-label {
  margin-left: 10px;
  margin-right: 8px;
  white-space: nowrap;
  font-weight: normal;
}

.page-sep {
  margin: 0 4px;
}

.panel-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  white-space: nowrap;
  gap: 12px;
}

.action-icon {
  font-size: 14px;
  color: #595959;
  cursor: pointer;
}

.action-icon:hover {
  color: #1890ff;
}

.delete-icon:hover {
  color: #ff4d4f;
}

.add-doc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  color: #1890ff;
  cursor: pointer;
  border: 1px dashed #1890ff;
  border-radius: 4px;
  margin: 12px 16px;
  font-size: 14px;
}

.add-doc-btn:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

.panel-content {
  padding: 16px 0;
}

::v-deep .ant-collapse-header {
  padding: 10px 16px 10px 40px !important;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

::v-deep .ant-collapse-content-box {
  padding: 0 16px !important;
}
</style>
