const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  transpileDependencies: [],
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
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
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          javascriptEnabled: true,
        },
      },
    },
  },
};
