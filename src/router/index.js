import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  { 
    path: '/', 
    name: 'TournamentsList',
    component: () => import('@/views/TournamentsListView.vue') 
  },
  {
    path: '/tournament/:tournamentId',
    name: 'TournamentDashboard',
    component: () => import('@/views/TournamentDashboard.vue'),
    props: true,

    redirect: to => ({ name: 'Standings', params: { tournamentId: to.params.tournamentId } }),
    children: [
      { path: 'standings', name: 'Standings', component: () => import('@/views/StandingsView.vue') },
      { path: 'rounds', name: 'Rounds', component: () => import('@/views/RoundsView.vue') },
      { path: 'participants', name: 'Participants', component: () => import('@/views/ParticipantsView.vue') },
      { path: 'crosstable', name: 'Crosstable', component: () => import('@/views/CrosstableView.vue') },
      { path: 'statistics', name: 'Statistics', component: () => import('@/views/StatisticsView.vue') },
    ]
  },
  { 
    path: '/tournament/:tournamentId/player/:playerId', 
    name: 'Player', 
    component: () => import('@/views/PlayerView.vue'), 
    props: true 
  },
  { 
    path: '/game/:gameId', 
    name: 'Game', 
    component: () => import('@/views/GameView.vue'), 
    props: true 
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: { name: 'TournamentsList' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;