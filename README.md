# Chess Results Viewer

Статическое SPA-приложение для просмотра результатов и статистики шахматных турниров.
Проект заточен под хостинг на GitHub Pages, использует **Vue 3** и работает с базой данных SQLite прямо в браузере через **HTTP Range Requests** (без бэкенда).

[Открыть демо](https://aae4.github.io/chess-results-viewer)

## Особенности и архитектура

*   **Serverless Database:** Данные хранятся в `database.sqlite`. Клиент использует библиотеку `sql.js-httpvfs` для выполнения SQL-запросов к статическому файлу базы данных, подгружая только необходимые страницы памяти. Это позволяет работать с большими объемами данных без API-сервера.
*   **Аналитика и Графики:** Построение графиков рейтинга (`chart.js`), расчет перфоманса, статистика по дебютам (ECO codes) и Head-to-Head сравнения.
*   **Stockfish в браузере:** Анализ партий на стороне клиента с помощью WebAssembly версии Stockfish.
*   **UI/UX:**
    *   Полная адаптивность (Mobile First подход).
    *   Темная/Светлая тема.
    *   Просмотр партий с поддержкой PGN, навигацией клавиатурой и оценкой движка.
    *   Роутинг через `vue-router` (архитектура Master-Detail).

## Стек технологий

*   **Core:** Vue 3 (Script Setup), Vite.
*   **State Management:** Pinia.
*   **UI:** Vuetify 3, Material Design Icons.
*   **Data:** sql.js-httpvfs (SQLite over HTTP), Axios.
*   **Chess Logic:** chess.js, vue3-chessboard, stockfish.js (WASM).

## Структура проекта

```bash
src/
├── components/    # UI-компоненты (графики, доска, карточки)
├── services/      # Слои доступа к данным (database.js, stockfishService.js)
├── stores/        # Pinia сторы (playerStore, tournamentStore)
├── utils/         # Хелперы и форматтеры
├── views/         # Основные страницы (Home, PlayerProfile, GameView)
└── App.vue        # Root layout
public/
└── database.sqlite # Основная БД (обновляется скриптом/вручную)
```

## Установка и запуск

Требуется Node.js 18+.

1. **Установка зависимостей:**
   ```bash
   npm install
   ```

2. **Запуск локального сервера:**
   ```bash
   npm run dev
   ```
   or 
   ```bash
   npm run dev -- --host
   ```

3. **Сборка для продакшена:**
   ```bash
   npm run build
   ```

3.1 **Превью**
   ```bash
   npm run preview
   ```

## Деплой

Проект настроен для автоматического деплоя на GitHub Pages.
Билд создается в папку `dist`, которая пушится в ветку `gh-pages`.

```bash
npm run deploy
```
*Убедитесь, что в `vite.config.js` корректно указан `base` (название репозитория).*

## TODO / Планы

* [ ] Оптимизация SQL запросов для мобильных устройств.
* [ ] Кеширование базы данных (Service Workers).
* [ ] Улучшение UX навигации по дебютной книге.

---
License: MIT