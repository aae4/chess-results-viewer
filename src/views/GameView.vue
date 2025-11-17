<template>
  <div>
    <!-- Состояния загрузки и ошибки -->
    <div v-if="store.isLoadingDetails && !game" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-medium-emphasis">Загрузка партии...</div>
    </div>
    <v-alert v-else-if="store.error" type="error" prominent>
      Произошла ошибка при загрузке партии. Пожалуйста, попробуйте еще раз.
    </v-alert>

    <div v-else-if="game">
      <!-- ====================================================== -->
      <!-- ================ ДЕСКТОПНЫЙ МАКЕТ ==================== -->
      <!-- ====================================================== -->
      <div v-if="display.mdAndUp.value" class="desktop-layout-container">
        <!-- Левая колонка с доской -->
        <div class="board-column">
          <v-sheet class="d-flex flex-column" border rounded="lg">
            <PlayerInfoPanel 
              :player="topPlayer" 
              :captured-pieces="netCapturedPieces[topPlayer.color]" 
              :advantage="currentGameState.advantage[topPlayer.color]"
            />
            <!-- <div class="px-2 flex-grow-1"> -->
            <div class="board-wrapper">
              <!-- <EvaluationBar :score="currentEvaluation" /> -->
              <EvaluationBar v-if="isAnalysisEnabled" class="eval-bar-wrapper" :score="currentEvaluation" :orientation="boardConfig.orientation"  />
              <TheChessboard :board-config="boardConfig" reactive-config @board-created="onBoardCreated" />
            </div>
            <PlayerInfoPanel 
              :player="bottomPlayer" 
              :captured-pieces="netCapturedPieces[bottomPlayer.color]"
              :advantage="currentGameState.advantage[bottomPlayer.color]"
            />
          </v-sheet>
        </div>

        <!-- Правая колонка с информацией и управлением -->
        <div class="info-column">
          <v-card class="desktop-info-card d-flex flex-column">
            <!-- Хедер -->
            <v-card-text>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ game.tournament_name }}</div>
                  <div class="text-body-2 text-medium-emphasis">Тур {{ game.round }} · Доска {{ game.board }}</div>
                </div>
                <v-chip label color="primary" variant="elevated" size="large">
                  <span class="text-h6 font-weight-bold">{{ formattedResult }}</span>
                </v-chip>
              </div>
            </v-card-text>
            <v-divider></v-divider>

            <!-- Список ходов -->
            <div class="moves-scroll-area" ref="scrollWrapper">
              <div class="pa-2 moves-container" ref="movesContainer">
                <div v-for="(turn, index) in turns" :key="index" class="d-flex align-center turn-row">
                  <div class="move-number text-medium-emphasis">{{ index + 1 }}.</div>
                  <div :class="{ 'current-move': isCurrentMove(index * 2) }" @click="goToMove(index * 2)" class="move-item flex-grow-1" v-html="formatSanWithFigurine(turn.white)"></div>
                  <div v-if="turn.black" :class="{ 'current-move': isCurrentMove(index * 2 + 1) }" @click="goToMove(index * 2 + 1)" class="move-item flex-grow-1" v-html="formatSanWithFigurine(turn.black)"></div>
                  <div v-else class="flex-grow-1"></div>
                </div>
              </div>
            </div>
            <v-divider></v-divider>
<!--             <StockfishAnalysis 
                v-if="isAnalysisEnabled"
                :result="analysisResult"
                v-model:multiPv="multiPv"
                :turn="currentTurn"  
                class="flex-shrink-0"
            /> -->

            <!-- Футер -->
            <div class="pa-2">
              <v-list-item v-if="opening" :title="opening.n" :subtitle="opening.e" prepend-icon="mdi-book-open-page-variant-outline" density="compact"></v-list-item>
            </div>
            <v-card-actions class="pa-2">
              <v-btn-group variant="text" density="comfortable">
                <v-btn @click="toStart" icon="mdi-skip-previous" title="В начало"></v-btn>
                <v-btn @click="back" icon="mdi-chevron-left" title="Назад"></v-btn>
                <v-btn @click="next" icon="mdi-chevron-right" title="Вперед"></v-btn>
                <v-btn @click="toEnd" icon="mdi-skip-next" title="В конец"></v-btn>
              </v-btn-group>
              <v-spacer></v-spacer>
