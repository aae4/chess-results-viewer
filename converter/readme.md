### Подготовка к запуску

1.  **Установите библиотеки:** Убедитесь, что у вас установлены все зависимости.
    ```bash
    pip install pandas openpyxl aiohttp beautifulsoup4 lxml tqdm
    ```
2.  **Подготовьте файлы:**
    *   Положите ваш Excel-файл с турнирами в корень проекта под именем `tournaments_base.xlsx`.
    *   Положите ваш большой PGN-файл в корень проекта под именем `full_pgn_base.pgn`.
3.  **Запустите скрипт:**
    ```bash
    python converter.py
    ```