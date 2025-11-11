import sqlite3
import pandas as pd
import re
import aiohttp
import asyncio
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from tqdm.asyncio import tqdm_asyncio
import logging
import random
from datetime import datetime

DB_NAME = 'database_test.sqlite'
EXCEL_FILE = 'tournaments_base.xlsx'
PGN_FILE = 'full_pgn_base.pgn'
MAX_CONCURRENT_REQUESTS = 10  # ОГРАНИЧЕНИЕ ПАРАЛЛЕЛЬНЫХ ЗАПРОСОВ

# Настройка логирования для отладки
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# СХЕМА БАЗЫ ДАННЫХ ---
DB_SCHEMA = """
CREATE TABLE IF NOT EXISTS tournaments (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT NOT NULL,
    site              TEXT,
    start_date        TEXT,
    end_date          TEXT,
    tnr_id            INTEGER UNIQUE,
    federation        TEXT,
    city              TEXT,
    organizer         TEXT,
    arbiter           TEXT,
    time_control      TEXT,
    rounds_count      INTEGER,
    tournament_type   TEXT
);
CREATE TABLE IF NOT EXISTS players (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    canonical_name    TEXT NOT NULL,
    fide_id           INTEGER UNIQUE,
    national_id       INTEGER UNIQUE,
    birth_year        INTEGER,
    federation        TEXT,
    name_key          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_performances (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id               INTEGER NOT NULL,
    tournament_id           INTEGER NOT NULL,
    starting_rank           INTEGER,
    rating_at_tournament    INTEGER,
    final_rank              INTEGER,
    score                   REAL,
    performance_rating      INTEGER,
    rating_change           REAL,
    club_city               TEXT,
    UNIQUE (player_id, tournament_id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);
CREATE TABLE IF NOT EXISTS games (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id         INTEGER NOT NULL,
    white_performance_id  INTEGER NOT NULL,
    black_performance_id  INTEGER NOT NULL,
    round                 TEXT,
    board                 TEXT,
    result                TEXT,
    game_date             TEXT,
    eco_code              TEXT,
    pgn_moves             TEXT,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (white_performance_id) REFERENCES player_performances(id),
    FOREIGN KEY (black_performance_id) REFERENCES player_performances(id)
);
CREATE INDEX IF NOT EXISTS idx_tournaments_tnr_id ON tournaments(tnr_id);
CREATE INDEX IF NOT EXISTS idx_players_fide_id ON players(fide_id);
CREATE INDEX IF NOT EXISTS idx_players_national_id ON players(national_id);
CREATE INDEX IF NOT EXISTS idx_players_name_key ON players(name_key);
CREATE INDEX IF NOT EXISTS idx_performances_player_tournament ON player_performances(player_id, tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_tournament_id ON games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
"""

def safe_int(value):
    try: return int(str(value).strip())
    except (ValueError, TypeError): return None

def safe_float(value):
    try: return float(str(value).strip().replace(',', '.'))
    except (ValueError, TypeError): return None

def create_db(conn):
    logging.info("Создание схемы базы данных...")
    cursor = conn.cursor()
    cursor.executescript(DB_SCHEMA)
    conn.commit()
    logging.info("Схема создана/проверена успешно.")