<!--               <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn v-bind="props" @click="toggleAnalysis" :loading="isAnalyzing || (isAnalysisEnabled && !isEngineLoaded)" :color="isAnalysisEnabled ? 'primary' : ''" variant="text" icon="mdi-calculator-variant"></v-btn>
                </template>
                <span>{{ isAnalysisEnabled ? 'Выключить анализ' : 'Включить анализ' }}</span>
              </v-tooltip> -->

              <v-btn @click="flipBoard" variant="text" icon="mdi-rotate-3d-variant" title="Перевернуть доску"></v-btn>
              <v-btn :href="lichessUrl" target="_blank" prepend-icon="mdi-open-in-new" variant="text">
                Анализ
              </v-btn>
            </v-card-actions>
          </v-card>
          <v-card class="fill-height">
            <v-card-title class="d-flex align-center py-1">
              <span class="text-subtitle-1">
                <v-icon start>mdi-calculator-variant</v-icon>
                Анализ
              </span>
              <v-spacer />
              
              <!-- Контейнер для переключателя и индикатора загрузки -->
              <div class="d-flex align-center ga-2">
                <v-switch
                  v-model="isAnalysisEnabled"
                  color="primary"
                  density="compact"
                  hide-details
                ></v-switch>
                
                <v-progress-circular
                  v-if="isAnalyzing || (isAnalysisEnabled && !isEngineLoaded)"
                  indeterminate
                  size="20"
                  width="2"
                  color="grey"
                ></v-progress-circular>
              </div>
            </v-card-title>
            <v-divider />
            <StockfishAnalysis 
              v-if="isAnalysisEnabled"
              :result="analysisResult"
              v-model:multiPv="multiPv"
              :turn="currentTurn"
              :current-fen="getCurrentFen()"
              @show-move-on-board="handleShowMove"
              @hide-move-on-board="handleHideMove"
            />
             <div v-else class="d-flex align-center justify-center fill-height text-medium-emphasis">
              Анализ выключен
            </div>
          </v-card>
        </div>
      </div>

      <!-- ====================================================== -->
      <!-- ================= МОБИЛЬНЫЙ МАКЕТ ==================== -->
      <!-- ====================================================== -->
      <div v-else class="mobile-layout">
        <div class="board-area">
          <PlayerInfoPanel 
            :player="topPlayer" 
            :captured-pieces="netCapturedPieces[topPlayer.color]"
            :advantage="currentGameState.advantage[topPlayer.color]"
          />
          <div class="px-1">
            <TheChessboard :board-config="boardConfig" reactive-config @board-created="onBoardCreated" />
          </div>
          <PlayerInfoPanel 
            :player="bottomPlayer" 
            :captured-pieces="netCapturedPieces[bottomPlayer.color]"
            :advantage="currentGameState.advantage[bottomPlayer.color]"
          />
        </div>

        <div class="info-area">
          <v-toolbar flat density="compact" color="transparent">
            
            <v-btn @click="flipBoard" variant="text" icon="mdi-rotate-3d-variant"></v-btn>
            <v-spacer></v-spacer>
            <v-btn-group variant="text" density="comfortable">
              <!-- <v-btn @click="toStart" icon="mdi-skip-previous"></v-btn> -->
              <v-btn @click="back" icon="mdi-chevron-left"></v-btn>
              <v-btn @click="next" icon="mdi-chevron-right"></v-btn>
              <!-- <v-btn @click="toEnd" icon="mdi-skip-next"></v-btn> -->
            </v-btn-group>
          </v-toolbar>
          <v-divider></v-divider>
          
          <div class="d-flex align-center pa-2">
             <v-chip label color="primary" variant="elevated" size="small" class="mr-2">
                <span class="font-weight-bold">{{ formattedResult }}</span>
              </v-chip>
            <div v-if="opening" class="text-truncate text-caption text-medium-emphasis">
              {{ opening.n }} ({{ opening.e }})
            </div>
          </div>
          <v-divider></v-divider>

          <div class="moves-scroll-area" ref="scrollWrapper">
            <div class="pa-2 moves-container" ref="movesContainer">
              <div v-for="(turn, index) in turns" :key="index" class="d-flex align-center turn-row">
                <div class="move-number text-medium-emphasis">{{ index + 1 }}.</div>
                <div :class="{ 'current-move': isCurrentMove(index * 2) }" @click="goToMove(index * 2)" class="move-item flex-grow-1" v-html="formatSanWithFigurine(turn.white)"></div>
                <div v-if="turn.black" :class="{ 'current-move': isCurrentMove(index * 2 + 1) }" @click="goToMove(index * 2 + 1)" class="move-item flex-grow-1" v-html="formatSanWithFigurine(turn.black)"></div>
                <div v-else class="flex-grow-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useTournamentStore } from '@/stores/tournamentStore';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import { Chess } from 'chess.js';
