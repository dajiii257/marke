#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка что api_server.py загружается правильно
"""

import sys

print("=" * 60)
print("ТЕСТ ИМПОРТА API_SERVER")
print("=" * 60)

print("\n1. Проверка содержимого файла api_server.py...")
try:
    with open('api_server.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '🔔 /market/auth request:' in content:
        print("   ✅ В файле ЕСТЬ строка '🔔 /market/auth request:'")
    else:
        print("   ❌ В файле НЕТ строки '🔔 /market/auth request:'")
        print("   → Загрузите правильный api_server.py!")
        sys.exit(1)
        
    if '📱 Starting auth for phone:' in content:
        print("   ✅ В файле ЕСТЬ строка '📱 Starting auth for phone:'")
    else:
        print("   ❌ В файле НЕТ строки '📱 Starting auth for phone:'")
        print("   → Загрузите правильный api_server.py!")
        sys.exit(1)
        
except Exception as e:
    print(f"   ❌ Ошибка чтения файла: {e}")
    sys.exit(1)

print("\n2. Импорт модуля api_server...")
try:
    import api_server
    print("   ✅ Модуль api_server импортирован")
except Exception as e:
    print(f"   ❌ Ошибка импорта: {e}")
    sys.exit(1)

print("\n3. Проверка функции api_auth...")
try:
    import inspect
    
    # Получаем исходный код функции
    source = inspect.getsource(api_server.api_auth)
    
    if '🔔 /market/auth request:' in source:
        print("   ✅ Функция api_auth СОДЕРЖИТ логирование '🔔'")
    else:
        print("   ❌ Функция api_auth НЕ СОДЕРЖИТ логирование '🔔'")
        print("   → Python загрузил СТАРУЮ версию из кэша!")
        print("   → Перезапустите main.py!")
        sys.exit(1)
        
except Exception as e:
    print(f"   ❌ Ошибка проверки функции: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ ВСЁ ПРАВИЛЬНО!")
print("=" * 60)
print("\nФайл api_server.py загружен корректно с новым логированием.")
print("Если логи всё равно не появляются - проблема в другом месте.")
