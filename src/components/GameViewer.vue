<template>
  <div v-if="game">
    <v-card class="mx-auto" elevation="0" color="transparent">
      <v-toolbar flat color="transparent">
        <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-2"></v-btn>
        <v-toolbar-title class="text-center mx-0">
          <div class="text-subtitle-1">Тур {{ game.round }}</div>
          <div class="text-caption">Результат: {{ formattedResult }}</div>
        </v-toolbar-title>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn 
              v-bind="props"
              icon="mdi-open-in-new" 
              variant="text" 
              :href="lichessUrl" 
              target="_blank"
            ></v-btn>
          </template>
          <span>Анализ на Lichess</span>
        </v-tooltip>
      </v-toolbar>
      <v-divider></v-divider>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="7">
            <v-sheet rounded="lg" class="fill-height d-flex flex-column">
              <div class="pa-2 flex-grow-1">
                <div class="player-info pa-2">
                  <v-icon size="small" class="mr-2" :color="topPlayerColor === 'w' ? 'grey-lighten-2' : 'grey-darken-2'">mdi-chess-king</v-icon>
                  <span class="font-weight-bold">{{ topPlayer.name }}</span>
                  <span class="text-grey ml-2">({{ topPlayer.rating }})</span>
                </div>

                <TheChessboard
                  :board-config="boardConfig"
                  reactive-config
                  @board-created="onBoardCreated"
                />

                <div class="player-info pa-2">
                  <v-icon size="small" class="mr-2" :color="bottomPlayerColor === 'w' ? 'grey-lighten-2' : 'grey-darken-2'">mdi-chess-king</v-icon>
                  <span class="font-weight-bold">{{ bottomPlayer.name }}</span>
                  <span class="text-grey ml-2">({{ bottomPlayer.rating }})</span>
                </div>
              </div>

              <v-sheet class="pa-2" color="surface-variant">
                <div class="d-flex justify-center">
                  <v-btn-group variant="flat" density="comfortable">
                    <v-btn @click="toStart" icon="mdi-skip-previous" aria-label="First move"></v-btn>
                    <v-btn @click="back" icon="mdi-chevron-left" aria-label="Previous move"></v-btn>
                    <v-btn @click="next" icon="mdi-chevron-right" aria-label="Next move"></v-btn>
                    <v-btn @click="toEnd" icon="mdi-skip-next" aria-label="Last move"></v-btn>
                  </v-btn-group>
                </div>
              </v-sheet>
            </v-sheet>
          </v-col>

          <v-col cols="12" md="5">
            <v-card variant="outlined" class="fill-height">
              <v-toolbar density="compact" flat color="transparent">
                <v-toolbar-title class="text-subtitle-1">Ходы партии</v-toolbar-title>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text class="pa-0">
                <div class="move-list" ref="movesContainer">
                  <span 
                    v-for="(move, index) in moves" 
                    :key="index"
                    :class="{ 'current-move': isCurrentMove(index) }"
                    @click="goToMove(index)"
                  >
                    {{ index % 2 === 0 ? `${Math.floor(index/2) + 1}.` : '' }} {{ move.san }}
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
  <v-alert v-else type="warning" class="mt-4" prominent border="start" icon="mdi-alert-circle-outline">
    Партия с ID "{{ id }}" не найдена. Возможно, данные еще загружаются или ссылка некорректна.
  </v-alert>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useTournamentStore } from '@/stores/tournament';
import { useRouter, useRoute } from 'vue-router';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import { Chess } from 'chess.js';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const store = useTournamentStore();
const router = useRouter();
const route = useRoute();

const game = computed(() => store.getGameById(props.id));

const povPlayer = computed(() => {
    if (route.query.pov) {
        return store.getPlayerByStartNo(parseInt(route.query.pov));
    }
    return game.value?.whitePlayer;
});

let boardAPI = null;
const moves = ref([]);
const currentPly = ref(0);
const movesContainer = ref(null);

const goBack = () => router.back();

const boardOrientation = computed(() => {
    if (!game.value || !povPlayer.value) return 'white';
    return povPlayer.value.start_no === game.value.blackPlayer.start_no ? 'black' : 'white';
});

