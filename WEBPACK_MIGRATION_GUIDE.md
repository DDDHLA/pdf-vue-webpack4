# Webpack 5 to Webpack 4 迁移技术手册

本文档详细记录了将本项目从 Webpack 5 (Vue CLI 5) 降级迁移至 Webpack 4 (Vue CLI 4) 的所有关键修改点，以解决内网开发环境下的兼容性及 PDF.js Worker 加载问题。

## 1. 核心配置文件修改

### 文件名：`package.json`

**修改点：**
- **Vue CLI 版本降级**：
  - `@vue/cli-service`: `~5.0.0` -> `~4.5.0`
  - `@vue/cli-plugin-babel`: `~5.0.0` -> `~4.5.0`
  - `@vue/cli-plugin-eslint`: `~5.0.0` -> `~4.5.0`
  - `@vue/cli-plugin-router`: `~5.0.0` -> `~4.5.0`
- **样式 Loader 降级**：
  - `less-loader`: `^8.1.1` -> `^7.3.0` (Webpack 4 兼容版本)
  - `less`: `^4.1.3` -> `^3.13.1`

**新增点：**
- **Webpack 核心**：显式添加 `"webpack": "^4.46.0"` 确保锁定版本。
- **自动复制工具**：添加 `"copy-webpack-plugin": "^6.4.1"`。
  - *原因*：用于将 PDF.js 的 Worker 脚本自动部署到静态目录，解决 Webpack 4 无法直接 import Worker 的限制。

---

### 文件名：`vue.config.js`

**修改点：**
- **移除 `defineConfig`**：
  - Webpack 5 特有的辅助函数在 Webpack 4 下不存在，需改为传统的 `module.exports = { ... }` 导出方式。
- **`transpileDependencies` 类型调整**：
  - `true` -> `[]` (Vue CLI 4 严格要求该字段为数组格式)。

**新增点：**
- **`CopyWebpackPlugin` 配置**：
  ```javascript
  const CopyWebpackPlugin = require("copy-webpack-plugin");
  // ...
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(__dirname, "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js"),
            to: path.join(__dirname, "public"),
          },
        ],
      }),
    ],
  }
  ```
  - *作用*：每次启动或构建时，自动从 `node_modules` 提取 Worker 脚本至 `public` 根目录。

---

### 文件名：`src/hooks/usePDFViewer.js`

**修改点：**
- **PDF.js Worker 加载方式**：
  - 删除了 `import pdfjsWorker from "..."`。
  - 修改为路径引用：`pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';`。
  - *原因*：在 Webpack 4 环境中，Worker 文件由于体积或特殊性，直接通过 Loader 处理常会导致 `SyntaxError: Unexpected token '<'` (即返回了 HTML 页面而非脚本)，通过静态路径引用最为稳妥。

## 2. 环境适配说明

1. **内网开发支持**：
   - 弃用了 CDN 加载方案，所有资源（包括 PDF.js Worker）均通过 `public` 目录进行本地托管。
2. **静态资源自动管理**：
   - 无需手动在 `public` 文件夹下放置 `pdf.worker.min.js`，编译系统会自动通过插件进行维护。

## 3. 运行指南

在迁移后的项目中，请确保执行以下步骤：
1. `npm install` (安装兼容 Webpack 4 的指定版本依赖)
2. `npm run serve` (启动开发服务器)