import { formatResult, formatSanWithFigurine } from '@/utils/formatters';
import { historyToPgnString } from '@/utils/pgn';
import { useDisplay } from 'vuetify';
import PlayerInfoPanel from '@/components/PlayerInfoPanel.vue';
import EvaluationBar from '@/components/EvaluationBar.vue'; // <-- ИМПОРТ КОМПОНЕНТА
// import loadEngine from '@/services/loadEngine.js'; // Убедитесь, что путь правильный
import { useStockfish } from '@/utils/useStockfish';
import StockfishAnalysis from '@/components/StockfishAnalysis.vue';

const props = defineProps({
  gameId: { type: [String, Number], required: true }
});

const store = useTournamentStore();
const display = useDisplay();
const game = computed(() => store.activeGame);

let boardAPI = null;
const moves = ref([]);
const currentPly = ref(0);
const scrollWrapper = ref(null);
const movesContainer = ref(null);
const gameStates = ref([]); // Массив состояний для каждого полухода

const boardConfig = reactive({
  orientation: 'white',
  // viewOnly: true,
  // drawable: true,
  highlight: { lastMove: true, check: true },
  animation: { enabled: true, duration: 200 },
  responsive: true 
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

watch(() => props.gameId, (newGameId) => {
  if (newGameId) {
    store.fetchGameData(newGameId);
  }
}, { immediate: true });

const loadGameIntoBoard = (gameData) => {
  if (!boardAPI || !gameData?.pgn_moves) return;
  try {
    boardConfig.orientation = 'white';
    boardAPI.loadPgn(gameData.pgn_moves);
    const tempGame = new Chess();
    tempGame.loadPgn(gameData.pgn_moves);
    moves.value = tempGame.history({ verbose: true });
    // evaluationsByPly.value = [];
    isAnalyzing.value = false;
    analyzeGameHistory(gameData.pgn_moves);
    toStart();
    // boardAPI.drawMove('d2', 'd4', 'paleBlue')
    // boardAPI.setShapes([{
    //   orig: 'd2',
    //   dest: 'd4',
    //   brushColor: 'g'
    // }]);
    // orig: Square, dest: Square, brushColor: BrushColor
  } catch (e) {
    console.error("Invalid PGN:", e);
    moves.value = [];
    boardAPI.resetBoard();
  }
};

const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };

/**
 * Генерирует FEN для текущего полухода (currentPly).
 * Это правильный и надежный способ, работающий независимо от vue3-chessboard.
 */
const getCurrentFen = () => {
  try {
    // 1. Создаем НОВЫЙ, чистый экземпляр chess.js.
    // Он всегда начинается со стартовой позиции. Это ключевой момент.
    const tempChess = new Chess();

    // 2. Воспроизводим ходы из нашего массива `moves` один за другим,
    // ровно до текущего полухода `currentPly`.
    for (let i = 0; i < currentPly.value; i++) {
      // Мы используем .san из нашего массива ходов, который был получен при загрузке PGN.
      tempChess.move(moves.value[i].san);
    }

    // 3. Теперь `tempChess` находится именно в той позиции, которая нам нужна.
    // Возвращаем ее FEN.
    return tempChess.fen();

  } catch (e) {
    // Эта защита сработает, если что-то пойдет не так (например, ошибка в PGN)
    console.error(`Could not generate FEN for ply ${currentPly.value}:`, e);
    return null;
  }
};

// analyzeCurrentPosition теперь использует новый метод
function analyzeCurrentPosition() {
  if (!isAnalysisEnabled.value || !isEngineLoaded.value) return;
  
  const movesString = getMovesUciString();
  startAnalysis(movesString, multiPv.value);
}

function analyzeGameHistory(pgn) {
  const chess = new Chess();
  chess.loadPgn(pgn);

  const history = chess.history({ verbose: true });
  moves.value = history; // Сохраняем ходы для списка
  
  const states = [];
  const initialCaptured = { w: [], b: [] };
  
  // Состояние 0: Начальная позиция
  states.push({
    captured: { w: [], b: [] },
    advantage: { w: 0, b: 0 },
  });

  const tempChess = new Chess();
  history.forEach(move => {
    tempChess.move(move.san);
    
    const captured = {
      w: [...(states[states.length - 1].captured.w)],
      b: [...(states[states.length - 1].captured.b)],
    };
    
    // Если на этом ходу была съедена фигура
    if (move.captured) {
      const capturedPiece = { type: move.captured, color: move.color === 'w' ? 'b' : 'w' };
      if (capturedPiece.color === 'w') {
        captured.w.push(capturedPiece);
      } else {
        captured.b.push(capturedPiece);
      }
    }
    
    // Считаем материальный баланс
    const whiteMaterial = captured.b.reduce((sum, p) => sum + pieceValues[p.type], 0);
    const blackMaterial = captured.w.reduce((sum, p) => sum + pieceValues[p.type], 0);
    
    states.push({
      captured,
      advantage: {
        w: whiteMaterial > blackMaterial ? whiteMaterial - blackMaterial : 0,
        b: blackMaterial > whiteMaterial ? blackMaterial - whiteMaterial : 0,
      }
    });
  });

  gameStates.value = states;
}

const netCapturedPieces = computed(() => {
  const currentCaptured = currentGameState.value.captured;
  if (!currentCaptured) return { w: [], b: [] };

  const pieceTypes = ['p', 'n', 'b', 'r', 'q'];
  
  // Считаем, сколько фигур каждого типа съели белые (это черные фигуры)
  const whiteCaptureCounts = pieceTypes.reduce((acc, type) => {
    acc[type] = currentCaptured.b.filter(p => p.type === type).length;
    return acc;
  }, {});
  
  // Считаем, сколько фигур каждого типа съели черные (это белые фигуры)
  const blackCaptureCounts = pieceTypes.reduce((acc, type) => {
    acc[type] = currentCaptured.w.filter(p => p.type === type).length;
    return acc;
  }, {});

  const netWhiteCaptures = []; // Фигуры для панели белых (съеденные ими черные)
  const netBlackCaptures = []; // Фигуры для панели черных (съеденные ими белые)

  pieceTypes.forEach(type => {
    const diff = whiteCaptureCounts[type] - blackCaptureCounts[type];
    if (diff > 0) { // Белые съели больше фигур этого типа
      for (let i = 0; i < diff; i++) {
        netWhiteCaptures.push({ type, color: 'b' });
      }
    } else if (diff < 0) { // Черные съели больше
      for (let i = 0; i < -diff; i++) {
        netBlackCaptures.push({ type, color: 'w' });
      }
    }
  });

  // Сортируем фигуры по ценности для красивого отображения
  const sortValue = { q: 5, r: 4, b: 3, n: 2, p: 1 };
  netWhiteCaptures.sort((a, b) => sortValue[a.type] - sortValue[b.type]);
  netBlackCaptures.sort((a, b) => sortValue[a.type] - sortValue[b.type]);

  return { w: netWhiteCaptures, b: netBlackCaptures };
});

const currentGameState = computed(() => {
  return gameStates.value[currentPly.value] || {
    captured: { w: [], b: [] },
    advantage: { w: 0, b: 0 },
  };
});

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
    ? { name: game.value.black_name, rating: game.value.black_rating, color: 'b' }
    : { name: game.value.white_name, rating: game.value.white_rating, color: 'w' };
});

