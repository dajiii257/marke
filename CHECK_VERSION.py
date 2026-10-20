#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка версии файлов
"""

print("=" * 60)
print("ПРОВЕРКА ВЕРСИЙ ФАЙЛОВ")
print("=" * 60)

# Проверка api_server.py
print("\n1. Проверка api_server.py...")
try:
    with open('api_server.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    if '📱 Starting auth for phone:' in content:
        print("   ✅ api_server.py - НОВАЯ ВЕРСИЯ (с логированием)")
    else:
        print("   ❌ api_server.py - СТАРАЯ ВЕРСИЯ (без логирования)")
        print("   → Загрузите обновлённый api_server.py и перезапустите!")
        
except Exception as e:
    print(f"   ❌ Ошибка чтения api_server.py: {e}")

# Проверка telegram_auth.py
print("\n2. Проверка telegram_auth.py...")
try:
    with open('telegram_auth.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'OPENTELE_AVAILABLE' in content:
        print("   ✅ telegram_auth.py - НОВАЯ ВЕРСИЯ (opentele опциональный)")
    else:
        print("   ❌ telegram_auth.py - СТАРАЯ ВЕРСИЯ")
        print("   → Загрузите обновлённый telegram_auth.py и перезапустите!")
        
except Exception as e:
    print(f"   ❌ Ошибка чтения telegram_auth.py: {e}")

# Проверка database.py
print("\n3. Проверка database.py...")
try:
    with open('database.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'INSERT OR IGNORE' in content:
        print("   ✅ database.py - НОВАЯ ВЕРСИЯ (UNIQUE constraint fix)")
    else:
        print("   ❌ database.py - СТАРАЯ ВЕРСИЯ")
        print("   → Загрузите обновлённый database.py и перезапустите!")
        
except Exception as e:
    print(f"   ❌ Ошибка чтения database.py: {e}")

# Проверка config.py
print("\n4. Проверка config.py...")
try:
    import config
    
    if config.API_ID == 2040:
        print(f"   ✅ config.py - API_ID настроен: {config.API_ID}")
        print(f"   ✅ API_HASH: {config.API_HASH[:10]}...")
    else:
        print(f"   ❌ config.py - API_ID не настроен: {config.API_ID}")
        print("   → Укажите правильные API_ID и API_HASH!")
        
except Exception as e:
    print(f"   ❌ Ошибка загрузки config.py: {e}")

print("\n" + "=" * 60)
print("ПРОВЕРКА ЗАВЕРШЕНА")
print("=" * 60)
print("\nЕсли есть ❌ - загрузите обновлённые файлы и ПЕРЕЗАПУСТИТЕ сервер!")
