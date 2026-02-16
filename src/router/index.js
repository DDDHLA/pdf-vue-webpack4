import Vue from "vue";
import VueRouter from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import PDFViewer from "@/views/PDFViewer.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    component: MainLayout,
    redirect: "/pdf-viewer",
    children: [
      {
        path: "pdf-viewer",
        name: "PDFViewer",
        component: PDFViewer,
      },
    ],
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