const bottomPlayer = computed(() => {
  if (!game.value) return {};
  return boardConfig.orientation === 'white'
    ? { name: game.value.white_name, rating: game.value.white_rating, color: 'w' }
    : { name: game.value.black_name, rating: game.value.black_rating, color: 'b' };
});

const toStart = () => { currentPly.value = 0; boardAPI?.viewHistory(0); scrollToMove(); };
const toEnd = () => { currentPly.value = moves.value.length; boardAPI?.viewHistory(moves.value.length); scrollToMove(); };
const next = () => { if (currentPly.value < moves.value.length) { currentPly.value++; boardAPI.viewHistory(currentPly.value); scrollToMove(); } };
const back = () => { if (currentPly.value > 0) { currentPly.value--; boardAPI.viewHistory(currentPly.value); scrollToMove(); } };
const goToMove = (plyIndex) => { currentPly.value = plyIndex + 1; boardAPI?.viewHistory(currentPly.value); scrollToMove(); };
const isCurrentMove = (index) => index === currentPly.value - 1;

const scrollToMove = () => {
  nextTick(() => {
    const container = scrollWrapper.value;
    if (!container) return;

    if (currentPly.value === 0) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const targetElement = movesContainer.value?.querySelector('.current-move');
    if (targetElement) {
      const centeredScrollTop = targetElement.offsetTop - (container.clientHeight / 2) + (targetElement.clientHeight / 2);
      const scrollTop = Math.max(0, centeredScrollTop);
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
    // boardAPI.drawMove('d2', 'd4', 'paleBlue')
  });
};

const isAnalysisEnabled = ref(false);
const multiPv = ref(3); // Управляем количеством линий
// const evaluationsByPly = ref([]);

const {
  isEngineLoaded,
  isAnalyzing,
  analysisResult,
  initEngine,
  startAnalysis,
  stopAnalysis,
  setMultiPV
} = useStockfish();

// const currentEvaluation = computed(() => {
//   return evaluationsByPly.value[currentPly.value] ?? 0;
// });

// async function analyzeCurrentPosition() {
//   console.log("ANALYZE")
//   if (isAnalyzing.value || !isAnalysisEnabled.value) return;
//   if (evaluationsByPly.value[currentPly.value] !== undefined) return;

//   isAnalyzing.value = true;
  
//   const tempChess = new Chess();
//   try {
//     for (let i = 0; i < currentPly.value; i++) {
//       tempChess.move(moves.value[i].san);
//     }
//     const fen = tempChess.fen();
    
//     // Оборачиваем вызов в try...catch на случай, если Promise будет отклонен
//     sendCommand("position fen " + fen)
//     sendCommand("go depth 20")

//     // const evaluation = await stockfishService.getEvaluation(fen);

//     // const newEvals = [...evaluationsByPly.value];
//     // newEvals[currentPly.value] = evaluation;
//     // evaluationsByPly.value = newEvals;

//   } catch (error) {
//     console.error("Ошибка при запросе оценки:", error);
//   } finally {
//     isAnalyzing.value = false;
//   }
// }

// Следим за загрузкой движка, чтобы запустить анализ после инициализации
watch(isEngineLoaded, (loaded) => {
  if (loaded && isAnalysisEnabled.value) {
    analyzeCurrentPosition();
  }
});

// Следим за сменой хода и перезапускаем анализ
watch(currentPly, () => {
  boardAPI?.hideMoves();
  if (isAnalysisEnabled.value) {
    analyzeCurrentPosition();
  }
});

// Следим за изменением MultiPV и перезапускаем анализ, если он активен
watch(multiPv, (newCount) => {
    setMultiPV(newCount);
    if(isAnalysisEnabled.value && isEngineLoaded.value) {
        analyzeCurrentPosition();
    }
});

/**
 * Преобразует историю ходов до currentPly в UCI-строку.
 */
const getMovesUciString = () => {
  // chess.js использует 'lan' для UCI-подобной нотации, это то, что нам нужно.
  return moves.value
    .slice(0, currentPly.value)
    .map(move => move.from + move.to + (move.promotion || ''))
    .join(' ');
};

// --- ИНИЦИАЛИЗАЦИЯ ДВИЖКА С CALLBACK'ОМ ---
// Вызываем это в toggleAnalysis или onMounted
function initializeEngine() {
  if (isEngineLoaded.value) return;

  // Передаем функцию, которая будет вызвана с лучшим ходом
  initEngine((bestMoveUci) => {
    // Используем nextTick для максимальной безопасности
    nextTick(() => {
      if (!boardAPI) return;
      
      const from = bestMoveUci.substring(0, 2);
      const to = bestMoveUci.substring(2, 4);
      console.log(from)
      console.log(to)

      // boardAPI?.drawMove(from, to, 'g');
      boardAPI.drawMove(from, to, 'paleBlue')
      // boardAPI.setShapes([{
      //   orig: from,
      //   dest: to,
      //   brush: 'g' // Зеленая стрелка
      // }]);
    });
  });
}

function toggleAnalysis() {
  isAnalysisEnabled.value = !isAnalysisEnabled.value;
  if (isAnalysisEnabled.value) {
    if (!isEngineLoaded.value) {
      // initializeEngine()
      initEngine();
    } else {
      analyzeCurrentPosition();
    }
  } else {
    stopAnalysis();
    boardAPI.hideMoves()
  }
}
watch(isAnalysisEnabled, (isNowEnabled) => {
  if (isNowEnabled) {
    // Логика ВКЛЮЧЕНИЯ анализа
    if (!isEngineLoaded.value) {
      initEngine();
    } else {
      analyzeCurrentPosition();
    }
  } else {
    stopAnalysis();
    boardAPI.hideMoves()
  }
});

// === ВИЗУАЛИЗАЦИЯ НА ДОСКЕ ===
// Следим за результатами анализа, чтобы нарисовать стрелку
watch(
  () => analysisResult.value.lines[0]?.pv,
  (bestLine) => {
    if (isAnalysisEnabled.value && bestLine && bestLine.length > 0) {
      const bestMoveUci = bestLine[0];
      const from = bestMoveUci.substring(0, 2);
      const to = bestMoveUci.substring(2, 4);
      
      // Используем API vue3-chessboard для рисования
      boardAPI?.hideMoves();
      boardAPI.drawMove(from, to, 'paleBlue')
      // boardAPI?.drawArrow(from, to, 'd'); // 'd' - цвет по умолчанию (зеленый)
    }
  },
  { deep: true }
);
// // === ВИЗУАЛИЗАЦИЯ НА ДОСКЕ ===
// // Следим за результатами анализа, чтобы нарисовать стрелку
// watch(
//   () => analysisResult.value.lines[0]?.pv,
//   (bestLine) => {
//     // 2. Оборачиваем всю логику в nextTick
//     nextTick(() => {
//       // Защита: убедимся, что boardAPI все еще существует на момент выполнения
//       if (!boardAPI) return; 

//       if (isAnalysisEnabled.value && bestLine && bestLine.length > 0) {
//         const bestMoveUci = bestLine[0];

//         // Дополнительная защита: убедимся, что ход имеет корректный формат
//         if (typeof bestMoveUci === 'string' && bestMoveUci.length >= 4) {
//           const from = bestMoveUci.substring(0, 2);
//           const to = bestMoveUci.substring(2, 4);

//           // // Рисуем зеленую стрелку для лучшего хода
//           // boardAPI.setShapes([{
//           //   orig: from,
//           //   dest: to,
//           //   brush: 'g'
//           // }]);
//         }
//       } else if (isAnalysisEnabled.value) {
//         // Если анализ включен, но линий нет, очищаем доску
//         boardAPI.setShapes([]);
//       }
//     });
//   },
//   { deep: true }
// );

// Передаем оценку в EvaluationBar с учетом хода
const currentEvaluation = computed(() => {
  if (!isAnalysisEnabled.value) return 0;
  // const turn = moves.value[currentPly.value]?.color === 'b' ? 'b' : 'w';
  // console.log(turn)
  const score = analysisResult.value.score;
  // Stockfish дает оценку с точки зрения текущего игрока.
  // Нам нужно нормализовать ее: положительная = преимущество белых.
  return currentTurn.value === 'w' ? score : -score;
});

const currentTurn = computed(() => {
  // Ply (полуход) 0 - ход белых. Ply 1 - ход черных. Ply 2 - ход белых, и т.д.
  // Четные полуходы (0, 2, 4...) - ход белых ('w').
  // Нечетные (1, 3, 5...) - ход черных ('b').
  return currentPly.value % 2 === 0 ? 'w' : 'b';
});

const handleKeyDown = (event) => {
  if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); back(); }
};
onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* --- Стили макета --- */

