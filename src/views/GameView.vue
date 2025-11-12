<template>
<div>
  <!-- Состояния загрузки и ошибки (без изменений) -->
  <div v-if="store.isLoadingDetails && !game" class="text-center pa-10">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    <div class="mt-4 text-medium-emphasis">Загрузка партии...</div>
  </div>
  <v-alert v-else-if="store.error" type="error" prominent>...</v-alert>
  
  <div v-else-if="game">
    <v-row>
      <!-- Левая колонка: Доска и управление -->
      <v-col cols="12" md="7">
        <v-sheet class="fill-height d-flex flex-column" border rounded="lg">
          <!-- Верхняя панель -->
          <div class="player-info pa-3">
            <v-icon size="small" class="mr-2">mdi-chess-king</v-icon>
            <span class="font-weight-bold text-subtitle-1">{{ topPlayer.name }}</span>
            <span class="text-medium-emphasis ml-2">({{ topPlayer.rating }})</span>
          </div>
          <!-- Доска -->
          <div class="px-2 flex-grow-1">
            <TheChessboard :board-config="boardConfig" reactive-config @board-created="onBoardCreated" />
          </div>
          <!-- Нижняя панель -->
          <div class="player-info pa-3">
            <v-icon size="small" class="mr-2">mdi-chess-king</v-icon>
            <span class="font-weight-bold text-subtitle-1">{{ bottomPlayer.name }}</span>
            <span class="text-medium-emphasis ml-2">({{ bottomPlayer.rating }})</span>
          </div>
          <!-- Панель управления -->
          <v-toolbar flat density="compact">
            <v-btn-group variant="text" density="comfortable">
              <v-btn @click="toStart" icon="mdi-skip-previous"></v-btn>
              <v-btn @click="back" icon="mdi-chevron-left"></v-btn>
              <v-btn @click="next" icon="mdi-chevron-right"></v-btn>
              <v-btn @click="toEnd" icon="mdi-skip-next"></v-btn>
            </v-btn-group>
            <v-spacer></v-spacer>
            <v-btn @click="flipBoard" variant="text" icon="mdi-rotate-3d-variant"></v-btn>
          </v-toolbar>
        </v-sheet>
      </v-col>
      
      <!-- Правая колонка: Информация и ходы -->
      <v-col cols="12" md="5">
        <v-card class="fill-height d-flex flex-column">
          <v-toolbar flat density="compact">
            <v-btn v-if="display.mdAndUp.value" icon="mdi-arrow-left" @click="router.back()"></v-btn>
            <v-toolbar-title class="text-subtitle-1 font-weight-medium">Детали партии</v-toolbar-title>
          </v-toolbar>
          <v-divider></v-divider>
          <v-card-text class="text-center">
            <div class="text-h6 font-weight-bold">{{ game.tournament_name }}</div>
            <div class="text-body-1 text-medium-emphasis mb-3">Тур {{ game.round }} · Доска {{ game.board }}</div>
            <v-chip label color="primary" variant="elevated" size="large">
              <span class="text-h5 font-weight-bold">{{ formattedResult }}</span>
            </v-chip>
          </v-card-text>
          <v-divider></v-divider>
          <!-- Информация о дебюте -->
          <v-list-item v-if="opening" :title="opening.n" :subtitle="opening.e" prepend-icon="mdi-book-open-page-variant-outline"></v-list-item>
          <v-divider></v-divider>
          <!-- Список ходов -->
          <div class="move-list-wrapper" ref="scrollWrapper">
            <div class="pa-2" ref="movesContainer">
              <div v-for="(turn, index) in turns" :key="index" class="d-flex align-center turn-row">
                <div class="move-number text-medium-emphasis">{{ index + 1 }}.</div>
                <div 
                  :class="{ 'current-move': isCurrentMove(index * 2) }" 
                  @click="goToMove(index * 2)" 
                  class="move-item flex-grow-1"
                  v-html="formatSanWithFigurine(turn.white)">
                </div>
                <div 
                  v-if="turn.black"
                  :class="{ 'current-move': isCurrentMove(index * 2 + 1) }" 
                  @click="goToMove(index * 2 + 1)" 
                  class="move-item flex-grow-1"
                  v-html="formatSanWithFigurine(turn.black)">
                </div>
                <div v-else class="flex-grow-1"></div> <!-- Заполнитель -->
              </div>
            </div>
          </div>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn :href="lichessUrl" target="_blank" prepend-icon="mdi-open-in-new" variant="text">
              Анализ на Lichess
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, reactive } from 'vue';
import { useTournamentStore } from '@/stores/tournamentStore';
import { useRouter } from 'vue-router';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import { Chess } from 'chess.js';
import { formatResult, formatSanWithFigurine } from '@/utils/formatters';
import { historyToPgnString } from '@/utils/pgn';
import { useDisplay } from 'vuetify';

const props = defineProps({
  gameId: { type: [String, Number], required: true }
});

const store = useTournamentStore();
const router = useRouter();
const display = useDisplay();
const game = computed(() => store.activeGame);

watch(() => props.gameId, (newGameId) => {
    if (newGameId) {
      store.fetchGameData(newGameId);
    }
  }, { immediate: true }
);

