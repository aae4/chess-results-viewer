// Загружаем stockfish.wasm.js из public/
importScripts('/stockfish/stockfish.wasm.js');

// Теперь глобально доступна функция Stockfish()
const engine = Stockfish();
console.log(engine)

// Пересылаем сообщения движка обратно компоненту
engine.onmessage = (event) => {
  postMessage(event.data);
};

// И пересылаем команды из компонента в движок
onmessage = (e) => {
  engine.postMessage(e.data);
};