def normalize_tournament_name(name: str) -> str:
    """Приводит название турнира к каноническому виду для надежного сопоставления."""
    if not isinstance(name, str):
        return ""
    # 1. Переводим в нижний регистр и убираем пробелы по краям
    text = name.lower().strip()
    # 2. Убираем ВСЕ символы, кроме букв (русских и английских), цифр и пробелов
    text = re.sub(r'[^a-zа-я0-9\s]', '', text)
    # 3. Заменяем множественные пробелы на один
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def normalize_player_name_key(name: str) -> str:
    """Создает надежный, нормализованный ключ из имени игрока."""
    if not isinstance(name, str): return ""
    
    text = name.lower()
    text = re.sub(r'\(.*?\)', '', text).strip() # Удаляем "(Московская область)" и т.п.
    
    # Обрабатываем "Фамилия, Имя Отчество" -> "Фамилия Имя Отчество"
    if ',' in text:
        parts = text.split(',', 1)
        text = f"{parts[0].strip()} {parts[1].strip()}"
        
    # Убираем всю пунктуацию и лишние пробелы
    text = re.sub(r'[^a-zа-я0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Возвращаем "фамилия_имя"
    parts = text.split()
    if len(parts) >= 2:
        return f"{parts[0]}_{parts[1]}"
    elif len(parts) == 1:
        return parts[0]
    return ""

def find_or_create_player(conn, name, fide_id, national_id, birth_year=None, federation=None):
    cursor = conn.cursor()
    player_id = None
    
    # Корректная обработка FIDE ID = '0'
    fide_id = None if fide_id == '0' else fide_id

    # Корректная обработка ФШР ID = '0'
    national_id = None if national_id == '0' else national_id
    
    if fide_id:
        cursor.execute("SELECT id FROM players WHERE fide_id = ?", (fide_id,))
        res = cursor.fetchone()
        if res: player_id = res[0]
    if not player_id and national_id:
        cursor.execute("SELECT id FROM players WHERE national_id = ?", (national_id,))
        res = cursor.fetchone()
        if res: player_id = res[0]
    
    if not player_id:
        name_key = normalize_player_name_key(name)
        if name_key:
            cursor.execute("SELECT id FROM players WHERE name_key = ?", (name_key,))
            res = cursor.fetchone()
            if res: player_id = res[0]

    if player_id:
        cursor.execute("SELECT canonical_name, fide_id, national_id, birth_year, federation FROM players WHERE id = ?", (player_id,))
        existing = dict(zip([column[0] for column in cursor.description], cursor.fetchone()))
        
        updates = []
        params = []

        if len(name) > len(existing['canonical_name']):
            updates.append("canonical_name = ?")
            params.append(name)
        if fide_id and not existing['fide_id']:
            updates.append("fide_id = ?")
            params.append(fide_id)
        if national_id and not existing['national_id']:
            updates.append("national_id = ?")
            params.append(national_id)
        if birth_year and not existing['birth_year']:
            updates.append("birth_year = ?")
            params.append(safe_int(birth_year))
        if federation and not existing['federation']:
            updates.append("federation = ?")
            params.append(federation)
            
        if updates:
            params.append(player_id)
            cursor.execute(f"UPDATE players SET {', '.join(updates)} WHERE id = ?", tuple(params))
        
        return player_id
    else:
        name_key = normalize_player_name_key(name)
        cursor.execute("""
            INSERT INTO players (canonical_name, fide_id, national_id, birth_year, federation, name_key)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (name, fide_id, national_id, safe_int(birth_year), federation, name_key))
        return cursor.lastrowid

def load_excel_base():
    logging.info(f"Загрузка базы турниров из {EXCEL_FILE}...")
    try:
        df = pd.read_excel(EXCEL_FILE, usecols=['Турнир', 'DB-Key'])
        df.dropna(subset=['Турнир', 'DB-Key'], inplace=True)
        df['DB-Key'] = pd.to_numeric(df['DB-Key'], errors='coerce').astype('Int64')
        df.dropna(subset=['DB-Key'], inplace=True)
        tournaments_map = {normalize_tournament_name(row['Турнир']): row['DB-Key'] for _, row in df.iterrows()}
        logging.info(f"Загружено {len(tournaments_map)} турниров из Excel.")
        return tournaments_map
    except Exception as e:
        logging.error(f"Ошибка при чтении Excel файла: {e}")
        return {}

def parse_pgn_file():
    logging.info(f"Парсинг PGN-базы из {PGN_FILE} с дедупликацией...")
    try:
        with open(PGN_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        logging.error(f"Файл {PGN_FILE} не найден!")
        return {}

    # 1. Первичный парсинг всех игр в плоский список
    all_pgn_games = []
    raw_games = content.strip().split('\n\n[Event')
    raw_games = [raw_games[0]] + ['[Event' + game for game in raw_games[1:]]
    
    for game_text in raw_games:
        if not game_text.strip(): continue
        game_data = {}
        headers = re.findall(r'\[(\w+)\s+"(.*?)"\]', game_text)
        for key, value in headers:
            game_data[key.lower()] = value
        
        moves_match = re.search(r'\n\n(1\..*)', game_text, re.DOTALL)
        if moves_match:
            game_data['moves'] = re.sub(r'\s+', ' ', moves_match.group(1).replace('\n', ' ')).strip()
        
        if 'event' in game_data and 'white' in game_data and 'black' in game_data:
            all_pgn_games.append(game_data)
            
    total_games_found = len(all_pgn_games)
    logging.info(f"Найдено всего {total_games_found} записей о партиях в PGN.")

    # 2. Группировка с дедупликацией
    # Структура: {'название_турнира': {уникальный_ключ_партии: данные_партии}}
    tournaments_from_pgn = {}
    for game in all_pgn_games:
        event_name = game['event'].strip()
        
        # Если турнир встречается впервые, создаем для него словарь
        if event_name not in tournaments_from_pgn:
            tournaments_from_pgn[event_name] = {}
            
        # Создаем уникальный, не зависящий от цвета ключ для партии
        white_key = normalize_player_name_key(game['white'])
        black_key = normalize_player_name_key(game['black'])
        game_key = tuple(sorted((white_key, black_key)))
        
        # Добавляем/перезаписываем партию. Последняя встреченная запись останется.
        tournaments_from_pgn[event_name][game_key] = game
        
    # 3. Преобразуем словари партий обратно в списки
    final_tournaments = {}
    total_unique_games = 0
    for name, games_dict in tournaments_from_pgn.items():
        unique_games_list = list(games_dict.values())
        final_tournaments[name] = unique_games_list
        total_unique_games += len(unique_games_list)
        
    logging.info(f"Найдено {len(final_tournaments)} уникальных турниров.")
    logging.info(f"После дедупликации осталось {total_unique_games} уникальных партий (удалено {total_games_found - total_unique_games} дубликатов).")
    
    return final_tournaments

def create_matching_key(name):
    if not name: return ""
    name = name.lower()
    name = re.sub(r'\(.*?\)', '', name).strip() # Удаляем текст в скобках
    if ',' in name:
        parts = name.split(',', 1)
        lastname = parts[0].strip()
        firstname = parts[1].strip().split(' ', 1)[0].strip()
        return f"{lastname}_{firstname}"
    else:
        parts = name.split()
        return '_'.join(parts[:2])

def find_main_table(soup, keywords):
    """Поиск нужной таблицы по заголовку H2."""
    for h2 in soup.find_all('h2'):
        h2_text = h2.get_text(strip=True).lower()
        for keyword in keywords:
            if keyword in h2_text:
                element = h2.find_next_sibling()
                if element and element.name == 'table': return element
    return None

async def fetch_with_retries(session, url, retries=3, delay=2):
    """Асинхронно загружает URL с несколькими попытками и экспоненциальной задержкой."""
    if not url: return None
    headers = {'User-Agent': 'Mozilla/5.0'}
    for attempt in range(retries):
        try:
            async with session.get(url, headers=headers, timeout=20) as response:
                response.raise_for_status()
                return await response.text(encoding='utf-8', errors='ignore')
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            if attempt < retries - 1:
                wait_time = delay * (2 ** attempt) + random.uniform(0, 1) # Экспоненциальная задержка + случайность
                logging.warning(f"Попытка {attempt + 1}/{retries} не удалась для {url}. Ошибка: {e}. Повтор через {wait_time:.2f} сек...")
                await asyncio.sleep(wait_time)
            else:
                logging.error(f"Все {retries} попыток для {url} провалились. Ошибка: {e}")
                return None
    return None
# async def fetch_async(session, url):
#     if not url: return None
#     headers = {'User-Agent': 'Mozilla/5.0'}
#     try:
#         async with session.get(url, headers=headers, timeout=20) as response:
#             response.raise_for_status()
#             return await response.text(encoding='utf-8', errors='ignore')
#     except asyncio.TimeoutError:
#         logging.warning(f"Таймаут при загрузке {url}")
#         return None
#     except Exception as e:
#         logging.warning(f"Ошибка при загрузке {url}: {e}")
#         return None

def parse_cr_details_table(table_soup):
    """Универсальный парсер для таблиц ключ-значение на chess-results."""
    details = {}
    if not table_soup: return details
    for row in table_soup.find_all('tr'):
        cells = row.find_all('td')
        if len(cells) == 2:
            key = cells[0].get_text(strip=True)
            value = cells[1].get_text(strip=True)
            details[key] = value
    return details

def parse_tournament_details(soup):
    table = soup.find('td', class_='CR0').find('table')
    return parse_cr_details_table(table)  
# def parse_tournament_details(soup):
#     details = {}
#     table = soup.find('td', class_='CR0').find('table')
#     if table:
#         for row in table.find_all('tr'):
#             cells = row.find_all('td', class_='CR')
#             if len(cells) == 2:
#                 key = cells[0].get_text(strip=True).lower()
#                 value = cells[1].get_text(strip=True)
#                 details[key] = value
#     return {
#         'organizer': details.get('организатор(ы)'),
#         'federation': details.get('федерация'),
#         'arbiter': details.get('главный арбитр'),
#         'time_control': details.get('контроль времени (standard)'),
#         'city': details.get('город'),
#         'rounds_count': re.search(r'\d+', details.get('number of rounds', ''))
#     }

# def parse_participants(soup, base_url, tnr_id):
#     participants = []
#     table = soup.find('table', class_='CRs1')
#     if not table: return []
#     for row in table.find_all('tr', class_=['CRg1', 'CRg2']):
#         cells = row.find_all('td')
#         if len(cells) < 6: continue
        
#         name_cell = cells[2]
#         player_link = name_cell.find('a')
#         player_url = urljoin(base_url, player_link['href']) if player_link else None

#         participants.append({
#             'start_no': cells[0].get_text(strip=True),
#             'name': name_cell.get_text(strip=True),
#             'fide_id': cells[3].get_text(strip=True) or None,
#             'rating': cells[5].get_text(strip=True) or None,
#             'url': player_url
#         })
#     return participants

def parse_participants(soup, base_url, tnr_id):
    """Конструирует URL игроков вручную для надежности."""
    participants = []
    table = find_main_table(soup, ['стартовый список', 'starting list'])
    if not table: return []
    for row in table.find_all('tr', class_=['CRg1', 'CRg2']):
        cells = row.find_all('td')
        if len(cells) < 6: continue
        
        start_no = cells[0].get_text(strip=True)
        player_url = urljoin(base_url, f'tnr{tnr_id}.aspx?lan=11&art=9&snr={start_no}')
        
        participants.append({
            'start_no': start_no,
            'name': cells[2].get_text(strip=True),
            'fide_id': cells[3].get_text(strip=True) or None,
            'rating': cells[5].get_text(strip=True) or None,
            'url': player_url # Теперь здесь всегда будет корректный URL
        })
    return participants

# async def parse_player_details(session, player_data):
#     html = await fetch_async(session, player_data['url'])
#     if not html: return player_data # Возвращаем исходные данные
#     soup = BeautifulSoup(html, 'lxml')
#     table = soup.find('table', class_='CRs1')
#     if not table: return player_data
    
#     details = {}
#     for row in table.find_all('tr'):
#         cells = row.find_all('td')
#         if len(cells) == 2:
#             key = cells[0].get_text(strip=True).lower().replace(' ', '_').replace('.', '')
#             details[cells[0].get_text(strip=True)] = cells[1].get_text(strip=True)
    
#     player_data.update({
#         'national_id': details.get('Идент.Номер'),
#         'birth_year': details.get('Год рождения'),
#         'federation': details.get('Федерация'),
#         'score': details.get('Очки'),
#         'final_rank': details.get('Место'),
#         'performance_rating': details.get('Рейтинговый перфоманс')
#     })
#     return player_data

def create_header_map(header_row):
    """Создает карту 'название заголовка' -> 'индекс колонки'."""
    return {th.get_text(strip=True).lower(): i for i, th in enumerate(header_row.find_all('th'))}

async def parse_player_details(session, player_data, semaphore):
    """Использует семафор для ограничения параллельных запросов."""
    async with semaphore:
        html = await fetch_with_retries(session, player_data['url'])
    
    if not html:
        player_data['fetch_failed'] = True
        return player_data
        
    soup = BeautifulSoup(html, 'lxml')
    info_header = soup.find('h2', string=re.compile("Инфо игрока|Player info", re.IGNORECASE))
    if not info_header: return player_data
    
    info_table = info_header.find_next('table', class_='CRs1')
    details = parse_cr_details_table(info_table)
    
    player_data.update({
        'national_id': details.get('Идент.Номер'),
        'birth_year': details.get('Год рождения'),
        'federation': details.get('Федерация'),
        'score': details.get('Очки'),
        'final_rank': details.get('Место'),
        'performance_rating': details.get('Рейтинговый перфоманс'),
        'rating_change': details.get('Рейт.+/-'),
        'club_city': details.get('Клуб/Город')
    })

    games = []
    games_table = info_table.find_next('table', class_='CRs1')
    if games_table:
        header_row = games_table.find('tr', class_='CRg1b')
        if header_row:
            header_map = create_header_map(header_row)
            KEY_ROUND = next((k for k in header_map if k in ['тур', 'rd.']), None)
            KEY_BOARD = next((k for k in header_map if k in ['bo.', 'brd.']), None)
            KEY_OPPONENT = next((k for k in header_map if k in ['имя', 'name']), None)

        for row in games_table.find_all('tr', class_=['CRg1', 'CRg2']):
            cells = row.find_all('td')
            if len(cells) < 10: continue

            rn = None
            board = None
            opponent_name = None
            if KEY_ROUND: rn = cells[header_map[KEY_ROUND]].get_text(strip=True),
            if KEY_BOARD: board = cells[header_map[KEY_BOARD]].get_text(strip=True),
            if KEY_OPPONENT: opponent_name = cells[header_map[KEY_OPPONENT]].get_text(strip=True),

            # print("parsing:")
            # print()
            # print(rn)
            # print(board)
            games.append({
                'round': cells[header_map[KEY_ROUND]].get_text(strip=True) if KEY_ROUND else "?",
                'board': cells[header_map[KEY_BOARD]].get_text(strip=True) if KEY_BOARD else "?",
                'opponent_name': cells[header_map[KEY_OPPONENT]].get_text(strip=True) if KEY_OPPONENT else "",
            })
    player_data['games'] = games
    return player_data

# ОСНОВНОЙ ПРОЦЕСС КОНВЕРТАЦИИ ---

async def process_tournament(session, pgn_tournament_name, pgn_games, excel_map, conn, semaphore):
    normalized_name = normalize_tournament_name(pgn_tournament_name)
    tnr_id = excel_map.get(normalized_name)
    if not tnr_id:
        return f"Пропущен (нет в Excel): {pgn_tournament_name}"

    cursor = conn.cursor()
    try:
        async with semaphore:
            main_url = f"https://chess-results.com/tnr{tnr_id}.aspx?lan=11"
            main_html = await fetch_with_retries(session, main_url)
        if not main_html: return f"Ошибка загрузки: tnr{tnr_id}"
        
        main_soup = BeautifulSoup(main_html, 'lxml')
        details = parse_tournament_details(main_soup)

        participants = parse_participants(main_soup, main_url, tnr_id)

        if not participants:
            return f"Предупреждение: не найден список участников для tnr{tnr_id}"

        participant_tasks = [parse_player_details(session, p, semaphore) for p in participants]
        full_participants_data = await asyncio.gather(*participant_tasks)

        failed_details_count = sum(1 for p in full_participants_data if p.get('fetch_failed'))

        game_dates = []
        for game in pgn_games:
            date_str = game.get('date', '????.??.??').replace('.', '-')
            # Пытаемся преобразовать в объект datetime для корректной сортировки
            try:
                # Формат YYYY-MM-DD
                game_dates.append(datetime.strptime(date_str, '%Y-%m-%d'))
            except ValueError:
                continue # Игнорируем некорректные даты

        start_date = min(game_dates).strftime('%Y-%m-%d') if game_dates else None
        end_date = max(game_dates).strftime('%Y-%m-%d') if game_dates else start_date

        site = details.get('Место проведения')
        # 2. Запасной вариант - данные из PGN (берем из первой партии)
        if not site and pgn_games:
            site = pgn_games[0].get('site')

        all_rounds = [
            safe_int(game.get('round'))
            for p_data in full_participants_data
            for game in p_data.get('games', [])
            if safe_int(game.get('round')) is not None
        ]
        rounds_count = max(all_rounds) if all_rounds else 0

        cursor.execute("""
            INSERT OR IGNORE INTO tournaments (name, tnr_id, site, city, organizer, arbiter, time_control, federation, start_date, end_date, rounds_count) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pgn_tournament_name, tnr_id, site, details.get('Город'),
            details.get('Организатор(ы)'), details.get('Главный арбитр'), 
            details.get('Контроль времени (Standard)'), details.get('Федерация'),
            start_date, end_date, rounds_count
        ))
        cursor.execute("SELECT id FROM tournaments WHERE tnr_id = ?", (tnr_id,))
        tournament_id = cursor.fetchone()[0]

        perf_map_by_key = {}
        for p_data in full_participants_data:
            player_id = find_or_create_player(conn, p_data['name'], p_data.get('fide_id'), p_data.get('national_id'), p_data.get('birth_year'), p_data.get('federation'))
            # print(p_data['name'])
            # print(player_id)
            # print("===========================\n\n\n\n====================")
            cursor.execute("""
                INSERT OR IGNORE INTO player_performances 
                (player_id, tournament_id, starting_rank, rating_at_tournament, score, final_rank, performance_rating, club_city, rating_change)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                player_id, tournament_id, safe_int(p_data.get('start_no')), safe_int(p_data.get('rating')),
                safe_float(p_data.get('score')), safe_int(p_data.get('final_rank')), 
                safe_int(p_data.get('performance_rating')), p_data.get('club_city'), 
                safe_float(p_data.get('rating_change'))
            ))
            
            cursor.execute("SELECT id FROM player_performances WHERE player_id = ? AND tournament_id = ?", (player_id, tournament_id))
            perf_id = cursor.fetchone()[0]
            
            match_key = normalize_player_name_key(p_data['name'])
            # print(match_key)
            # print("---")
            perf_map_by_key[match_key] = perf_id

        # print(perf_map_by_key)

        scraped_games_map = {}
        for p_data in full_participants_data:
            player_key = normalize_player_name_key(p_data['name'])
            for game in p_data.get('games', []):
                opponent_key = normalize_player_name_key(game['opponent_name'])
                # print(player_key)
                # print(game['opponent_name'])
                # Ключ - пара игроков. Значение - объект с раундом и доской.
                game_key = tuple(sorted((player_key, opponent_key)))
                scraped_games_map[game_key] = {'round': game['round'], 'board': game['board']}

        # print(scraped_games_map)
        # print("\n=====================\n")
        # 2. Обогащаем и сохраняем партии
        for game_from_pgn in pgn_games:
            white_key = normalize_player_name_key(game_from_pgn['white'])
            black_key = normalize_player_name_key(game_from_pgn['black'])
            
            white_perf_id = perf_map_by_key.get(white_key)
            black_perf_id = perf_map_by_key.get(black_key)

            # print(white_key)
            # print(white_perf_id)
            # print(black_key)
            # print(black_perf_id)
            
            if white_perf_id and black_perf_id:
                game_key = tuple(sorted((white_key, black_key)))
                
                # Ищем обогащенные данные по паре игроков
                scraped_data = scraped_games_map.get(game_key)
                # print("SCRAP ")
                # print(scraped_data)
                
                # Используем данные с chess-results как приоритетные
                final_round = scraped_data.get('round', '?') if scraped_data else game_from_pgn.get('round', '?')
                final_board = scraped_data.get('board', '?') if scraped_data else '?'
                # print(final_round + " " + final_board)
                # print("\n")
                
                pgn_date = game_from_pgn.get('date', '????.??.??').replace('.', '-')

                cursor.execute("""
                    INSERT INTO games (tournament_id, white_performance_id, black_performance_id, round, board, result, eco_code, pgn_moves, game_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    tournament_id, white_perf_id, black_perf_id, final_round, final_board,
                    game_from_pgn['result'], game_from_pgn.get('eco'), game_from_pgn.get('moves'), pgn_date
                ))
        conn.commit()
        if failed_details_count > 0:
            return f"Успешно (но с {failed_details_count} ошибками загрузки карточек): {pgn_tournament_name} (tnr{tnr_id})"
        else:
            return f"Успешно: {pgn_tournament_name} (tnr{tnr_id})"

    except Exception as e:
        conn.rollback()
        logging.error(f"Критическая ошибка: {pgn_tournament_name} (tnr{tnr_id}) - {e}", exc_info=True)
        return f"Критическая ошибка: {pgn_tournament_name} (tnr{tnr_id}) - {e}"

async def main():
    logging.info("--- PGN в SQLite конвертер v3.3 (Надежная версия) ---")
    
    with sqlite3.connect(DB_NAME) as conn:
        create_db(conn)
        excel_map = load_excel_base()
        pgn_tournaments = parse_pgn_file()
        
        logging.info(f"Начало процесса. Ограничение параллельных запросов: {MAX_CONCURRENT_REQUESTS}")
        
        # === Создаем семафор ===
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
        
        tasks = []
        async with aiohttp.ClientSession() as session:
            for name, games in pgn_tournaments.items():
                # Передаем семафор в каждую задачу
                tasks.append(process_tournament(session, name, games, excel_map, conn, semaphore))
            
            for f in tqdm_asyncio.as_completed(tasks, desc="Обработка турниров"):
                result = await f
                logging.info(result)
            
    logging.info(f"--- Готово! База данных сохранена в файл {DB_NAME}. ---")

if __name__ == '__main__':
    asyncio.run(main())