import { createRouter, createWebHashHistory } from 'vue-router';

// Замените 'chess-results-viewer' на НАЗВАНИЕ ВАШЕГО РЕПОЗИТОРИЯ
const repoName = 'chess-results-viewer';

const routes = [
  { 
    path: '/', 
    redirect: '/standings' 
  },
  { 
    path: '/standings', 
    name: 'standings',
    component: () => import('@/views/StandingsView.vue') 
  },
  { 
    path: '/rounds', 
    name: 'rounds',
    component: () => import('@/views/RoundsView.vue') 
  },
  { 
    path: '/participants', 
    name: 'participants',
    component: () => import('@/views/ParticipantsView.vue') 
  },
  { 
    path: '/crosstable', 
    name: 'crosstable',
    component: () => import('@/views/CrosstableView.vue') 
  },
  { 
    path: '/statistics', 
    name: 'statistics',
    component: () => import('@/views/StatisticsView.vue') 
  },
  { 
    path: '/player/:start_no', 
    name: 'player', 
    // Мы переиспользуем компонент, но теперь он работает как страница
    component: () => import('@/components/PlayerView.vue'), 
    props: true 
  },
  { 
    path: '/game/:id', 
    name: 'game', 
    // Аналогично для GameViewer
    component: () => import('@/components/GameViewer.vue'), 
    props: true 
  },
];

const router = createRouter({
  // Используем HashHistory, т.к. это оптимально для GitHub Pages
  history: createWebHashHistory(),
  routes,
});

export default router;