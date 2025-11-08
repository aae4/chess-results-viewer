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
                  <v-toolbar density="compact" flat class="controls-panel">
                    <v-btn-group variant="text" density="comfortable">
                      <v-btn @click="toStart" icon="mdi-skip-previous">
                        <v-icon>mdi-skip-previous</v-icon>
                        <v-tooltip activator="parent" location="top">В начало</v-tooltip>
                      </v-btn>
                      <v-btn @click="back" icon="mdi-chevron-left">
                        <v-icon>mdi-chevron-left</v-icon>
                        <v-tooltip activator="parent" location="top">Назад</v-tooltip>
                      </v-btn>
                      <v-btn @click="next" icon="mdi-chevron-right">
                        <v-icon>mdi-chevron-right</v-icon>
                        <v-tooltip activator="parent" location="top">Вперед</v-tooltip>
                      </v-btn>
                      <v-btn @click="toEnd" icon="mdi-skip-next">
                        <v-icon>mdi-skip-next</v-icon>
                        <v-tooltip activator="parent" location="top">В конец</v-tooltip>
                      </v-btn>
                    </v-btn-group>
                    
                    <v-spacer></v-spacer>
                    
                    <v-btn @click="flipBoard" variant="text" icon>
                      <v-icon>mdi-rotate-3d-variant</v-icon>
                      <v-tooltip activator="parent" location="top">Перевернуть доску</v-tooltip>
                    </v-btn>
                    <v-btn :href="lichessUrl" target="_blank" variant="text" icon>
                      <v-icon>mdi-open-in-new</v-icon>
                      <v-tooltip activator="parent" location="top">Анализ на Lichess</v-tooltip>
                    </v-btn>
                     <v-btn @click="goBack" variant="text" icon>
                      <v-icon>mdi-arrow-left</v-icon>
                      <v-tooltip activator="parent" location="top">Назад к списку</v-tooltip>
                    </v-btn>
                  </v-toolbar>
                </div>
              </v-sheet>
            </v-sheet>
          </v-col>

          <v-col cols="12" md="5">
            <v-card class="fill-height d-flex flex-column right-column">
              <!-- Верхняя панель с информацией -->
              <div class="header-panel pa-4">
                <div class="text-center">
                  <div class="text-h6 font-weight-medium">{{ tournamentTitle }}</div>
                  <div class="text-body-2 text-grey-darken-1 mb-2">Тур {{ game.round }}</div>
                  <v-chip label color="primary" variant="tonal" size="large" class="px-4">
                    <span class="text-h5 font-weight-bold">{{ formattedResult }}</span>
                  </v-chip>
                </div>
              </div>
              <v-divider></v-divider>

              <!-- Обертка для списка ходов, которая будет скроллироваться -->
              <div class="move-list-wrapper">
                <v-table density="compact" class="move-table" fixed-header>
                  <thead>
                    <tr>
                      <th class="text-center" style="width: 20%;">#</th>
                      <th class="text-left">Белые</th>
                      <th class="text-left">Черные</th>
                    </tr>
                  </thead>
                  <tbody ref="movesContainer">
                    <tr v-for="(turn, index) in turns" :key="index">
                      <td class="text-center move-number">{{ index + 1 }}.</td>
                      <td 
                        :class="{ 'current-move': isCurrentMove(index * 2) }" 
                        @click="goToMove(index * 2)"
                        class="move-item"
                      >
                        <span v-html="formatSanWithFigurine(turn.white)"></span>
                      </td>
                      <td 
                        v-if="turn.black"
                        :class="{ 'current-move': isCurrentMove(index * 2 + 1) }" 
                        @click="goToMove(index * 2 + 1)"
                        class="move-item"
                      >
                        <span v-html="formatSanWithFigurine(turn.black)"></span>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted, reactive } from 'vue';
import { useTournamentStore } from '@/stores/tournament';
import { useRouter } from 'vue-router';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import { Chess } from 'chess.js';
import { formatResult, formatSanWithFigurine } from '@/utils/formatters';

const props = defineProps({ id: { type: String, required: true } });

