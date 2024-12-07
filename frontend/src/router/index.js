import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import Login from '../views/Login.vue';
import QueuePage from '../views/QueuePage.vue';

const routes = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/login', name: 'Login', component: Login },
  { path: '/queue', name: 'Queue', component: QueuePage },
  { path: '/queue/:queueId', name: 'QueuePage', component: QueuePage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
