import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
    },
    { path: "/login", name: "login", component: LoginView },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/game/:gameId([0-9a-fA-F]+)", // TODO format
      name: "game",
      component: () => import("../views/GameView.vue"),
      props: true,
    },
    {
      path: "/variants/:variant/demo",
      name: "demo",
      component: () => import("../views/VariantDemoView.vue"),
      props: true,
    },
    {
      path: "/components",
      name: "components",
      component: () => import("../views/ComponentView.vue"),
    },
    {
      path: "/variants/:variant/rules",
      name: "rules",
      component: () => import("../views/RulesView.vue"),
      props: true,
    },
    {
      path: "/variants/rules-list",
      name: "rules-list",
      component: () => import("../views/RulesListView.vue"),
    },
    {
      path: "/notifications",
      name: "notifications",
      component: () => import("../views/NotificationsView.vue"),
    },
    {
      path: "/users/:userId([0-9a-fA-F]+)",
      name: "user",
      component: () => import("../views/UserView.vue"),
      props: true,
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
    },
  ],
});

export default router;