.desktop-layout-container {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  width: 100%;
  max-width: 1400px;
  margin-left: auto;
  padding: 0 16px;
}

.board-column {
  flex: 1 1 auto;
  min-width: 0; /* Позволяет flex-элементу сжиматься меньше его контента */
  max-width: 85vh;
}

.info-column {
  flex: 0 0 380px;
  height: fit-content;
}

.mobile-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); 
}

.board-area {
  flex-shrink: 0;
}

.info-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* --- Стили компонентов --- */

.desktop-info-card {
  height: 100%;
  max-height: 560px;
}

.moves-scroll-area {
  flex: 1; 
  overflow-y: auto; 
  min-height: 0; /* Важно для корректной работы overflow в flex-контейнере */
}

.moves-container {
  position: relative; /* Создает контекст позиционирования для offsetTop дочерних элементов */
}

/* --- Стили списка ходов --- */

.turn-row {
  font-family: 'Roboto Mono', monospace;
  margin-bottom: 2px;
}
.move-number {
  flex-basis: 40px;
  text-align: right;
  padding-right: 8px;
  font-size: 0.9em;
}
.move-item {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s ease-in-out;
  font-size: 1.1em;
  white-space: nowrap;
}
.move-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}
.current-move {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.current-move:hover {
  background-color: rgb(var(--v-theme-primary)) !important;
}

/* --- Переопределение стилей дочерних компонентов --- */

.board-column :deep(.main-wrap) {
  width: 100% !important;
  height: auto !important; 
}

.board-wrapper {
  position: relative;
  padding: 0 8px; /* Добавляем отступы по бокам */
}
.eval-bar-wrapper {
  border: 2px solid;
  border-color: #e0e0e0;
  position: absolute;
  left: -30px; /* Позиционируем внутри отступа */
  top: 0;
  bottom: 0;
  width: 25px; /* Делаем шкалу чуть тоньше */
  z-index: 1; /* На всякий случай, чтобы была поверх доски */
}
</style>