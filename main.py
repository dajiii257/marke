#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Matrix Market Bot - Main Entry Point
Запускает Telegram бота (aiogram) и Flask API сервер одновременно
"""

import asyncio
import sys
import os
from threading import Thread

# Принудительно отключаем буферизацию вывода
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, line_buffering=True)
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, line_buffering=True)

# Проверка наличия модулей
try:
    import config
    from database import init_database
except ImportError as e:
    print(f"❌ Ошибка импорта: {e}")
    print("Установите зависимости: pip install -r requirements.txt")
    sys.exit(1)

def run_flask_server():
    """Запустить Flask API сервер в отдельном потоке"""
    try:
        # Удаляем .pyc кэш файлы
        import os
        import glob
        for pyc in glob.glob('__pycache__/api_server*.pyc'):
            try:
                os.remove(pyc)
                print(f"🗑️ Deleted cache: {pyc}")
            except:
                pass
        
        # Принудительно удаляем кэш из sys.modules
        import sys
        for key in list(sys.modules.keys()):
            if 'api_server' in key:
                del sys.modules[key]
                print(f"🗑️ Removed from sys.modules: {key}")
        
        # Импортируем V3 - новый файл!
        from api_server_v3 import app
        
        print(f"🌐 Starting Flask API server V3 on {config.API_HOST}:{config.API_PORT}...")
        print(f"🔍 V3 loaded with full logging inside functions!")
        
        app.run(
            host=config.API_HOST,
            port=config.API_PORT,
            debug=False,
            use_reloader=False
        )
    except Exception as e:
        print(f"❌ Ошибка запуска Flask: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

async def run_bot():
    """Запустить Telegram бота"""
    try:
        from bot import dp, bot
        
        print("🤖 Starting Telegram Bot (aiogram)...")
        await dp.start_polling(bot)
    except Exception as e:
        print(f"❌ Ошибка запуска бота: {e}")
        sys.exit(1)

async def main():
    """Главная функция"""
    print("=" * 60)
    print("       Matrix Market Bot - Full Stack")
    print("       Telegram Bot (aiogram) + Flask API")
    print("=" * 60)
    
    # Создаём необходимые папки
    os.makedirs('sessions', exist_ok=True)
    os.makedirs('tdata', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    # Инициализируем БД
    try:
        await init_database()
    except Exception as e:
        print(f"❌ Ошибка инициализации БД: {e}")
        sys.exit(1)
    
    # Проверяем конфигурацию
    if not hasattr(config, 'BOT_TOKEN') or config.BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ ОШИБКА: Укажите BOT_TOKEN в config.py")
        sys.exit(1)
    
    if not hasattr(config, 'API_ID') or config.API_ID == 12345678:
        print("⚠️ ВНИМАНИЕ: Укажите API_ID в config.py (получите на my.telegram.org)")
    else:
        print(f"✅ API_ID настроен: {config.API_ID}")
    
    if not hasattr(config, 'API_HASH') or config.API_HASH == "your_api_hash_here":
        print("⚠️ ВНИМАНИЕ: Укажите API_HASH в config.py (получите на my.telegram.org)")
    else:
        print(f"✅ API_HASH настроен: {config.API_HASH[:10]}...")
    
    # Проверяем версию api_server.py
    print("\n🔍 Проверка версий файлов:")
    try:
        with open('api_server.py', 'r', encoding='utf-8') as f:
            api_content = f.read()
        if '📱 Starting auth for phone:' in api_content:
            print("   ✅ api_server.py - обновлённая версия")
        else:
            print("   ⚠️ api_server.py - старая версия (обновите!)")
    except:
        pass
    
    try:
        with open('telegram_auth.py', 'r', encoding='utf-8') as f:
            auth_content = f.read()
        if 'OPENTELE_AVAILABLE' in auth_content:
            print("   ✅ telegram_auth.py - обновлённая версия")
        else:
            print("   ⚠️ telegram_auth.py - старая версия (обновите!)")
    except:
        pass
    
    print(f"\n✅ Конфигурация:")
    print(f"   Bot Token: {config.BOT_TOKEN[:10]}...")
    print(f"   Admin IDs: {config.ADMIN_IDS}")
    print(f"   MiniApp URL: {config.MINIAPP_URL}")
    print(f"   API Host: {config.API_HOST}:{config.API_PORT}")
    print(f"   Debug Mode: {config.DEBUG_MODE}")
    
    # Запускаем Flask в отдельном потоке
    flask_thread = Thread(target=run_flask_server, daemon=True)
    flask_thread.start()
    
    print("\n" + "=" * 60)
    print("🚀 All services are running!")
    print("=" * 60)
    print("\n📡 Telegram Bot: активен (aiogram polling)")
    print(f"🌐 API Server: http://{config.API_HOST}:{config.API_PORT}")
    print(f"📱 MiniApp: {config.MINIAPP_URL}")
    print("\nНажмите Ctrl+C для остановки\n")
    
    # Запускаем бота (основной поток)
    await run_bot()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Остановка сервера...")
        print("✅ Все сервисы остановлены")
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
