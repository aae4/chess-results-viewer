import { ref, shallowRef, watch, onUnmounted } from 'vue';
import loadEngine from '@/services/loadEngine.js';

export function useStockfish() {
  // Используем shallowRef, так как сам объект движка не должен быть реактивным
  const engine = shallowRef(null);
  const isEngineLoaded = ref(false);
  const isAnalyzing = ref(false);

  // Реактивные переменные для хранения результатов анализа
  const analysisResult = ref({
    score: 0,
    mate: null, // e.g., 3 (mate in 3) or -2 (getting mated in 2)
    depth: 0,
    lines: [], // [{ score: 0.5, pv: ['e2e4', 'e7e5'] }]
  });

  // let onBestMoveCallback = null; скорее всего не понадобится

  // --- Приватные функции ---

  // /**
  //  * Универсальный обработчик вывода от движка.
  //  * @param {string} line - Строка вывода.
  //  */
  // const handleEngineOutput = (line) => {
  //   // 1. ПАРСИМ 'info' для обновления UI (оценка, глубина, варианты)
  //   if (line.startsWith('info')) {
  //       const parts = line.split(' ');
  //       const newLines = [...analysisResult.value.lines];
  //       let updated = false;

  //       const depthIndex = parts.indexOf('depth');
  //       const scoreIndex = parts.indexOf('score');
  //       const multipvIndex = parts.indexOf('multipv');
  //       const pvIndex = parts.indexOf('pv');

  //       if (depthIndex === -1 || scoreIndex === -1 || pvIndex === -1) return;

  //       const currentDepth = parseInt(parts[depthIndex + 1], 10);
  //       analysisResult.value.depth = currentDepth;

  //       const pv = parts.slice(pvIndex + 1);
  //       const lineIndex = multipvIndex !== -1 ? parseInt(parts[multipvIndex + 1], 10) - 1 : 0;
        
  //       let score = 0;
  //       let mate = null;

  //       const scoreType = parts[scoreIndex + 1];
  //       const scoreValue = parseInt(parts[scoreIndex + 2], 10);

  //       if (scoreType === 'cp') {
  //         score = scoreValue / 100;
  //       } else if (scoreType === 'mate') {
  //         mate = scoreValue;
  //         // Даем мату очень большую, но не бесконечную оценку для EvaluationBar
  //         score = scoreValue > 0 ? 300 : -300; 
  //       }

  //       // Обновляем или добавляем линию
  //       newLines[lineIndex] = { score, mate, pv };
  //       updated = true;
        
  //       if (updated) {
  //         analysisResult.value.lines = newLines;
  //         // Обновляем главный счетчик по первой линии
  //         if (lineIndex === 0) {
  //           analysisResult.value.score = score;
  //           analysisResult.value.mate = mate;
  //         }
  //       }
  //   }

  //   // 2. ОТЛАВЛИВАЕМ 'bestmove' для рисования на доске
  //   if (line.startsWith('bestmove')) {
  //     console.log("isAnalyzing " + isAnalyzing);
  //     const parts = line.split(' ');
  //     const bestMoveUci = parts[1];
      
  //     // Если есть ход и есть callback, вызываем его
  //     if (bestMoveUci && bestMoveUci !== '(none)' && onBestMoveCallback) {
  //       onBestMoveCallback(bestMoveUci);
  //     }
      
  //     // Анализ завершен
  //     isAnalyzing.value = false;
  //     console.log("isAnalyzing " + isAnalyzing);
  //   }
  // };

  /**
   * Продвинутый парсер вывода Stockfish.
   * Обрабатывает MultiPV, сантипешки (cp) и мат (mate).
   * @param {string} line - Строка вывода от движка.
   */
  const parseInfoLine = (line) => {
    // console.log(line)
    if (line.startsWith('info')) {
        const parts = line.split(' ');
        const newLines = [...analysisResult.value.lines];
        let updated = false;

        const depthIndex = parts.indexOf('depth');
        const scoreIndex = parts.indexOf('score');
        const multipvIndex = parts.indexOf('multipv');
        const pvIndex = parts.indexOf('pv');

        if (depthIndex === -1 || scoreIndex === -1 || pvIndex === -1) return;

        const currentDepth = parseInt(parts[depthIndex + 1], 10);
        analysisResult.value.depth = currentDepth;

        const pv = parts.slice(pvIndex + 1);
        const lineIndex = multipvIndex !== -1 ? parseInt(parts[multipvIndex + 1], 10) - 1 : 0;
        
        let score = 0;
        let mate = null;

        const scoreType = parts[scoreIndex + 1];
        const scoreValue = parseInt(parts[scoreIndex + 2], 10);

        if (scoreType === 'cp') {
          score = scoreValue / 100;
        } else if (scoreType === 'mate') {
          mate = scoreValue;
          // Даем мату очень большую, но не бесконечную оценку для EvaluationBar
          score = scoreValue > 0 ? 300 : -300; 
        }

        // Обновляем или добавляем линию
        newLines[lineIndex] = { score, mate, pv };
        updated = true;
        
        if (updated) {
          analysisResult.value.lines = newLines;
          // Обновляем главный счетчик по первой линии
          if (lineIndex === 0) {
            analysisResult.value.score = score;
            analysisResult.value.mate = mate;
          }
        }
    }    
    if (line.startsWith('bestmove')) {
      isAnalyzing.value = false;
    }
  };


  // --- Публичные методы ---

  /**
   * Инициализирует движок Stockfish.
   */
  const initEngine = () => {
    if (engine.value || isEngineLoaded.value) return;

    console.log("Loading Stockfish engine...");
    engine.value = loadEngine('stockfish.wasm.js');
    engine.value.stream = (data) => {
      // console.log("SF:", data); // Для отладки
      parseInfoLine(data);
    };
    
    engine.value.send('uci', (response) => {
      if (response.includes('uciok')) {
        engine.value.send('isready', (isreadyResponse) => {
          if (isreadyResponse.includes('readyok')) {
            console.log("Stockfish is ready.");
            isEngineLoaded.value = true;
            // TODO: возможно лучше поставить минималки по умолчанию и сделать настраивамым в интерфейсе
            engine.value.send('setoption name Threads value 4');
            engine.value.send('setoption name MultiPV value 3');
          }
        });
      }
    });
  };
  // /**
  //  * Инициализирует движок Stockfish. Версия с колбэком на нахождение лучшего хода
  //  * скорее всего не нужно, потому что лучший ход находим по первой линии движка
  //  */
  // const initEngine = (onBestMoveFound) => {
  //   if (engine.value || isEngineLoaded.value) return;

  //   onBestMoveCallback = onBestMoveFound;

  //   console.log("Loading Stockfish engine...");
  //   engine.value = loadEngine('stockfish.wasm.js');
  //   engine.value.stream = (data) => {
  //     // console.log("SF:", data); // Для отладки
  //     handleEngineOutput(data);
  //   };
    
  //   engine.value.send('uci', (response) => {
  //     if (response.includes('uciok')) {
  //       engine.value.send('isready', (isreadyResponse) => {
  //         if (isreadyResponse.includes('readyok')) {
  //           console.log("Stockfish is ready.");
  //           isEngineLoaded.value = true;
  //           // Можно установить базовые опции
  //           engine.value.send('setoption name Threads value 4');
  //           engine.value.send('setoption name MultiPV value 3');
  //         }
  //       });
  //     }
  //   });
  // };

  /**
   * Запускает анализ для указанной FEN-позиции.
   * (Оставляем его как вспомогательный, но основной будет другой)
   */
  const startAnalysisFromFen = (fen, multiPvCount = 3) => {
    if (!engine.value || !isEngineLoaded.value) return;

    stopAnalysis();
    
    analysisResult.value = { score: 0, mate: null, depth: 0, lines: [] };
    isAnalyzing.value = true;
    engine.value.send(`setoption name MultiPV value ${multiPvCount}`);
    engine.value.send(`position fen ${fen}`);
    engine.value.send('go depth 20');
  };

  /**
   * Запускает анализ из начальной позиции с последовательностью ходов.
   * Это канонический способ из примера.
   * @param {string} movesString - Строка ходов в UCI-нотации, разделенных пробелом (e.g., 'e2e4 e7e5 g1f3').
   * @param {number} multiPvCount - Количество линий для анализа.
   */
  const startAnalysisFromMoves = (movesString, multiPvCount = 3) => {
    if (!engine.value || !isEngineLoaded.value) return;

    stopAnalysis();

    analysisResult.value = { score: 0, mate: null, depth: 0, lines: [] };
    isAnalyzing.value = true;
    engine.value.send(`setoption name MultiPV value ${multiPvCount}`);
    // Формат команды, как в примере из документации
    engine.value.send(`position startpos moves ${movesString}`);
    engine.value.send('go depth 20');
  };

  /**
   * Останавливает текущий анализ.
   */
  const stopAnalysis = () => {
    if (!engine.value || !isAnalyzing.value) return;
    engine.value.send('stop');
    isAnalyzing.value = false;
  };
  
  /**
   * Устанавливает количество анализируемых линий.
   * @param {number} count - Количество линий (MultiPV).
   */
  const setMultiPV = (count) => {
    if (!engine.value) return;
    engine.value.send(`setoption name MultiPV value ${count}`);
  };


  /**
   * Корректно выгружает движок при размонтировании компонента.
   */
  onUnmounted(() => {
    if (engine.value) {
      stopAnalysis();
      engine.value.quit();
      console.log("Stockfish engine terminated.");
    }
  });

  return {
    isEngineLoaded,
    isAnalyzing,
    analysisResult,
    initEngine,
    startAnalysis: startAnalysisFromMoves, // Экспортируем новый метод как основной
    startAnalysisFromFen, // Оставляем старый на всякий случай, надо проверить какой лучше
    stopAnalysis,
    setMultiPV
  };
}