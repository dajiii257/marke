#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Тестовый скрипт для проверки Telethon
"""

import sys

print("=" * 50)
print("ТЕСТ TELETHON")
print("=" * 50)

# Проверка импорта
print("\n1. Проверка импорта telethon...")
try:
    from telethon import TelegramClient
    print("   ✅ telethon импортирован успешно")
except Exception as e:
    print(f"   ❌ Ошибка импорта telethon: {e}")
    sys.exit(1)

# Проверка импорта opentele
print("\n2. Проверка импорта opentele...")
try:
    from opentele.td import TDesktop
    from opentele.api import CreateNewSession
    print("   ✅ opentele импортирован успешно")
except Exception as e:
    print(f"   ❌ Ошибка импорта opentele: {e}")
    sys.exit(1)

# Проверка config
print("\n3. Проверка config...")
try:
    import config
    print(f"   API_ID: {config.API_ID}")
    print(f"   API_HASH: {config.API_HASH[:10]}...")
    
    if config.API_ID == 12345678 or config.API_HASH == "your_api_hash_here":
        print("   ❌ API_ID или API_HASH не настроены!")
        sys.exit(1)
    else:
        print("   ✅ API_ID и API_HASH настроены")
except Exception as e:
    print(f"   ❌ Ошибка загрузки config: {e}")
    sys.exit(1)

# Проверка создания клиента
print("\n4. Проверка создания TelegramClient...")
try:
    import os
    os.makedirs('sessions', exist_ok=True)
    
    client = TelegramClient(
        'sessions/test_session',
        config.API_ID,
        config.API_HASH
    )
    print("   ✅ TelegramClient создан успешно")
    
    # Не подключаемся, просто проверяем что создается
    
except Exception as e:
    print(f"   ❌ Ошибка создания TelegramClient: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 50)
print("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
print("=" * 50)
print("\nTelethon готов к работе. Можно запускать бота.")
