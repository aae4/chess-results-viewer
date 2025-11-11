import sqlite3
import re
import aiohttp
import asyncio
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import logging
import argparse
import random
from datetime import datetime

### 1287717

# --- ГЛОБАЛЬНЫЕ НАСТРОЙКИ ---
DB_NAME = './database.sqlite'
MAX_CONCURRENT_REQUESTS = 10  # ОГРАНИЧЕНИЕ ПАРАЛЛЕЛЬНЫХ ЗАПРОСОВ

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def safe_int(value):
    try: return int(str(value).strip())
    except (ValueError, TypeError): return None

def safe_float(value):
    try: return float(str(value).strip().replace(',', '.'))
    except (ValueError, TypeError): return None

def normalize_player_name_key(name: str) -> str:
    if not isinstance(name, str): return ""
    text = name.lower()
    text = re.sub(r'\(.*?\)', '', text).strip()
    if ',' in text:
        parts = text.split(',', 1)
        text = f"{parts[0].strip()} {parts[1].strip()}"
    text = re.sub(r'[^a-zа-я0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    parts = text.split()
    return '_'.join(parts[:2]) if len(parts) >= 2 else (parts[0] if parts else "")

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

def find_main_table(soup, keywords):
    """Поиск нужной таблицы по заголовку H2."""
    for h2 in soup.find_all('h2'):
        h2_text = h2.get_text(strip=True).lower()
        for keyword in keywords:
            if keyword in h2_text:
                element = h2.find_next_sibling()
                if element and element.name == 'table': return element
    return None

def parse_games_txt():
    """Парсит games.txt и создает карту PGN для быстрого поиска."""
    logging.info("Парсинг файла games.txt...")
    try:
        with open('games.txt', 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        logging.warning("Файл games.txt не найден. Обновление PGN будет пропущено.")
        return {}
    
    pgn_map = {}
    # Разделяем на блоки по номеру в начале строки
    raw_games = re.split(r'\n(?=\d+\s)', content.strip())

    for raw_game in raw_games:
        lines = [line.strip() for line in raw_game.split('\n') if line.strip()]
        if len(lines) < 2: continue

        players_match = re.match(r'(.+?)\s*-\s*(.+)', lines[1])
        if not players_match: continue
        
        white_name, black_name = players_match.groups()
        white_key = normalize_player_name_key(white_name)
        black_key = normalize_player_name_key(black_name)
        
        moves_start_index = -1
        for i, line in enumerate(lines):
            if line.startswith('1.'):
                moves_start_index = i
                break
        if moves_start_index == -1: continue

        # Конвертируем русскую нотацию в стандартную
        pgn_moves_rus = ' '.join(lines[moves_start_index:])
        pgn_moves_std = pgn_moves_rus.replace('Кр', 'K').replace('Ф', 'Q').replace('Л', 'R').replace('С', 'B').replace('К', 'N').replace('[0:1]', '0-1').replace('[1:0]', '1-0').replace('[Ѕ:Ѕ]', '1/2-1/2')
        
        game_key = tuple(sorted((white_key, black_key)))
        pgn_map[game_key] = pgn_moves_std
        
    logging.info(f"Найдено {len(pgn_map)} партий в games.txt.")
    return pgn_map

async def parse_schedule(session, tnr_id):
    """
    Парсит страницу расписания.
    Возвращает кортеж: (карта { 'раунд': 'дата' }, общее количество туров).
    """
    schedule_url = f"https://chess-results.com/tnr{tnr_id}.aspx?lan=11&art=14"
    html = await fetch_with_retries(session, schedule_url)
    if not html:
        return {}, 0
    
    soup = BeautifulSoup(html, 'lxml')
    schedule_table = find_main_table(soup, ['расписание', 'schedule'])
    if not schedule_table:
        return {}, 0

    schedule_map = {}
    rows = schedule_table.find_all('tr')[1:] # Пропускаем заголовок
    for row in rows:
        cells = row.find_all('td')
        if len(cells) >= 2:
            round_num = cells[0].get_text(strip=True)
            date_str = cells[1].get_text(strip=True).replace('/', '-')
            schedule_map[round_num] = date_str
    
    rounds_count = len(rows) # Количество строк в таблице = количество туров
    logging.info(f"Загружено расписание для {rounds_count} туров.")
    return schedule_map, rounds_count

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

def parse_participants_and_games(soup, base_url, tnr_id):
    """
    Парсит и стартовый список, и все карточки игроков, возвращая единую структуру.
    """
    participants = []
    # 1. Парсим стартовый список для получения базовой информации
    start_list_table = find_main_table(soup, ['стартовый список', 'starting list'])
    if not start_list_table: return []
    for row in start_list_table.find_all('tr', class_=['CRg1', 'CRg2']):
        cells = row.find_all('td')
        if len(cells) < 6: continue
        start_no = cells[0].get_text(strip=True)
        player_url = urljoin(base_url, f'tnr{tnr_id}.aspx?lan=11&art=9&snr={start_no}')
        participants.append({
            'start_no': start_no,
            'name': cells[2].get_text(strip=True),
            'fide_id': cells[3].get_text(strip=True) or None,
            'rating': cells[5].get_text(strip=True) or None,
            'url': player_url
        })
    return participants

async def get_full_player_data(session, player_base_data, semaphore):
    """Асинхронно загружает и парсит детальную карточку игрока, включая ЦВЕТ ФИГУР."""
    async with semaphore:
        html = await fetch_with_retries(session, player_base_data['url'])
    
    if not html:
        player_base_data['fetch_failed'] = True
        return player_base_data
        
    soup = BeautifulSoup(html, 'lxml')
    info_header = soup.find('h2', string=re.compile("Инфо игрока|Player info", re.IGNORECASE))
    if not info_header: return player_base_data
    
    info_table = info_header.find_next('table', class_='CRs1')
    details = parse_cr_details_table(info_table)
    
    player_base_data.update({
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
        for row in games_table.find_all('tr', class_=['CRg1', 'CRg2']):
            cells = row.find_all('td')
            if len(cells) < 10: continue
            
            # --- Логика определения цвета ---
            color = None
            color_div = cells[9].find('div')
            if color_div:
                classes = color_div.get('class', [])
                if 'FarbewT' in classes:
                    color = 'w'
                elif 'FarbesT' in classes:
                    color = 'b'
            # --------------------------------
            result_text = cells[9].get_text(strip=True)
            if result_text == '1' and color == 'w' : result_text = "1-0";
            if result_text == '1' and color == 'b' : result_text = "0-1";
            if result_text == '0' and color == 'w' : result_text = "0-1"
            if result_text == '0' and color == 'b' : result_text = "1-0"
            if result_text == '½': result_text = "1/2-1/2"
            games.append({
                'round': cells[0].get_text(strip=True),
                'board': cells[1].get_text(strip=True),
                'opponent_name': cells[4].get_text(strip=True),
                'result': result_text if result_text and result_text != '-' else None,
                'color': color # <<<< Сохраняем найденный цвет
            })
    player_base_data['games'] = games
    return player_base_data
    
# ОСНОВНОЙ ПРОЦЕСС ОБНОВЛЕНИЯ ---

async def main(tnr_id):
    logging.info(f"--- Начало обновления для турнира tnr{tnr_id} ---")
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    conn.execute("PRAGMA foreign_keys = ON;") # Включаем проверку внешних ключей

    try:
        async with aiohttp.ClientSession() as session:
            # --- ЭТАП 1: ИЗВЛЕЧЕНИЕ (EXTRACT) ---
            logging.info("Этап 1: Извлечение данных...")
            
            main_url = f"https://chess-results.com/tnr{tnr_id}.aspx?lan=11"
            main_html = await fetch_with_retries(session, main_url)
            if not main_html: raise Exception("Не удалось загрузить главную страницу турнира.")
            main_soup = BeautifulSoup(main_html, 'lxml')
            
            # Параллельно грузим расписание и парсим games.txt
            schedule_task = asyncio.create_task(parse_schedule(session, tnr_id))
            pgn_map = parse_games_txt()
            
            tournament_cr_details = parse_cr_details_table(main_soup.find('td', class_='CR0').find('table'))
            participants_base = parse_participants_and_games(main_soup, main_url, tnr_id)
            if not participants_base: raise Exception("Не удалось найти список участников.")

            semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
            participant_tasks = [get_full_player_data(session, p, semaphore) for p in participants_base]
            full_participants_data = await asyncio.gather(*participant_tasks)
            
            schedule_map, rounds_count = await schedule_task # Дожидаемся загрузки расписания

            # --- ЭТАП 2: ЗАГРУЗКА И ОБНОВЛЕНИЕ (LOAD / UPDATE) ---
            logging.info("Этап 2: Обновление базы данных...")
            
            # UPSERT Турнира
            tournament_name = main_soup.find('h2').get_text(strip=True)
            all_dates = [v for v in schedule_map.values() if v]
            start_date = min(all_dates) if all_dates else None
            end_date = max(all_dates) if all_dates else start_date

            cursor.execute("SELECT id FROM tournaments WHERE tnr_id = ?", (tnr_id,))
            existing_tournament = cursor.fetchone()

            if not existing_tournament:
                cursor.execute("INSERT INTO tournaments (name, tnr_id, start_date, end_date, city, rounds_count) VALUES (?, ?, ?, ?, ?, ?)",
                               (tournament_name, tnr_id, start_date, end_date, tournament_cr_details.get('Город'), rounds_count))
                tournament_id = cursor.lastrowid
            else:
                tournament_id = existing_tournament[0]
                cursor.execute("UPDATE tournaments SET start_date = ?, end_date = ?, rounds_count = ? WHERE id = ?",
                               (start_date, end_date, rounds_count, tournament_id))

            # UPSERT Игроков и их Выступлений
            perf_map_by_key = {} # { 'ключ_имени': performance_id }
            perf_map_by_player_id = {} # { 'player_id': performance_id }

            for p_data in full_participants_data:
                player_id = find_or_create_player(conn, p_data['name'], p_data.get('fide_id'), p_data.get('national_id'), p_data.get('birth_year'), p_data.get('federation'))
                
                cursor.execute("SELECT id FROM player_performances WHERE player_id = ? AND tournament_id = ?", (player_id, tournament_id))
                existing_perf = cursor.fetchone()

                perf_data = (
                    safe_int(p_data.get('start_no')), safe_int(p_data.get('rating')), safe_float(p_data.get('score')),
                    safe_int(p_data.get('final_rank')), safe_int(p_data.get('performance_rating')),
                    p_data.get('club_city'), safe_float(p_data.get('rating_change'))
                )
                
                if not existing_perf:
                    cursor.execute("""
                        INSERT INTO player_performances (player_id, tournament_id, starting_rank, rating_at_tournament, score, final_rank, performance_rating, club_city, rating_change)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (player_id, tournament_id, *perf_data))
                    perf_id = cursor.lastrowid
                else:
                    perf_id = existing_perf[0]
                    cursor.execute("""
                        UPDATE player_performances SET starting_rank=?, rating_at_tournament=?, score=?, final_rank=?, performance_rating=?, club_city=?, rating_change=?
                        WHERE id = ?
                    """, (*perf_data, perf_id))
                
                match_key = normalize_player_name_key(p_data['name'])
                perf_map_by_key[match_key] = perf_id
                perf_map_by_player_id[player_id] = perf_id

            # UPSERT Партий
            processed_games = set()
            all_scraped_games = []
            for p_data in full_participants_data:
                player_key = normalize_player_name_key(p_data['name'])
                
                for game_from_cr in p_data.get('games', []):
                    # Уникальный ключ для дедупликации
                    game_unique_key = (tournament_id, game_from_cr['round'], game_from_cr['board'])
                    if not game_from_cr.get('round') or not game_from_cr.get('board') or game_unique_key in processed_games:
                        continue
                        
                    opponent_key = normalize_player_name_key(game_from_cr['opponent_name'])
                    
                    # Определяем, кто играл каким цветом
                    if game_from_cr['color'] == 'w':
                        white_key, black_key = player_key, opponent_key
                    elif game_from_cr['color'] == 'b':
                        white_key, black_key = opponent_key, player_key
                    else:
                        continue # Пропускаем, если цвет не определен

                    white_perf_id = perf_map_by_key.get(white_key)
                    black_perf_id = perf_map_by_key.get(black_key)

                    if not (white_perf_id and black_perf_id): continue

                    # Ищем PGN и дату
                    pgn_game_key = tuple(sorted((white_key, black_key)))
                    pgn_moves = pgn_map.get(pgn_game_key)
                    game_date = schedule_map.get(game_from_cr['round'])
                    
                    # UPSERT логика
                    cursor.execute("SELECT id FROM games WHERE white_performance_id = ? AND black_performance_id = ? AND tournament_id = ?",
                                   (white_perf_id, black_perf_id, tournament_id))
                    existing_game = cursor.fetchone()

                    if existing_game:
                        cursor.execute("""
                            UPDATE games SET 
                                result = ?, 
                                pgn_moves = COALESCE(?, pgn_moves), 
                                game_date = COALESCE(?, game_date)
                            WHERE id = ?
                        """, (game_from_cr['result'], pgn_moves, game_date, existing_game[0]))
                    else:
                        cursor.execute("""
                            INSERT INTO games (tournament_id, white_performance_id, black_performance_id, round, board, result, pgn_moves, game_date) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (tournament_id, white_perf_id, black_perf_id, game_from_cr['round'], game_from_cr['board'], game_from_cr['result'], pgn_moves, game_date))
                    
                    processed_games.add(game_unique_key) # Помечаем партию как обработанную

            conn.commit()
            logging.info(f"--- Обновление для tnr{tnr_id} успешно завершено ---")

    except Exception as e:
        conn.rollback()
        logging.error(f"!!! Критическая ошибка при обновлении tnr{tnr_id}: {e}", exc_info=True)
    finally:
        conn.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Обновляет данные по одному турниру в базе SQLite.")
    parser.add_argument("tnr_id", type=int, help="ID турнира на chess-results (число из URL).")
    args = parser.parse_args()
    
    asyncio.run(main(args.tnr_id))