// Создаем реактивный объект конфигурации, как требует документация
const boardConfig = computed(() => ({
  orientation: boardOrientation.value,
  viewOnly: true,
  highlight: {
    lastMove: true,
    check: true,
  },
  animation: {
    enabled: true,
    duration: 200,
  }
}));

function onBoardCreated(api) {
  boardAPI = api;
  if (game.value && game.value.pgn) {
    loadGameIntoBoard(game.value);
  }
}

function loadGameIntoBoard(gameData) {
  if (!boardAPI || !gameData || !gameData.pgn) return;
  try {
    // 1. Просто загружаем PGN.
    boardAPI.loadPgn(gameData.pgn);
    
    // 2. ВСЁ! Нам больше не нужно вызывать boardAPI.set().
    // Компонент сам подхватит правильную ориентацию из boardConfig
    // благодаря пропу reactive-config.

    const tempGame = new Chess();
    tempGame.loadPgn(gameData.pgn);
    moves.value = tempGame.history({ verbose: true });
    toStart();

  } catch (e) {
    console.error("Invalid PGN:", gameData.pgn, e);
    moves.value = [];
    boardAPI.resetBoard();
  }
}

watch(game, (newGame) => {
  if (newGame && boardAPI) {
    loadGameIntoBoard(newGame);
  } else if (!newGame && boardAPI) {
    moves.value = [];
    boardAPI.resetBoard();
    currentPly.value = 0;
  }
}, { deep: true, immediate: true });

const topPlayer = computed(() => boardOrientation.value === 'white' ? game.value.blackPlayer : game.value.whitePlayer);
const bottomPlayer = computed(() => boardOrientation.value === 'white' ? game.value.whitePlayer : game.value.blackPlayer);
const topPlayerColor = computed(() => boardOrientation.value === 'white' ? 'b' : 'w');
const bottomPlayerColor = computed(() => boardOrientation.value === 'white' ? 'w' : 'b');

const formattedResult = computed(() => {
  if (!game.value?.result) return '*';
  const result = game.value.result;
  if (result.includes('1-0') || result === '1') return '1-0';
  if (result.includes('0-1') || result === '0') return '0-1';
  if (result.includes('½') || result.includes('1/2')) return '½-½';
  return result;
});

const lichessUrl = computed(() => {
    if (!game.value || !game.value.pgn) return '#';
    const pgnWithHeaders = `[White "${game.value.whitePlayer.name}"]\n[Black "${game.value.blackPlayer.name}"]\n\n${game.value.pgn}`;
    return `https://lichess.org/paste?pgn=${encodeURIComponent(pgnWithHeaders)}`;
});

function updateState() {
  if (!boardAPI) return;
  currentPly.value = boardAPI.getCurrentPlyNumber();
  scrollToMove();
}
function next() {
  if (currentPly.value < moves.value.length) {
    currentPly.value++;
    boardAPI.viewHistory(currentPly.value);
    scrollToMove();
  }
}
function back() {
  if (currentPly.value > 0) {
    currentPly.value--;
    boardAPI.viewHistory(currentPly.value);
    scrollToMove();
  }
}
function toStart() {
  currentPly.value = 0;
  boardAPI?.viewHistory(currentPly.value);
  scrollToMove();
}
function toEnd() {
  currentPly.value = moves.value.length;
  boardAPI?.viewHistory(currentPly.value);
  scrollToMove();
}
function goToMove(index) {
  currentPly.value = index + 1;
  boardAPI?.viewHistory(currentPly.value);
  scrollToMove();
}
const isCurrentMove = (index) => index === currentPly.value - 1;
function scrollToMove() {
  nextTick(() => {
    const el = movesContainer.value?.querySelector('.current-move');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  });
}
function handleKeyDown(event) {
  if (event.key === 'ArrowRight') { event.preventDefault(); next(); } 
  else if (event.key === 'ArrowLeft') { event.preventDefault(); back(); }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<style scoped>
.player-info { display: flex; align-items: center; }
.move-list { padding: 16px; overflow-y: auto; font-size: 1rem; line-height: 1.9; font-family: 'Roboto Mono', monospace; height: calc(100% - 56px); }
.move-list span { cursor: pointer; margin-right: 8px; padding: 3px 6px; border-radius: 4px; display: inline-block; }
.move-list span:hover { background-color: rgba(var(--v-theme-on-surface), 0.1); }
.move-list .current-move { background-color: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary)); }
</style>