let boardAPI = null;
const moves = ref([]);
const currentPly = ref(0);
const scrollWrapper = ref(null);
const movesContainer = ref(null);

const boardConfig = reactive({
  orientation: 'white',
  viewOnly: true,
  highlight: { lastMove: true, check: true },
  animation: { enabled: true, duration: 200 }
});

const flipBoard = () => {
  boardConfig.orientation = boardConfig.orientation === 'white' ? 'black' : 'white';
};

const onBoardCreated = (api) => {
  boardAPI = api;
  if (game.value?.pgn_moves) {
    loadGameIntoBoard(game.value);
  }
};

const loadGameIntoBoard = (gameData) => {
  if (!boardAPI || !gameData?.pgn_moves) return;
  try {
    boardConfig.orientation = 'white';
    boardAPI.loadPgn(gameData.pgn_moves);
    const tempGame = new Chess();
    tempGame.loadPgn(gameData.pgn_moves);
    moves.value = tempGame.history({ verbose: true });
    toStart();
  } catch (e) {
    console.error("Invalid PGN:", e);
    moves.value = [];
    boardAPI.resetBoard();
  }
};

watch(game, (newGame) => {
  if (newGame && boardAPI) {
    loadGameIntoBoard(newGame);
  }
}, { deep: true });

const formattedResult = computed(() => formatResult(game.value?.result));

const lichessUrl = computed(() => {
    if (!game.value?.pgn_moves) return '#';
    const pgnWithHeaders = `[White "${game.value.white_name}"]\n[Black "${game.value.black_name}"]\n\n${game.value.pgn_moves}`;
    return `https://lichess.org/paste?pgn=${encodeURIComponent(pgnWithHeaders)}`;
});

const opening = computed(() => {
  if (!game.value?.pgn_moves || !store.ecoDatabase) return null;
  try {
    const chess = new Chess();
    chess.loadPgn(game.value.pgn_moves);
    const history = chess.history();
    for (let i = Math.min(history.length, 20); i > 0; i--) {
      const pgnStr = historyToPgnString(history.slice(0, i));
      if (store.ecoDatabase[pgnStr]) {
        return store.ecoDatabase[pgnStr];
      }
    }
  } catch (e) { return null; }
  return null;
});

const turns = computed(() => {
  const result = [];
  for (let i = 0; i < moves.value.length; i += 2) {
    result.push({
      white: moves.value[i],
      black: moves.value[i + 1] || null
    });
  }
  return result;
});

const topPlayer = computed(() => {
    if (!game.value) return {};
    return boardConfig.orientation === 'white' 
        ? { name: game.value.black_name, rating: game.value.black_rating }
        : { name: game.value.white_name, rating: game.value.white_rating };
});
const bottomPlayer = computed(() => {
    if (!game.value) return {};
    return boardConfig.orientation === 'white'
        ? { name: game.value.white_name, rating: game.value.white_rating }
        : { name: game.value.black_name, rating: game.value.black_rating };
});
const topPlayerColor = computed(() => boardConfig.orientation === 'white' ? 'b' : 'w');
const bottomPlayerColor = computed(() => boardConfig.orientation === 'white' ? 'w' : 'b');

const toStart = () => { currentPly.value = 0; boardAPI?.viewHistory(0); scrollToMove(); };
const toEnd = () => { currentPly.value = moves.value.length; boardAPI?.viewHistory(moves.value.length); scrollToMove(); };
const next = () => { if (currentPly.value < moves.value.length) { currentPly.value++; boardAPI.viewHistory(currentPly.value); scrollToMove(); } };
const back = () => { if (currentPly.value > 0) { currentPly.value--; boardAPI.viewHistory(currentPly.value); scrollToMove(); } };
const goToMove = (index) => { currentPly.value = index + 1; boardAPI?.viewHistory(currentPly.value); scrollToMove(); };
const isCurrentMove = (index) => index === currentPly.value - 1;

const scrollToMove = () => {
  nextTick(() => {
    const container = scrollWrapper.value;
    const targetElement = movesContainer.value?.querySelector('.current-move');
    if (container && targetElement) {
      const containerHeight = container.clientHeight;
      const targetTop = targetElement.offsetTop;
      const targetHeight = targetElement.clientHeight;
      const scrollTop = targetTop - (containerHeight / 2) + (targetHeight / 2);
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  });
};

const handleKeyDown = (event) => {
  if (event.key === 'ArrowRight') { event.preventDefault(); next(); } 
  else if (event.key === 'ArrowLeft') { event.preventDefault(); back(); }
};
onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<style scoped>
/* Стили из предыдущей, рабочей версии */
.player-info { display: flex; align-items: center; }
.header-panel { flex-shrink: 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12); }
.controls-panel { background-color: transparent; }
.move-list-wrapper { flex: 1 1 0; overflow-y: auto; }
.move-table { font-family: 'Roboto Mono', monospace; }
.move-number { color: rgba(var(--v-theme-on-surface), 0.6); font-size: 0.9em; }
.move-item { cursor: pointer; padding: 8px 12px !important; border-radius: 4px; transition: background-color 0.2s ease-in-out; font-size: 1.1em; white-space: nowrap; }
.move-item:hover { background-color: rgba(var(--v-theme-on-surface), 0.1); }
.current-move { background-color: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary)); }
</style>