const store = useTournamentStore();
const router = useRouter();

const game = computed(() => store.getGameById(props.id));
const tournamentTitle = computed(() => store.tournamentTitle);

let boardAPI = null;
const moves = ref([]);
const currentPly = ref(0);
const movesContainer = ref(null);

const flipBoard = () => {
  const newOrientation = boardConfig.orientation === 'white' ? 'black' : 'white';
  boardConfig.orientation = newOrientation;
};

const boardConfig = reactive({
  orientation: 'white',
  viewOnly: true,
  highlight: { lastMove: true, check: true },
  animation: { enabled: true, duration: 200 }
});

const onBoardCreated = (api) => {
  boardAPI = api;
  if (game.value?.pgn) {
    loadGameIntoBoard(game.value);
  }
};

const loadGameIntoBoard = (gameData) => {
  if (!boardAPI || !gameData?.pgn) return;
  try {
    boardConfig.orientation = 'white';
    boardAPI.loadPgn(gameData.pgn);
    const tempGame = new Chess();
    tempGame.loadPgn(gameData.pgn);
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
}, { deep: true, immediate: true });

const formattedResult = computed(() => formatResult(game.value?.result));

const lichessUrl = computed(() => {
  if (!game.value?.pgn) return '#';
  const pgnWithHeaders = `[White "${game.value.whitePlayer.name}"]\n[Black "${game.value.blackPlayer.name}"]\n\n${game.value.pgn}`;
  return `https://lichess.org/paste?pgn=${encodeURIComponent(pgnWithHeaders)}`;
});

const goBack = () => router.back();

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

const topPlayer = computed(() => boardConfig.orientation === 'white' ? game.value.blackPlayer : game.value.whitePlayer);
const bottomPlayer = computed(() => boardConfig.orientation === 'white' ? game.value.whitePlayer : game.value.blackPlayer);
const topPlayerColor = computed(() => boardConfig.orientation === 'white' ? 'b' : 'w');
const bottomPlayerColor = computed(() => boardConfig.orientation === 'white' ? 'w' : 'b');

const toStart = () => { currentPly.value = 0; boardAPI?.viewHistory(0); scrollToMove(); };
const toEnd = () => { currentPly.value = moves.value.length; boardAPI?.viewHistory(moves.value.length); scrollToMove(); };
const next = () => { if (currentPly.value < moves.value.length) { currentPly.value++; boardAPI.viewHistory(currentPly.value); scrollToMove(); } };
const back = () => { if (currentPly.value > 0) { currentPly.value--; boardAPI.viewHistory(currentPly.value); scrollToMove(); } };
const goToMove = (index) => { currentPly.value = index + 1; boardAPI?.viewHistory(currentPly.value); scrollToMove(); };
const isCurrentMove = (index) => index === currentPly.value - 1;

const scrollToMove = () => {
  // TODO: скролится вся страница, а надо скролить только внутри таблички с ходами
  // nextTick(() => {
  //   const el = movesContainer.value?.querySelector('.current-move');
  //   if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  // });
};

const handleKeyDown = (event) => {
  if (event.key === 'ArrowRight') { event.preventDefault(); next(); } 
  else if (event.key === 'ArrowLeft') { event.preventDefault(); back(); }
};
onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<style scoped>
.chessboard-container {
  width: 100%;
  height: 100%;
}

.header-panel {
  /* Заголовок не должен сжиматься */
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.controls-panel {
  /* Панель управления не должна сжиматься */
  flex-shrink: 0;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.right-column .move-list-wrapper {
  /* Говорим элементу занять все доступное пространство */
  flex: 1 1 0;
  /* Добавляем прокрутку, если контент не помещается */
  overflow-y: auto;
}

.move-table {
  font-family: 'Roboto Mono', monospace;
}

.move-number {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.9em;
}

.move-item {
  cursor: pointer;
  padding: 8px 12px !important;
  border-radius: 4px;
  transition: background-color 0.2s ease-in-out;
  font-size: 1.1em;
  white-space: nowrap;
}

.move-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.1);
}

.current-move {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
</style>